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
import {
  cosineSimilarity,
  getUserPreferenceEmbedding,
  parsePgVector,
} from "@/lib/ai/user-preference";

function safeCompare(a: string, b: string): boolean {
  if (a.length !== b.length) return false;
  return timingSafeEqual(Buffer.from(a), Buffer.from(b));
}

/** Minimum score to trigger a push notification */
const MIN_SCORE = 10;

/**
 * Blend weights for the personalized score:
 *
 *   final = HEURISTIC_WEIGHT × heuristic + COSINE_WEIGHT × cosine_sim × 10
 *
 * Heuristic dominates because Strava-derived signal (pace fit, next challenge,
 * geo) is more grounded than vector similarity. Embedding breaks ties and
 * surfaces races the heuristic alone would have missed.
 */
const HEURISTIC_WEIGHT = 0.6;
const COSINE_WEIGHT = 0.4;

/**
 * Minimum cosine similarity for the embedding signal to be treated as the
 * dominant explanation. Above this, the match_reason switches to
 * "Combina com corridas que você curtiu".
 */
const STRONG_EMBEDDING_SIMILARITY = 0.85;

/**
 * GET /api/cron/race-recommendations
 * Runs 2x/week (Mon & Thu 8am BRT).
 * For each Strava user with notifications enabled:
 *   1. Load cached activities
 *   2. Build performance profile
 *   3. Load the user's preference embedding (from RSVPs/clicks/views)
 *   4. Score upcoming races: heuristic + cosine-similarity blend
 *   5. Send push for the best match (if score >= threshold and not yet notified)
 *   6. Persist match_reason + breakdown so the listing card can show
 *      "Pra você porque..." for the same race.
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

  const { data: stravaUsers } = await supabase
    .from("strava_tokens")
    .select("user_id");

  if (!stravaUsers || stravaUsers.length === 0) {
    return NextResponse.json({ message: "Nenhum usuário Strava", sent: 0 });
  }

  const stravaUserIds = stravaUsers.map((u) => u.user_id);

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

  const profileIds = profiles.map((p) => p.id);
  const { data: caches } = await supabase
    .from("strava_athlete_cache")
    .select("user_id, activities")
    .in("user_id", profileIds);

  if (!caches || caches.length === 0) {
    return NextResponse.json({ message: "Nenhum cache de atividades", sent: 0 });
  }

  // Pull the embedding alongside the rest so we can compute cosine similarity
  // without a second round-trip per race.
  const { data: races } = await supabase
    .from("races")
    .select(
      "id, name, date, city, state, distances, slug, latitude, longitude, is_promoted, embedding",
    )
    .eq("status", "confirmed")
    .gte("date", today)
    .order("date", { ascending: true })
    .limit(100);

  if (!races || races.length === 0) {
    return NextResponse.json({ message: "Nenhuma corrida próxima", sent: 0 });
  }

  // Parse embeddings once and discard rows that don't have one (will skip the
  // blend for those and rely on the heuristic alone).
  const raceEmbeddings = new Map<string, number[]>();
  for (const race of races) {
    const parsed = parsePgVector(race.embedding);
    if (parsed) raceEmbeddings.set(race.id, parsed);
  }

  const { data: alreadyNotified } = await supabase
    .from("race_recommendation_logs")
    .select("user_id, race_id")
    .in("user_id", profileIds);

  const notifiedSet = new Set(
    (alreadyNotified ?? []).map((r) => `${r.user_id}:${r.race_id}`),
  );

  let totalSent = 0;
  let usersWithEmbedding = 0;

  for (const cache of caches) {
    const activities = (cache.activities as unknown as StravaActivity[]) ?? [];
    if (activities.length < 3) continue;

    const profile = profiles.find((p) => p.id === cache.user_id);
    if (!profile) continue;

    try {
      const perfProfile = buildPerformanceProfile(activities);
      const userLocation = {
        latitude: profile.latitude,
        longitude: profile.longitude,
        state: profile.state,
      };

      const userEmbedding = await getUserPreferenceEmbedding(cache.user_id);
      if (userEmbedding) usersWithEmbedding++;

      const scored = races
        .filter((race) => !notifiedSet.has(`${cache.user_id}:${race.id}`))
        .map((race) => {
          const { score: heuristic, reason: heuristicReason } = scoreRaceForUser(
            perfProfile,
            userLocation,
            race as RaceCandidate,
          );

          const raceEmb = raceEmbeddings.get(race.id);
          const cosine_sim =
            userEmbedding && raceEmb ? cosineSimilarity(userEmbedding, raceEmb) : null;

          const embeddingComponent = cosine_sim != null ? cosine_sim * 10 : 0;
          const final =
            cosine_sim != null
              ? HEURISTIC_WEIGHT * heuristic + COSINE_WEIGHT * embeddingComponent
              : heuristic;

          const source: "heuristic" | "blended" | "embedding" =
            cosine_sim == null
              ? "heuristic"
              : cosine_sim >= STRONG_EMBEDDING_SIMILARITY &&
                  embeddingComponent * COSINE_WEIGHT >= heuristic * HEURISTIC_WEIGHT
                ? "embedding"
                : "blended";

          const reason =
            source === "embedding"
              ? "combina com corridas que você curtiu"
              : heuristicReason;

          return {
            race,
            score: final,
            reason,
            breakdown: {
              heuristic,
              cosine_sim,
              final,
              source,
            },
          };
        })
        .filter((r) => r.score >= MIN_SCORE)
        .sort((a, b) => b.score - a.score);

      const best = scored[0];
      if (!best) continue;

      const result = await notifyPersonalizedRace(
        cache.user_id,
        best.race,
        best.reason,
        best.breakdown,
      );

      totalSent += result.sent;
    } catch (error) {
      console.error(
        "[race-recommendations] failed for user:",
        cache.user_id,
        error,
      );
    }
  }

  return NextResponse.json({
    sent: totalSent,
    usersProcessed: caches.length,
    usersWithEmbedding,
    racesAvailable: races.length,
  });
}
