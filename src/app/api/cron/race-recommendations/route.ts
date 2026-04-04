import { NextResponse } from "next/server";
import { timingSafeEqual } from "crypto";
import { createAdminClient } from "@/lib/supabase/admin";
import { notifyPersonalizedRace } from "@/lib/notifications";
import { todayInBrazil } from "@/lib/date";
import {
  buildPerformanceProfile,
  scoreRaceForUser,
} from "@/lib/strava-utils";
import type { RaceCandidate } from "@/lib/strava-utils";
import type { StravaActivity } from "@/lib/strava";

function safeCompare(a: string, b: string): boolean {
  if (a.length !== b.length) return false;
  return timingSafeEqual(Buffer.from(a), Buffer.from(b));
}

/** Minimum score to trigger a push notification */
const MIN_SCORE = 10;

/**
 * GET /api/cron/race-recommendations
 * Runs 2x/week (Mon & Thu 8am BRT).
 * For each Strava user with notifications enabled:
 *   1. Load cached activities
 *   2. Build performance profile
 *   3. Score upcoming races
 *   4. Send push for the best match (if score >= threshold and not already notified)
 */
export async function GET(request: Request) {
  const authHeader = request.headers.get("authorization");
  if (
    !authHeader ||
    !safeCompare(authHeader, `Bearer ${process.env.CRON_SECRET}`)
  ) {
    return NextResponse.json({ error: "Não autorizado" }, { status: 401 });
  }

  const supabase = createAdminClient();
  const today = todayInBrazil();

  // 1. Get all users with Strava connected AND notifications enabled
  const { data: stravaUsers } = await supabase
    .from("strava_tokens")
    .select("user_id");

  if (!stravaUsers || stravaUsers.length === 0) {
    return NextResponse.json({ message: "Nenhum usuário Strava", sent: 0 });
  }

  const stravaUserIds = stravaUsers.map((u) => u.user_id);

  // Get profiles with notifications enabled
  const { data: profiles } = await supabase
    .from("profiles")
    .select("id, latitude, longitude, city, state")
    .in("id", stravaUserIds)
    .eq("notifications_enabled", true);

  if (!profiles || profiles.length === 0) {
    return NextResponse.json({
      message: "Nenhum usuário com notificações ativadas",
      sent: 0,
    });
  }

  // 2. Get cached activities for these users
  const profileIds = profiles.map((p) => p.id);
  const { data: caches } = await supabase
    .from("strava_athlete_cache")
    .select("user_id, activities")
    .in("user_id", profileIds);

  if (!caches || caches.length === 0) {
    return NextResponse.json({ message: "Nenhum cache de atividades", sent: 0 });
  }

  // 3. Get upcoming races
  const { data: races } = await supabase
    .from("races")
    .select(
      "id, name, date, city, state, distances, slug, latitude, longitude, is_promoted"
    )
    .eq("status", "published")
    .gte("date", today)
    .order("date", { ascending: true })
    .limit(100);

  if (!races || races.length === 0) {
    return NextResponse.json({ message: "Nenhuma corrida próxima", sent: 0 });
  }

  // 4. Get already-notified race/user combos for dedup
  const { data: alreadyNotified } = await supabase
    .from("race_recommendation_logs")
    .select("user_id, race_id")
    .in("user_id", profileIds);

  const notifiedSet = new Set(
    (alreadyNotified ?? []).map((r) => `${r.user_id}:${r.race_id}`)
  );

  let totalSent = 0;

  // 5. For each user, score races and send best match
  for (const cache of caches) {
    const activities = (cache.activities as unknown as StravaActivity[]) ?? [];
    if (activities.length < 3) continue;

    const profile = profiles.find((p) => p.id === cache.user_id);
    if (!profile) continue;

    try {
      const perfProfile = buildPerformanceProfile(activities);

      // Score each race for this user
      const userLocation = {
        latitude: profile.latitude,
        longitude: profile.longitude,
        state: profile.state,
      };

      const scored = races
        .filter((race) => !notifiedSet.has(`${cache.user_id}:${race.id}`))
        .map((race) => {
          const { score, reason } = scoreRaceForUser(
            perfProfile,
            userLocation,
            race as RaceCandidate,
          );
          return { race, score, reason };
        })
        .filter((r) => r.score >= MIN_SCORE)
        .sort((a, b) => b.score - a.score);

      // Send only the best match per user per cron run
      const best = scored[0];
      if (!best) continue;

      const result = await notifyPersonalizedRace(
        cache.user_id,
        best.race,
        best.reason
      );

      totalSent += result.sent;
    } catch (error) {
      console.error(
        "[race-recommendations] failed for user:",
        cache.user_id,
        error
      );
    }
  }

  return NextResponse.json({
    sent: totalSent,
    usersProcessed: caches.length,
    racesAvailable: races.length,
  });
}
