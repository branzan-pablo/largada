import { NextRequest, NextResponse } from "next/server";
import { requireAuth } from "@/lib/auth";
import { createAdminClient } from "@/lib/supabase/admin";
import { todayInBrazil } from "@/lib/date";
import { parseDistanceKm, haversineKm, distanceRanges } from "@/lib/strava-utils";

/**
 * POST /api/strava/suggestions
 * Returns race suggestions based on athlete's preferred distances and location.
 * Body: { preferredDistances: string[] } — e.g., ["5K", "10K"]
 */
export async function POST(request: NextRequest) {
  const authResult = await requireAuth();
  if (authResult instanceof NextResponse) return authResult;
  const { user } = authResult;

  const body = await request.json();
  const preferredDistances: string[] = body.preferredDistances ?? [];

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
      "id, name, date, city, state, distances, slug, latitude, longitude, status"
    )
    .eq("status", "published")
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

      // Distance match
      for (const raceDistStr of race.distances) {
        const raceDistKm = parseDistanceKm(raceDistStr);
        if (raceDistKm === null) continue;

        for (const pref of preferredDistances) {
          const range = distanceRanges[pref];
          if (range && raceDistKm >= range[0] && raceDistKm <= range[1]) {
            score += 10;
            reasons.push(`Tem ${raceDistStr} — sua distância favorita`);
            break;
          }
        }
      }

      // Location proximity bonus
      if (profile?.latitude && profile?.longitude && race.latitude && race.longitude) {
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
      if ("is_promoted" in race && race.is_promoted) {
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
        score,
      };
    })
    .filter((r) => r.score > 0)
    .sort((a, b) => b.score - a.score)
    .slice(0, 5);

  return NextResponse.json({ suggestions: scored });
}
