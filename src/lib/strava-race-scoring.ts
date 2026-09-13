import type { PerformanceProfile } from "@/lib/strava-utils";

export const distanceRanges: Record<string, [number, number]> = {
  "< 3K": [0, 3],
  "5K": [3, 7],
  "10K": [7, 14],
  "21K": [14, 25],
  "30K": [25, 35],
  "42K": [35, 50],
};

export function parseDistanceKm(distStr: string): number | null {
  const lower = distStr.toLowerCase().trim();
  if (lower.includes("maratona") && !lower.includes("meia") && !lower.includes("ultra")) return 42;
  if (lower.includes("meia maratona") || lower.includes("meia")) return 21;
  const match = lower.match(/([\d,.]+)\s*(?:km|k)/);
  return match ? parseFloat(match[1].replace(",", ".")) : null;
}

export interface RaceCandidate {
  id: string;
  distances: string[];
  latitude: number | null;
  longitude: number | null;
  state: string | null;
  is_promoted: boolean;
}

export interface UserLocation {
  latitude: number | null;
  longitude: number | null;
  state: string | null;
}

export interface RaceScore {
  score: number;
  reason: string;
}

export function scoreRaceForUser(
  perfProfile: PerformanceProfile,
  userLocation: UserLocation,
  race: RaceCandidate,
): RaceScore {
  let score = 0;
  const reasons: string[] = [];

  for (const raceDistStr of race.distances) {
    const raceDistKm = parseDistanceKm(raceDistStr);
    if (raceDistKm === null) continue;
    for (const pref of perfProfile.preferredDistances) {
      const range = distanceRanges[pref];
      if (range && raceDistKm >= range[0] && raceDistKm <= range[1]) {
        score += 10;
        const pace = perfProfile.paceByDistance[pref];
        reasons.push(pace ? `seu pace de ${formatPaceFromSeconds(pace)}/km é ideal` : "sua distância favorita");
        break;
      }
    }
  }

  if (perfProfile.nextChallenge) {
    for (const raceDistStr of race.distances) {
      const raceDistKm = parseDistanceKm(raceDistStr);
      if (raceDistKm === null) continue;
      const range = distanceRanges[perfProfile.nextChallenge];
      if (range && raceDistKm >= range[0] && raceDistKm <= range[1]) {
        score += 8;
        reasons.push(`próximo desafio: ${raceDistStr}`);
        break;
      }
    }
  }

  if (userLocation.latitude && userLocation.longitude && race.latitude && race.longitude) {
    const distance = haversineKm(userLocation.latitude, userLocation.longitude, race.latitude, race.longitude);
    if (distance < 50) score += 5;
    else if (distance < 150) score += 2;
  } else if (userLocation.state && race.state === userLocation.state) {
    score += 3;
  }

  if (race.is_promoted) score += 1;
  return { score, reason: reasons[0] ?? "corrida próxima" };
}

export function formatPaceFromSeconds(paceSeconds: number): string {
  const minutes = Math.floor(paceSeconds / 60);
  const seconds = Math.round(paceSeconds % 60);
  return `${minutes}:${seconds.toString().padStart(2, "0")}`;
}

export function haversineKm(lat1: number, lon1: number, lat2: number, lon2: number): number {
  const radiusKm = 6371;
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLon = ((lon2 - lon1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos((lat1 * Math.PI) / 180) * Math.cos((lat2 * Math.PI) / 180) * Math.sin(dLon / 2) ** 2;
  return radiusKm * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}
