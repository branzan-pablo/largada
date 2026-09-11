import { NextResponse } from "next/server";
import { requireAdmin } from "@/lib/auth";
import { createAdminClient } from "@/lib/supabase/admin";
import { notifyPersonalizedRace } from "@/lib/notifications";
import {
  buildPerformanceProfile,
  scoreRaceForUser,
} from "@/lib/strava-utils";
import type { RaceCandidate } from "@/lib/strava-utils";
import type { StravaActivity } from "@/lib/strava";

/**
 * POST /api/admin/test-recommendation
 *
 * Roda o scoring de recomendação de corridas para o admin autenticado
 * e retorna os resultados. Envia push apenas para o melhor match.
 *
 * Como testar:
 *   1. Abra o app logado como admin
 *   2. DevTools (F12) → Console:
 *      fetch('/api/admin/test-recommendation', { method: 'POST' })
 *        .then(r => r.json()).then(console.log)
 *
 * Query params:
 *   ?dry=true  — mostra scoring sem enviar notificação
 *
 * Resposta: { topMatches: [...], notified: { race, score, reason, sent } | null }
 */
export async function POST(request: Request) {
  const authResult = await requireAdmin();
  if (authResult instanceof NextResponse) return authResult;

  const { user } = authResult;
  const url = new URL(request.url);
  const dryRun = url.searchParams.get("dry") === "true";

  const supabase = createAdminClient();

  // 1. Get user's cached activities
  const { data: cache } = await supabase
    .from("strava_athlete_cache")
    .select("activities")
    .eq("user_id", user.id)
    .single();

  if (!cache) {
    return NextResponse.json(
      { error: "Nenhum cache de atividades Strava encontrado. Acesse /perfil/desempenho primeiro." },
      { status: 404 },
    );
  }

  const activities = (cache.activities as unknown as StravaActivity[]) ?? [];
  if (activities.length < 3) {
    return NextResponse.json(
      { error: `Poucas atividades no cache (${activities.length}). Mínimo: 3.` },
      { status: 400 },
    );
  }

  // 2. Get user profile location
  const { data: profile } = await supabase
    .from("profiles")
    .select("latitude, longitude, state")
    .eq("id", user.id)
    .single();

  // 3. Get races (future + last 30 days for testing)
  const thirtyDaysAgo = new Date();
  thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
  const minDate = thirtyDaysAgo.toISOString().split("T")[0];

  const { data: races } = await supabase
    .from("races")
    .select("id, name, date, city, state, distances, slug, latitude, longitude, is_promoted")
    .eq("status", "confirmed")
    .gte("date", minDate)
    .order("date", { ascending: false })
    .limit(100);

  if (!races || races.length === 0) {
    return NextResponse.json({ error: "Nenhuma corrida encontrada (futuras ou últimos 30 dias)" }, { status: 404 });
  }

  // 4. Build profile and score
  const perfProfile = buildPerformanceProfile(activities);
  const userLocation = {
    latitude: profile?.latitude ?? null,
    longitude: profile?.longitude ?? null,
    state: profile?.state ?? null,
  };

  const scored = races
    .map((race) => {
      const { score, reason } = scoreRaceForUser(perfProfile, userLocation, race as RaceCandidate);
      return { id: race.id, name: race.name, date: race.date, city: race.city, distances: race.distances, score, reason };
    })
    .filter((r) => r.score > 0)
    .sort((a, b) => b.score - a.score)
    .slice(0, 10);

  // 5. Send notification for the best match (unless dry run)
  let notified = null;
  const best = scored[0];

  if (best && best.score >= 10 && !dryRun) {
    const race = races.find((r) => r.id === best.id)!;
    const result = await notifyPersonalizedRace(user.id, race, best.reason);
    notified = { race: best.name, score: best.score, reason: best.reason, ...result };
  }

  return NextResponse.json({
    profile: {
      overallLevel: perfProfile.overallLevel,
      preferredDistances: perfProfile.preferredDistances,
      weeklyVolumeKm: perfProfile.weeklyVolumeKm,
      nextChallenge: perfProfile.nextChallenge,
      trend: perfProfile.trend,
    },
    topMatches: scored,
    notified,
    dryRun,
  });
}
