// ============================================================================
// Organizer Subscription Helpers
// ============================================================================
// All writes use createAdminClient() (service_role) to bypass RLS.
// ============================================================================

import { createAdminClient } from "@/lib/supabase/admin";
import { futureUtc } from "@/lib/date";
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
    .gt("current_period_end", new Date().toISOString())
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
export async function useSubscriptionPromotion(
  subscriptionId: string,
  raceId: string
): Promise<boolean> {
  const admin = createAdminClient();

  // 1. Read current state
  const { data: sub } = await admin
    .from("organizer_subscriptions")
    .select("promotions_used, promotions_limit")
    .eq("id", subscriptionId)
    .single();

  if (!sub || sub.promotions_used >= sub.promotions_limit) {
    return false;
  }

  // 2. Optimistic-lock increment: only succeeds if promotions_used hasn't changed
  const { data: updated, error: updateError } = await admin
    .from("organizer_subscriptions")
    .update({ promotions_used: sub.promotions_used + 1 })
    .eq("id", subscriptionId)
    .eq("promotions_used", sub.promotions_used)
    .select("id")
    .maybeSingle();

  if (updateError || !updated) return false;

  // 3. Track which race used this credit
  const { error: trackError } = await admin
    .from("subscription_promotions")
    .insert({ subscription_id: subscriptionId, race_id: raceId });

  if (trackError) {
    // Unique constraint violation = race already promoted under this sub (idempotent)
    if (trackError.code === "23505") return true;
    console.error("[Subscription] Failed to track promotion:", trackError);
  }

  return true;
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
      current_period_start: new Date().toISOString(),
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
