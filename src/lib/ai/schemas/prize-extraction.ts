import { z } from "zod";

/**
 * Structured representation of a race's prize pool. The LLM extracts this from
 * the free-text `prize_details` so we can power filters like "premiação ≥ R$X"
 * and badges like "💰 R$ 1.000 em prêmios" without re-parsing every render.
 *
 * All money values in BRL (integer reais; no cents). `null` means "the source
 * text didn't specify this", not "zero".
 */
export const prizeStructuredSchema = z.object({
  total_money_brl: z
    .number()
    .int()
    .nonnegative()
    .nullable()
    .describe(
      "Soma total de premiação em dinheiro (BRL, sem centavos). null se a fonte não permite estimar.",
    ),
  top_n: z
    .number()
    .int()
    .positive()
    .nullable()
    .describe("Quantos colocados recebem prêmio na categoria geral."),
  by_category: z
    .boolean()
    .describe(
      "True se a premiação é dividida por faixa etária / gênero / categoria além do geral.",
    ),
  max_per_position: z
    .number()
    .int()
    .nonnegative()
    .nullable()
    .describe("Maior valor pago a um único atleta (BRL). null se desconhecido."),
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

export type PrizeStructured = z.infer<typeof prizeStructuredSchema>;
