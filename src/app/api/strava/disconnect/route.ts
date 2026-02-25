import { NextResponse } from "next/server";
import { requireAuth } from "@/lib/auth";
import { createAdminClient } from "@/lib/supabase/admin";
import {
  deauthorizeFromStrava,
  refreshStravaToken,
  cleanupStravaProfileData,
} from "@/lib/strava";

/**
 * POST /api/strava/disconnect
 * Allows an authenticated user to disconnect their Strava account.
 * Calls Strava deauthorize API, then cleans up local data.
 */
export async function POST() {
  const authResult = await requireAuth();
  if (authResult instanceof NextResponse) return authResult;
  const { user } = authResult;

  const admin = createAdminClient();

  // Get stored tokens
  const { data: tokens } = await admin
    .from("strava_tokens")
    .select("access_token, refresh_token, expires_at")
    .eq("user_id", user.id)
    .maybeSingle();

  if (!tokens) {
    return NextResponse.json(
      { error: "Strava not connected" },
      { status: 404 }
    );
  }

  // Ensure token is fresh (access tokens expire after 6 hours)
  let accessToken = tokens.access_token;
  const now = Math.floor(Date.now() / 1000);

  if (tokens.expires_at <= now) {
    const refreshed = await refreshStravaToken(tokens.refresh_token);
    if (refreshed) {
      accessToken = refreshed.access_token;
      // Persist the new tokens (old refresh token is now invalid)
      await admin
        .from("strava_tokens")
        .update({
          access_token: refreshed.access_token,
          refresh_token: refreshed.refresh_token,
          expires_at: refreshed.expires_at,
        })
        .eq("user_id", user.id);
    }
    // If refresh fails, still try deauth with the old token
  }

  // Call Strava deauthorize API (invalidates all tokens on Strava side)
  await deauthorizeFromStrava(accessToken);

  // Delete stored tokens
  await admin.from("strava_tokens").delete().eq("user_id", user.id);

  // Clean up all Strava-originated profile data (avatar, name, metadata)
  await cleanupStravaProfileData(admin, user.id);

  return NextResponse.json({ disconnected: true });
}
