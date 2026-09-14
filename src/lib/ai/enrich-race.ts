import { createAdminClient } from "@/lib/supabase/admin";
import { extractPrizeStructured } from "./extract-prize";
import { buildRaceFingerprint, embedText } from "./embed";
import { isAIEnabled } from "./provider";

interface EnrichResult {
  prizeUpdated: boolean;
  embeddingUpdated: boolean;
  skipped: boolean;
}

/**
 * Run AI enrichment on a race that was just created/edited:
 * - Extract structured prize info from `prize_details` into `prize_structured`
 * - Compute and store the fingerprint embedding for scraper deduplication
 *
 * Designed to be safe to await from inside an API route (graceful failure,
 * never throws — degrades to a no-op when AI is disabled or a call fails).
 */
export async function enrichRace(raceId: string): Promise<EnrichResult> {
  const result: EnrichResult = {
    prizeUpdated: false,
    embeddingUpdated: false,
    skipped: false,
  };

  if (!isAIEnabled()) {
    result.skipped = true;
    return result;
  }

  const supabase = createAdminClient();
  const { data: race, error } = await supabase
    .from("races")
    .select("id, name, city, date, organizer, prize_type, prize_details, distances")
    .eq("id", raceId)
    .single();

  if (error || !race) {
    console.error(`[ai/enrich-race] Race ${raceId} not found:`, error);
    result.skipped = true;
    return result;
  }

  const updates: Record<string, unknown> = {};

  const prize = await extractPrizeStructured({
    prizeType: race.prize_type as "money" | "trophy" | "both" | "none",
    prizeDetails: race.prize_details,
    distances: race.distances,
  });
  if (prize) {
    updates.prize_structured = prize;
    updates.prize_structured_updated_at = new Date().toISOString();
    result.prizeUpdated = true;
  }

  try {
    const fingerprint = buildRaceFingerprint({
      name: race.name,
      city: race.city,
      date: race.date,
      organizer: race.organizer,
    });
    const embedding = await embedText(fingerprint);
    // pgvector via supabase-js accepts the raw number[] as JSON array; do NOT
    // serialize to "[...]" text here, that goes through PostgREST as a string
    // and fails the implicit cast to vector(N).
    updates.embedding = embedding;
    result.embeddingUpdated = true;
  } catch (err) {
    console.warn(`[ai/enrich-race] Embedding failed for race ${raceId}:`, err);
  }

  if (Object.keys(updates).length > 0) {
    const { error: updateError } = await supabase
      .from("races")
      .update(updates)
      .eq("id", raceId);
    if (updateError) {
      console.error(
        `[ai/enrich-race] Update failed for race ${raceId}:`,
        updateError,
      );
      result.prizeUpdated = false;
      result.embeddingUpdated = false;
    } else {
      console.log(
        `[ai/enrich-race] Race ${raceId} enriched: prize=${result.prizeUpdated} embedding=${result.embeddingUpdated}`,
      );
    }
  }

  return result;
}
