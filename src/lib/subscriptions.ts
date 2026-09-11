// ============================================================================
// Organizer Subscription Helpers
// ============================================================================
// All writes use createAdminClient() (service_role) to bypass RLS.
// ============================================================================

import { createAdminClient } from "@/lib/supabase/admin";
import { futureUtc, utcNow } from "@/lib/date";
import {
  SUBSCRIPTION_TIERS,
  type SubscriptionTier,
  type OrganizerSubscription,
} from "@/types/subscription";

const SUBSCRIPTION_DAYS = 30;

/**
 * Returns the user's active subscription, or null if none / expired.
 */
export async function getActiveSubscription(
  userId: string
): Promise<OrganizerSubscription | null> {
  const admin = createAdminClient();
  const { data } = await admin
    .from("organizer_subscriptions")
    .select("*")
    .eq("user_id", userId)
    .eq("status", "active")
    .gt("current_period_end", utcNow())
    .maybeSingle();

  return (data as OrganizerSubscription) ?? null;
}

/**
 * Whether the subscription still has promotion credits available.
 */
export function canPromoteWithSubscription(
  sub: OrganizerSubscription
): boolean {
  return sub.promotions_used < sub.promotions_limit;
}

/**
 * Consume one promotion credit and track the race.
 * Uses optimistic locking (eq on current promotions_used) to prevent races.
 * Returns true if successful, false if limit was already reached.
 */
export async function consumeSubscriptionPromotion(
  subscriptionId: string,
  raceId: string,
  userId: string,
  promotedUntil: string,
): Promise<boolean> {
  const admin = createAdminClient();
  const { data, error } = await admin.rpc("consume_subscription_promotion", {
    p_subscription_id: subscriptionId,
    p_race_id: raceId,
    p_user_id: userId,
    p_promoted_until: promotedUntil,
  });
  if (error) {
    console.error("[Subscription] Failed to consume promotion:", error);
    return false;
  }
  return data === true;
}

/**
 * Creates a new subscription or replaces an expired one.
 */
export async function createSubscription(
  userId: string,
  tier: SubscriptionTier,
  paymentOrderId: string
): Promise<void> {
  const admin = createAdminClient();
  const config = SUBSCRIPTION_TIERS[tier];
  const periodEnd = futureUtc(SUBSCRIPTION_DAYS);

  // Delete any expired subscription for this user first (UNIQUE constraint)
  await admin
    .from("organizer_subscriptions")
    .delete()
    .eq("user_id", userId)
    .neq("status", "active");

  const { error } = await admin.from("organizer_subscriptions").upsert(
    {
      user_id: userId,
      tier,
      status: "active",
      payment_order_id: paymentOrderId,
      amount: config.priceInCentavos,
      promotions_limit: config.promotionsPerMonth,
      promotions_used: 0,
      current_period_start: utcNow(),
      current_period_end: periodEnd,
    },
    { onConflict: "user_id" }
  );

  if (error) {
    throw new Error(
      `Failed to create subscription for user ${userId}: ${error.message}`
    );
  }
}
