/**
 * Strava API utilities for OAuth token management and deauthorization.
 * Used by the disconnect API and webhook handler.
 */

import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "@/types/database";

/**
 * Revoke access to Strava for a user.
 * Invalidates ALL refresh and access tokens for the athlete.
 * After this, Strava also fires a webhook deauth event.
 */
export async function deauthorizeFromStrava(
  accessToken: string
): Promise<boolean> {
  const res = await fetch("https://www.strava.com/oauth/deauthorize", {
    method: "POST",
    headers: { Authorization: `Bearer ${accessToken}` },
  });
  return res.ok;
}

/**
 * Refresh a Strava access token using the refresh token.
 * Access tokens expire after 6 hours.
 * Important: the old refresh token is invalidated immediately when a new one is issued.
 */
export async function refreshStravaToken(refreshToken: string): Promise<{
  access_token: string;
  refresh_token: string;
  expires_at: number;
} | null> {
  const res = await fetch("https://www.strava.com/oauth/token", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      client_id: process.env.NEXT_PUBLIC_STRAVA_CLIENT_ID,
      client_secret: process.env.STRAVA_CLIENT_SECRET,
      refresh_token: refreshToken,
      grant_type: "refresh_token",
    }),
  });

  if (!res.ok) return null;
  return res.json();
}

/**
 * Remove all Strava-originated data from a user's profile.
 * Used by both the disconnect API and the deauthorization webhook.
 * Clears avatar_url, full_name, strava_athlete_id from profiles,
 * removes Strava metadata from auth user, and deletes avatar from Storage.
 */
export async function cleanupStravaProfileData(
  admin: SupabaseClient<Database>,
  userId: string
) {
  // Clear Strava-originated fields from profile
  await admin
    .from("profiles")
    .update({ avatar_url: null, full_name: null, strava_athlete_id: null })
    .eq("id", userId);

  // Clear Strava-specific metadata from auth user
  const { data: userData } = await admin.auth.admin.getUserById(userId);
  if (userData?.user?.user_metadata?.provider === "strava") {
    await admin.auth.admin.updateUserById(userId, {
      user_metadata: {
        ...userData.user.user_metadata,
        strava_id: null,
        provider: null,
        avatar_url: null,
        full_name: null,
      },
    });
  }

  // Delete avatar file from Storage (best-effort)
  const { data: files } = await admin.storage
    .from("avatars")
    .list(userId, { limit: 10 });

  if (files && files.length > 0) {
    const paths = files.map((f) => `${userId}/${f.name}`);
    await admin.storage.from("avatars").remove(paths);
  }
}
