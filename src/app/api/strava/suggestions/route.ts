import { NextRequest, NextResponse } from "next/server";
import { requireAuth } from "@/lib/auth";
import { createAdminClient } from "@/lib/supabase/admin";
import { todayInBrazil } from "@/lib/date";
import {
  parseDistanceKm,
  haversineKm,
  distanceRanges,
  formatPaceFromSeconds,
  type RunnerLevel,
} from "@/lib/strava-utils";

/**
 * POST /api/strava/suggestions
 * Returns race suggestions based on athlete's performance profile.
 * Body: {
 *   preferredDistances: string[],
 *   nextChallenge?: string | null,
 *   weeklyVolumeKm?: number,
 *   overallLevel?: RunnerLevel,
 *   paceByDistance?: Record<string, number>,
 *   trend?: "improving" | "stable" | "declining",
 * }
 */
export async function POST(request: NextRequest) {
  const authResult = await requireAuth();
  if (authResult instanceof NextResponse) return authResult;
  const { user } = authResult;

  const body = await request.json();
  const preferredDistances: string[] = body.preferredDistances ?? [];
  const nextChallenge: string | null = body.nextChallenge ?? null;
  const weeklyVolumeKm: number = body.weeklyVolumeKm ?? 0;
  const overallLevel: RunnerLevel = body.overallLevel ?? "intermediario";
  const paceByDistance: Record<string, number> = body.paceByDistance ?? {};
  const trend: string = body.trend ?? "stable";

  const admin = createAdminClient();

  // Get user profile for location
  const { data: profile } = await admin
    .from("profiles")
    .select("latitude, longitude, city, state")
    .eq("id", user.id)
    .single();

  const today = todayInBrazil();

  // Fetch upcoming races
  const { data: races } = await admin
    .from("races")
    .select(
      "id, name, date, city, state, distances, slug, latitude, longitude, status, is_promoted"
    )
    .eq("status", "confirmed")
    .gte("date", today)
    .order("date", { ascending: true })
    .limit(100);

  if (!races || races.length === 0) {
    return NextResponse.json({ suggestions: [] });
  }

  // Score and rank races
  const scored = races
    .map((race) => {
      let score = 0;
      const reasons: string[] = [];

      // Distance match — preferred distances
      for (const raceDistStr of race.distances) {
        const raceDistKm = parseDistanceKm(raceDistStr);
        if (raceDistKm === null) continue;

        for (const pref of preferredDistances) {
          const range = distanceRanges[pref];
          if (range && raceDistKm >= range[0] && raceDistKm <= range[1]) {
            score += 10;
            // Add pace context if available
            const pace = paceByDistance[pref];
            if (pace) {
              reasons.push(
                `Tem ${raceDistStr}, você corre a ${formatPaceFromSeconds(pace)}/km`
              );
            } else {
              reasons.push(`Tem ${raceDistStr}, sua distância favorita`);
            }
            break;
          }
        }
      }

      // Next challenge match — suggest the next step up
      if (nextChallenge) {
        for (const raceDistStr of race.distances) {
          const raceDistKm = parseDistanceKm(raceDistStr);
          if (raceDistKm === null) continue;
          const range = distanceRanges[nextChallenge];
          if (range && raceDistKm >= range[0] && raceDistKm <= range[1]) {
            score += 8;
            if (weeklyVolumeKm > 0) {
              reasons.push(
                `Próximo desafio: ${raceDistStr}! Seu volume semanal de ${weeklyVolumeKm}km te prepara`
              );
            } else {
              reasons.push(`Próximo desafio: ${raceDistStr}!`);
            }
            break;
          }
        }
      }

      // Trend bonus — if improving, boost slightly more ambitious races
      if (trend === "improving" && score > 0) {
        score += 2;
        if (reasons.length === 0) {
          reasons.push("Seu pace está melhorando, hora de testar!");
        }
      }

      // Location proximity bonus
      if (
        profile?.latitude &&
        profile?.longitude &&
        race.latitude &&
        race.longitude
      ) {
        const dist = haversineKm(
          profile.latitude,
          profile.longitude,
          race.latitude,
          race.longitude
        );
        if (dist < 50) {
          score += 5;
          reasons.push("Perto de você");
        } else if (dist < 150) {
          score += 2;
        }
      } else if (profile?.state && race.state === profile.state) {
        score += 3;
        reasons.push(`No seu estado (${race.state})`);
      }

      // Promoted races get a small boost
      if (race.is_promoted) {
        score += 1;
      }

      return {
        id: race.id,
        name: race.name,
        date: race.date,
        city: race.city,
        state: race.state,
        distances: race.distances,
        slug: race.slug,
        matchReason: reasons[0] ?? "Corrida próxima",
        matchReasons: reasons.slice(0, 2),
        score,
      };
    })
    .filter((r) => r.score > 0)
    .sort((a, b) => b.score - a.score)
    .slice(0, 5);

  return NextResponse.json({ suggestions: scored });
}
