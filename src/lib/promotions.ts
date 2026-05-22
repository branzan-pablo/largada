// Promotion tiers — pricing and duration for "Destacar corrida".
//
// Express: entry-tier, baixa fricção. 7 dias de topo da listagem.
// Standard: tier classico. 30 dias.
//
// Os preços sao fonte unica usada no endpoint de promote, no webhook
// (para calcular promoted_until baseado no tier do order metadata) e
// no card de promocao no frontend.

export type PromotionTier = "express" | "standard";

interface TierConfig {
  label: string;
  priceCentavos: number;
  durationDays: number;
}

export const PROMOTION_TIERS: Record<PromotionTier, TierConfig> = {
  express: {
    label: "Express",
    priceCentavos: 4900, // R$ 49,00
    durationDays: 7,
  },
  standard: {
    label: "Total",
    priceCentavos: 14900, // R$ 149,00
    durationDays: 30,
  },
};

export const DEFAULT_PROMOTION_TIER: PromotionTier = "standard";

/**
 * Le o tier do metadata do order com fallback para Standard.
 * Pedidos antigos (pre-tiers) nao tem metadata.tier — caem no Standard.
 */
export function getTierFromMetadata(
  metadata: Record<string, unknown> | null | undefined
): PromotionTier {
  const tier = metadata?.tier;
  if (tier === "express" || tier === "standard") return tier;
  return DEFAULT_PROMOTION_TIER;
}

/**
 * Resolve duracao em dias a partir do metadata. Util para webhook/billing-check
 * que precisam calcular promoted_until.
 */
export function getDurationDaysFromMetadata(
  metadata: Record<string, unknown> | null | undefined
): number {
  const tier = getTierFromMetadata(metadata);
  return PROMOTION_TIERS[tier].durationDays;
}
