import { z } from "zod";
import { raceExtractionSchema } from "./race-extraction";

/**
 * Output of the admin-on-demand "Analisar com IA" task on a race suggestion.
 *
 * verdict drives the admin badge:
 *  - "legit"     ✓ Real race, no duplicate found
 *  - "duplicate" 🔄 Semantic match against an existing race in the catalog
 *  - "suspect"   ⚠ Likely spam / not a race / out of region
 *  - "uncertain" ❓ LLM could not decide with confidence
 */
export const suggestionVerdictEnum = z.enum([
  "legit",
  "duplicate",
  "suspect",
  "uncertain",
]);

export const duplicateMatchSchema = z.object({
  race_id: z.string().uuid(),
  race_name: z.string(),
  race_date: z.string().nullable(),
  similarity: z.number(),
});

export const suggestionAnalysisSchema = z.object({
  verdict: suggestionVerdictEnum.describe(
    "Veredito do moderador IA. 'legit', 'duplicate', 'suspect' ou 'uncertain'.",
  ),
  confidence: z
    .number()
    .min(0)
    .max(1)
    .describe("Confiança do veredito entre 0 e 1."),
  summary: z
    .string()
    .min(1)
    .max(280)
    .describe(
      "Resumo de uma linha em PT-BR. Inclui o ponto principal (legítima, suspeita, duplicada) e fato relevante.",
    ),
  flags: z
    .array(z.string().min(1).max(40))
    .describe(
      "Sinais detectados: 'past_date', 'out_of_region', 'missing_link', 'spam_keywords', 'broken_link', etc.",
    ),
  duplicate_of: duplicateMatchSchema
    .nullable()
    .describe(
      "Quando verdict='duplicate', referência à corrida existente. null nos outros casos.",
    ),
  extracted: raceExtractionSchema
    .nullable()
    .describe(
      "Campos extraídos do link da sugestão (se houver). null se não houver link ou extração falhou.",
    ),
});

export type SuggestionVerdict = z.infer<typeof suggestionVerdictEnum>;
export type DuplicateMatch = z.infer<typeof duplicateMatchSchema>;
export type SuggestionAnalysis = z.infer<typeof suggestionAnalysisSchema>;

/**
 * Subset of the analysis the LLM is asked to produce in a single call.
 * Duplicate match and extracted fields are computed outside the LLM and
 * merged in by analyzeSuggestion.
 */
export const suggestionVerdictSchema = z.object({
  verdict: suggestionVerdictEnum,
  confidence: z.number().min(0).max(1),
  summary: z.string().min(1).max(280),
  flags: z.array(z.string().min(1).max(40)),
});

export type SuggestionVerdictOutput = z.infer<typeof suggestionVerdictSchema>;
