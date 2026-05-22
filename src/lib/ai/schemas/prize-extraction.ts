import { z } from "zod";

/**
 * Per-distance prize block. A race lists one of these per distance that pays
 * out money (e.g. 5K, 10K, 21K), with the optional "geral" key when the prize
 * text does not differentiate by distance.
 *
 * All money values in BRL (integer reais; no cents). `null` means "the source
 * text didn't specify this", not "zero".
 */
export const distancePrizeSchema = z.object({
  distance: z
    .string()
    .min(1)
    .max(32)
    .describe(
      "Distância em formato curto e minúsculo: '5k', '10k', '21k', '42k', etc. Use 'geral' se a premiação não diferencia por distância.",
    ),
  total: z
    .number()
    .int()
    .nonnegative()
    .nullable()
    .describe(
      "Soma da premiação em dinheiro nessa distância (BRL inteiro, sem centavos). null se não estimável.",
    ),
  top_prize: z
    .number()
    .int()
    .nonnegative()
    .nullable()
    .describe(
      "Maior prêmio individual nessa distância (geralmente 1º colocado, BRL inteiro). null se desconhecido.",
    ),
  top_n: z
    .number()
    .int()
    .positive()
    .nullable()
    .describe("Quantos colocados são premiados nessa distância."),
});

/**
 * Structured representation of a race's prize pool. The LLM extracts this from
 * the free-text `prize_details` so we can power per-distance badges, a future
 * "premiação ≥ R$X" filter, and Sprint 4's personalized recommendation that
 * matches prizes against the runner's preferred distance.
 */
export const prizeStructuredSchema = z.object({
  by_distance: z
    .array(distancePrizeSchema)
    .describe(
      "Lista de blocos de premiação, um por distância. Vazio se não houver premiação em dinheiro.",
    ),
  by_category: z
    .boolean()
    .describe(
      "True se a premiação é dividida por faixa etária / gênero / categoria além do geral.",
    ),
  has_money: z
    .boolean()
    .describe("True se há premiação em dinheiro de qualquer tipo."),
  has_trophy: z.boolean().describe("True se há troféu / medalha como prêmio."),
  notes: z
    .string()
    .max(280)
    .nullable()
    .describe(
      "Observação curta em PT-BR sobre regras especiais (ex: kit, cupom, sorteio). null se não houver.",
    ),
});

export type DistancePrize = z.infer<typeof distancePrizeSchema>;
export type PrizeStructured = z.infer<typeof prizeStructuredSchema>;
