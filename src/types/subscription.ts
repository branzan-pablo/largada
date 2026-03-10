// ============================================================================
// Organizer Subscription Types
// ============================================================================

export const SubscriptionTier = {
  ORGANIZADOR: "organizador",
  ORGANIZADOR_PRO: "organizador_pro",
} as const;
export type SubscriptionTier =
  (typeof SubscriptionTier)[keyof typeof SubscriptionTier];

export interface SubscriptionConfig {
  tier: SubscriptionTier;
  label: string;
  priceInCentavos: number;
  priceDisplay: string;
  promotionsPerMonth: number;
}

export const SUBSCRIPTION_TIERS: Record<SubscriptionTier, SubscriptionConfig> =
  {
    organizador: {
      tier: "organizador",
      label: "Organizador",
      priceInCentavos: 34900,
      priceDisplay: "R$ 349,00",
      promotionsPerMonth: 3,
    },
    organizador_pro: {
      tier: "organizador_pro",
      label: "Organizador Pro",
      priceInCentavos: 69900,
      priceDisplay: "R$ 699,00",
      promotionsPerMonth: 8,
    },
  };

export interface OrganizerSubscription {
  id: string;
  user_id: string;
  tier: SubscriptionTier;
  status: "active" | "expired";
  payment_order_id: string | null;
  amount: number;
  promotions_limit: number;
  promotions_used: number;
  current_period_start: string;
  current_period_end: string;
  created_at: string;
  updated_at: string;
}
