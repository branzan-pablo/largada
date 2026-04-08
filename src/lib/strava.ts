/**
 * Strava API utilities for OAuth token management, deauthorization,
 * and athlete activity/stats fetching.
 */

import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "@/types/database";

const STRAVA_API = "https://www.strava.com/api/v3";

/** Cache TTL in milliseconds (6 hours) */
const CACHE_TTL_MS = 6 * 60 * 60 * 1000;

export interface StravaActivity {
  id: number;
  name: string;
  type: string;
  sport_type: string;
  distance: number; // meters
  moving_time: number; // seconds
  elapsed_time: number; // seconds
  total_elevation_gain: number;
  start_date: string;
  start_date_local: string;
  average_speed: number; // m/s
  max_speed: number; // m/s
  average_heartrate?: number;
  max_heartrate?: number;
  suffer_score?: number;
  pr_count: number;
  achievement_count: number;
  workout_type?: number; // 0=default, 1=race, 2=long run, 3=workout
  has_heartrate: boolean;
  kudos_count: number;
  map?: { summary_polyline: string };
}

export interface StravaAthleteStats {
  recent_run_totals: StravaTotals;
  all_run_totals: StravaTotals;
  ytd_run_totals: StravaTotals;
  recent_ride_totals: StravaTotals;
  all_ride_totals: StravaTotals;
  ytd_ride_totals: StravaTotals;
}

interface StravaTotals {
  count: number;
  distance: number; // meters
  moving_time: number; // seconds
  elapsed_time: number;
  elevation_gain: number;
  achievement_count?: number;
}

export interface StravaBestEffort {
  id: number;
  name: string; // "400m", "1k", "5k", "10k", "Half-Marathon", "Marathon", etc.
  distance: number; // meters
  moving_time: number; // seconds
  elapsed_time: number; // seconds
  start_date_local: string;
  pr_rank: number | null; // 1=best, 2=2nd, 3=3rd, null=not top 3
}

export interface CachedAthleteData {
  activities: StravaActivity[];
  stats: StravaAthleteStats | null;
  personal_records?: StravaBestEffort[];
  synced_at: string;
  needs_scope_upgrade: boolean;
}

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

/**
 * Get a valid Strava access token for a user, refreshing if expired.
 * Returns null if no tokens exist or refresh fails.
 */
export async function getValidAccessToken(
  admin: SupabaseClient<Database>,
  userId: string
): Promise<{ accessToken: string; athleteId: number; scope: string } | null> {
  const { data: tokens } = await admin
    .from("strava_tokens")
    .select("access_token, refresh_token, expires_at, athlete_id, scope")
    .eq("user_id", userId)
    .single();

  if (!tokens) return null;

  const now = Math.floor(Date.now() / 1000);

  if (tokens.expires_at > now) {
    return {
      accessToken: tokens.access_token,
      athleteId: tokens.athlete_id,
      scope: tokens.scope,
    };
  }

  // Token expired — refresh
  const refreshed = await refreshStravaToken(tokens.refresh_token);
  if (!refreshed) return null;

  await admin
    .from("strava_tokens")
    .update({
      access_token: refreshed.access_token,
      refresh_token: refreshed.refresh_token,
      expires_at: refreshed.expires_at,
    })
    .eq("user_id", userId);

  return {
    accessToken: refreshed.access_token,
    athleteId: tokens.athlete_id,
    scope: tokens.scope,
  };
}

/**
 * Fetch athlete activities from Strava API.
 * Returns up to 200 most recent Run/Walk activities.
 */
async function fetchStravaActivities(
  accessToken: string
): Promise<StravaActivity[]> {
  const allActivities: StravaActivity[] = [];
  let page = 1;
  const perPage = 100;
  const maxPages = 2; // 200 activities max

  while (page <= maxPages) {
    const res = await fetch(
      `${STRAVA_API}/athlete/activities?page=${page}&per_page=${perPage}`,
      { headers: { Authorization: `Bearer ${accessToken}` } }
    );

    if (!res.ok) break;

    const activities: StravaActivity[] = await res.json();
    if (activities.length === 0) break;

    // Filter to running-related activities
    const runs = activities.filter((a) =>
      ["Run", "VirtualRun", "TrailRun", "Walk"].includes(a.type)
    );
    allActivities.push(...runs);

    if (activities.length < perPage) break;
    page++;
  }

  return allActivities;
}

/**
 * Fetch athlete stats (totals, records) from Strava API.
 */
async function fetchStravaStats(
  accessToken: string,
  athleteId: number
): Promise<StravaAthleteStats | null> {
  const res = await fetch(`${STRAVA_API}/athletes/${athleteId}/stats`, {
    headers: { Authorization: `Bearer ${accessToken}` },
  });

  if (!res.ok) return null;
  return res.json();
}

/** Standard distances we care about for personal records */
export const BEST_EFFORT_DISTANCES: Record<string, string> = {
  "1k": "1K",
  "5k": "5K",
  "10k": "10K",
  "Half-Marathon": "21K",
  "30k": "30K",
  "Marathon": "42K",
};

/**
 * Fetch detailed activity data including best_efforts.
 */
async function fetchActivityBestEfforts(
  accessToken: string,
  activityId: number
): Promise<StravaBestEffort[]> {
  const res = await fetch(`${STRAVA_API}/activities/${activityId}`, {
    headers: { Authorization: `Bearer ${accessToken}` },
  });

  if (!res.ok) return [];

  const detail = await res.json();
  const efforts: StravaBestEffort[] = (detail.best_efforts ?? [])
    .filter((e: { name: string }) => e.name in BEST_EFFORT_DISTANCES)
    .map((e: { id: number; name: string; distance: number; moving_time: number; elapsed_time: number; start_date_local: string; pr_rank: number | null }) => ({
      id: e.id,
      name: e.name,
      distance: e.distance,
      moving_time: e.moving_time,
      elapsed_time: e.elapsed_time,
      start_date_local: e.start_date_local,
      pr_rank: e.pr_rank,
    }));

  return efforts;
}

/**
 * Fetch best efforts for activities that have PRs.
 * Aggregates to keep only the best (pr_rank=1 or fastest) per distance.
 */
async function fetchPersonalRecords(
  accessToken: string,
  activities: StravaActivity[]
): Promise<StravaBestEffort[]> {
  // Only fetch details for activities with PRs to minimize API calls
  const prActivities = activities
    .filter((a) => a.pr_count > 0 && ["Run", "VirtualRun", "TrailRun"].includes(a.type))
    .slice(0, 30); // Cap at 30 to respect rate limits

  if (prActivities.length === 0) return [];

  // Fetch in batches of 10 to avoid rate limiting
  const allEfforts: StravaBestEffort[] = [];
  for (let i = 0; i < prActivities.length; i += 10) {
    const batch = prActivities.slice(i, i + 10);
    const results = await Promise.all(
      batch.map((a) => fetchActivityBestEfforts(accessToken, a.id))
    );
    allEfforts.push(...results.flat());
  }

  // Keep only the best (fastest moving_time) per distance name
  const bestByDistance = new Map<string, StravaBestEffort>();
  for (const effort of allEfforts) {
    const current = bestByDistance.get(effort.name);
    if (!current || effort.moving_time < current.moving_time) {
      bestByDistance.set(effort.name, effort);
    }
  }

  return [...bestByDistance.values()];
}

/**
 * Get athlete data (activities + stats) with caching.
 * Returns cached data if less than CACHE_TTL old, otherwise fetches fresh data.
 */
export async function getAthleteData(
  admin: SupabaseClient<Database>,
  userId: string,
  forceRefresh = false
): Promise<CachedAthleteData> {
  const empty: CachedAthleteData = {
    activities: [],
    stats: null,
    synced_at: new Date().toISOString(),
    needs_scope_upgrade: false,
  };

  let tokenData: Awaited<ReturnType<typeof getValidAccessToken>>;
  try {
    tokenData = await getValidAccessToken(admin, userId);
  } catch (err) {
    console.error("[Strava] getValidAccessToken failed:", err);
    return empty;
  }

  if (!tokenData) return empty;

  // Check if scope includes activity:read
  if (!tokenData.scope.includes("activity:read")) {
    return { ...empty, needs_scope_upgrade: true };
  }

  // Check cache (graceful — works even if table doesn't exist yet)
  if (!forceRefresh) {
    try {
      const { data: cached, error: cacheError } = await admin
        .from("strava_athlete_cache")
        .select("activities, stats, synced_at")
        .eq("user_id", userId)
        .single();

      if (!cacheError && cached) {
        const syncedAt = new Date(cached.synced_at).getTime();
        if (Date.now() - syncedAt < CACHE_TTL_MS) {
          const cacheStats = cached.stats as unknown as Record<string, unknown> | null;
          const personalRecords = (cacheStats && Array.isArray((cacheStats as Record<string, unknown>).__personal_records))
            ? (cacheStats as Record<string, unknown>).__personal_records as unknown as StravaBestEffort[]
            : undefined;
          return {
            activities: cached.activities as unknown as StravaActivity[],
            stats: cached.stats as unknown as StravaAthleteStats | null,
            personal_records: personalRecords,
            synced_at: cached.synced_at,
            needs_scope_upgrade: false,
          };
        }
      }
    } catch (err) {
      console.warn("[Strava] Cache read failed (table may not exist):", err);
    }
  }

  // Fetch fresh data from Strava
  let activities: StravaActivity[] = [];
  let stats: StravaAthleteStats | null = null;

  try {
    [activities, stats] = await Promise.all([
      fetchStravaActivities(tokenData.accessToken),
      fetchStravaStats(tokenData.accessToken, tokenData.athleteId),
    ]);
  } catch (err) {
    console.error("[Strava] API fetch failed:", err);
    return empty;
  }

  // Fetch personal records (best efforts) from detailed activities
  let personalRecords: StravaBestEffort[] = [];
  try {
    personalRecords = await fetchPersonalRecords(tokenData.accessToken, activities);
  } catch (err) {
    console.warn("[Strava] best_efforts fetch failed (non-critical):", err);
  }

  const now = new Date().toISOString();

  // Upsert cache (best-effort). Store personal_records inside stats JSONB to avoid migration.
  try {
    const statsWithPR = { ...(stats ?? {}), __personal_records: personalRecords };
    await admin.from("strava_athlete_cache").upsert(
      {
        user_id: userId,
        activities: activities as unknown as Database["public"]["Tables"]["strava_athlete_cache"]["Insert"]["activities"],
        stats: statsWithPR as unknown as Database["public"]["Tables"]["strava_athlete_cache"]["Insert"]["stats"],
        synced_at: now,
      },
      { onConflict: "user_id" }
    );
  } catch {
    // Cache write failure is non-critical
  }

  return {
    activities,
    stats,
    personal_records: personalRecords.length > 0 ? personalRecords : undefined,
    synced_at: now,
    needs_scope_upgrade: false,
  };
}
