import crypto from "node:crypto";
import { createAdminClient } from "@/lib/supabase/admin";

/**
 * Distributed fixed-window limiter. Raw identifiers are hashed before storage.
 * Failures are fail-open so a database incident does not take down every route.
 */
export async function rateLimit(
  key: string,
  { max, windowMs }: { max: number; windowMs: number }
): Promise<{ limited: boolean }> {
  const keyHash = crypto.createHash("sha256").update(key).digest("hex");
  const admin = createAdminClient();
  const { data, error } = await admin.rpc("consume_rate_limit", {
    p_key_hash: keyHash,
    p_max: max,
    p_window_seconds: Math.max(1, Math.ceil(windowMs / 1000)),
  });

  if (error) {
    console.error("[RateLimit] Distributed limiter unavailable:", error.message);
    return { limited: false };
  }

  return { limited: data === true };
}
