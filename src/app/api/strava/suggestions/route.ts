import { NextRequest, NextResponse } from "next/server";
import { requireAuth } from "@/lib/auth";
import { createAdminClient } from "@/lib/supabase/admin";
import { todayInBrazil } from "@/lib/date";

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

  // Map distance bucket labels to approximate km ranges for matching
  const distanceRanges: Record<string, [number, number]> = {
    "< 3K": [0, 3],
    "5K": [3, 7],
    "10K": [7, 14],
    "21K": [14, 25],
    "30K": [25, 35],
    "42K": [35, 50],
  };

  // Parse a race distance string like "5km", "10 km", "21.1km", "Meia Maratona"
  function parseDistanceKm(distStr: string): number | null {
    const lower = distStr.toLowerCase().trim();

    if (lower.includes("maratona") && !lower.includes("meia") && !lower.includes("ultra")) return 42;
    if (lower.includes("meia maratona") || lower.includes("meia")) return 21;

    const match = lower.match(/([\d,.]+)\s*(?:km|k)/);
    if (match) {
      return parseFloat(match[1].replace(",", "."));
    }
    return null;
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

function haversineKm(
  lat1: number,
  lon1: number,
  lat2: number,
  lon2: number
): number {
  const R = 6371;
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLon = ((lon2 - lon1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLon / 2) ** 2;
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}
