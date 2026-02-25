import { NextResponse } from "next/server";
import { requireAuth } from "@/lib/auth";
import { createAdminClient } from "@/lib/supabase/admin";
import { deauthorizeFromStrava, refreshStravaToken } from "@/lib/strava";

/**
 * DELETE /api/account
 * Permanently deletes the authenticated user's account and all associated data.
 * All FK references use ON DELETE CASCADE, so deleting the auth user cleans everything.
 */
export async function DELETE() {
  const authResult = await requireAuth();
  if (authResult instanceof NextResponse) return authResult;
  const { user } = authResult;

  const admin = createAdminClient();

  // If Strava is connected, revoke tokens on Strava's side first
  const { data: stravaTokens } = await admin
    .from("strava_tokens")
    .select("access_token, refresh_token, expires_at")
    .eq("user_id", user.id)
    .maybeSingle();

  if (stravaTokens) {
    let accessToken = stravaTokens.access_token;
    const now = Math.floor(Date.now() / 1000);

    if (stravaTokens.expires_at <= now) {
      const refreshed = await refreshStravaToken(stravaTokens.refresh_token);
      if (refreshed) accessToken = refreshed.access_token;
    }

    // Best-effort: don't block deletion if Strava deauth fails
    await deauthorizeFromStrava(accessToken).catch(() => {});
  }

  // Delete avatar from Storage (best-effort)
  const { data: files } = await admin.storage
    .from("avatars")
    .list(user.id, { limit: 10 });

  if (files && files.length > 0) {
    const paths = files.map((f) => `${user.id}/${f.name}`);
    await admin.storage.from("avatars").remove(paths);
  }

  // Delete the auth user — cascades to profiles, rsvps, strava_tokens,
  // payment_orders, payment_customers, push_subscriptions, race_clicks, etc.
  const { error } = await admin.auth.admin.deleteUser(user.id);

  if (error) {
    console.error(`[Account Delete] Failed to delete user ${user.id}:`, error);
    return NextResponse.json(
      { error: "Erro ao excluir conta" },
      { status: 500 }
    );
  }

  console.info(`[Account Delete] User ${user.id} deleted successfully`);
  return NextResponse.json({ deleted: true });
}
