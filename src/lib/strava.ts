/**
 * Strava API utilities for OAuth token management and deauthorization.
 * Used by the disconnect API and webhook handler.
 */

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
