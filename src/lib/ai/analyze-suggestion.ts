import { generateObject } from "ai";
import { createAdminClient } from "@/lib/supabase/admin";
import { models, isAIEnabled } from "./provider";
import { withTelemetry } from "./observability";
import { embedText, buildRaceFingerprint } from "./embed";
import { extractRaceFromUrl } from "./extract-race";
import {
  suggestionAnalysisSchema,
  suggestionVerdictSchema,
  type SuggestionAnalysis,
  type DuplicateMatch,
} from "./schemas/suggestion-analysis";
import {
  ANALYZE_SUGGESTION_SYSTEM,
  buildAnalyzeSuggestionPrompt,
} from "./prompts/analyze-suggestion";
import type { RaceExtraction } from "./schemas/race-extraction";
import { todayInBrazil } from "@/lib/date";

const DUPLICATE_THRESHOLD = 0.85;

function summarizeExtraction(extracted: RaceExtraction | null): string | null {
  if (!extracted) return null;
  const parts: string[] = [];
  if (extracted.name) parts.push(`nome="${extracted.name}"`);
  if (extracted.date) parts.push(`data=${extracted.date}`);
  if (extracted.city) parts.push(`cidade=${extracted.city}${extracted.state ? "-" + extracted.state : ""}`);
  if (extracted.distances && extracted.distances.length > 0)
    parts.push(`distâncias=[${extracted.distances.join(", ")}]`);
  if (extracted.organizer) parts.push(`organizador=${extracted.organizer}`);
  if (extracted.registrationLink) parts.push(`link_inscricao=${extracted.registrationLink}`);
  return parts.length > 0 ? parts.join(", ") : null;
}

/**
 * Run the full moderation pipeline on a race suggestion:
 *  1. fingerprint + embed the suggestion
 *  2. semantic dedup against existing races (date-aware when possible)
 *  3. best-effort pre-extraction from the suggestion link
 *  4. LLM verdict (legit / duplicate / suspect / uncertain)
 *  5. persist to race_suggestions.ai_analysis
 *
 * Designed to be called from an admin endpoint (rate-limited there). Returns
 * the persisted analysis or null on hard failure / AI disabled.
 */
export async function analyzeSuggestion(
  suggestionId: string,
): Promise<SuggestionAnalysis | null> {
  if (!isAIEnabled()) return null;

  const supabase = createAdminClient();
  const { data: suggestion, error } = await supabase
    .from("race_suggestions")
    .select("id, name, city, state, date, link, notes")
    .eq("id", suggestionId)
    .single();

  if (error || !suggestion) {
    console.error(`[ai/analyze-suggestion] not found ${suggestionId}`, error);
    return null;
  }

  // Step 1 + 2: semantic duplicate hint.
  let duplicateHit: DuplicateMatch | null = null;
  try {
    const fingerprint = buildRaceFingerprint({
      name: suggestion.name,
      city: suggestion.city,
      date: suggestion.date,
      organizer: null,
    });
    const embedding = await embedText(fingerprint);

    if (suggestion.date) {
      const { data: matches } = await supabase.rpc("match_races_semantic", {
        query_embedding: embedding as unknown as string,
        query_date: suggestion.date,
        match_threshold: DUPLICATE_THRESHOLD,
        match_count: 3,
        date_window_days: 7,
      });
      const top = matches?.[0];
      if (top) {
        duplicateHit = {
          race_id: top.id,
          race_name: top.name,
          race_date: top.date,
          similarity: top.similarity,
        };
      }
    } else {
      const { data: matches } = await supabase.rpc(
        "match_races_semantic_any_date",
        {
          query_embedding: embedding as unknown as string,
          match_threshold: DUPLICATE_THRESHOLD,
          match_count: 3,
        },
      );
      const top = matches?.[0];
      if (top) {
        duplicateHit = {
          race_id: top.id,
          race_name: top.name,
          race_date: top.date,
          similarity: top.similarity,
        };
      }
    }
  } catch (err) {
    console.warn(
      `[ai/analyze-suggestion] dedup failed for ${suggestionId}:`,
      err,
    );
  }

  // Step 3: best-effort link pre-extraction.
  let extracted: RaceExtraction | null = null;
  if (suggestion.link) {
    try {
      extracted = await extractRaceFromUrl(suggestion.link);
    } catch (err) {
      console.warn(
        `[ai/analyze-suggestion] extract failed for ${suggestionId}:`,
        err,
      );
    }
  }

  // Step 4: LLM verdict.
  let verdict: SuggestionAnalysis["verdict"] = "uncertain";
  let confidence = 0.5;
  let summary = "Análise indisponível";
  let flags: string[] = [];
  try {
    const out = await withTelemetry(
      "analyze_suggestion",
      async () => {
        const { object, usage } = await generateObject({
          model: models.extract,
          schema: suggestionVerdictSchema,
          system: ANALYZE_SUGGESTION_SYSTEM,
          prompt: buildAnalyzeSuggestionPrompt({
            name: suggestion.name,
            city: suggestion.city,
            state: suggestion.state,
            date: suggestion.date,
            link: suggestion.link,
            notes: suggestion.notes,
            duplicateHit: duplicateHit
              ? {
                  race_name: duplicateHit.race_name,
                  race_date: duplicateHit.race_date,
                  similarity: duplicateHit.similarity,
                }
              : null,
            extractedSummary: summarizeExtraction(extracted),
            today: todayInBrazil(),
          }),
        });
        return {
          result: object,
          usage: {
            promptTokens: usage?.inputTokens,
            completionTokens: usage?.outputTokens,
            totalTokens: usage?.totalTokens,
          },
          model: "gemini-2.5-flash",
        };
      },
      { suggestion_id: suggestionId },
    );
    verdict = out.verdict;
    confidence = out.confidence;
    summary = out.summary;
    flags = out.flags;
  } catch (err) {
    console.error(
      `[ai/analyze-suggestion] verdict failed for ${suggestionId}:`,
      err,
    );
  }

  // The LLM is forbidden from declaring duplicate on its own, but it may have
  // missed the hint. Force the verdict when the semantic match is strong.
  if (duplicateHit && duplicateHit.similarity >= 0.92) {
    verdict = "duplicate";
    confidence = Math.max(confidence, 0.9);
    if (!summary.toLowerCase().includes("duplicat")) {
      summary = `Duplicata provável: ${duplicateHit.race_name}`;
    }
  }

  const analysis: SuggestionAnalysis = {
    verdict,
    confidence,
    summary,
    flags,
    duplicate_of: duplicateHit,
    extracted,
  };

  // Validate before persisting so a broken LLM output never lands in the DB.
  const parsed = suggestionAnalysisSchema.safeParse(analysis);
  if (!parsed.success) {
    console.error(
      `[ai/analyze-suggestion] analysis failed schema validation for ${suggestionId}`,
      parsed.error.issues,
    );
    return null;
  }

  await supabase
    .from("race_suggestions")
    .update({
      ai_analysis: parsed.data,
      ai_analysis_updated_at: new Date().toISOString(),
    })
    .eq("id", suggestionId);

  return parsed.data;
}
