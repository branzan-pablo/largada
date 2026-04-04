/**
 * Pure utility functions for Strava data formatting and race matching.
 * Extracted for testability — used by desempenho page and suggestions API.
 */

// ─── Formatting ──────────────────────────────────────────

export function metersToKm(m: number): string {
  return (m / 1000).toFixed(1);
}

export function formatPace(speedMs: number): string {
  if (!speedMs || speedMs <= 0) return "--:--";
  const paceSeconds = 1000 / speedMs; // seconds per km
  const minutes = Math.floor(paceSeconds / 60);
  const seconds = Math.round(paceSeconds % 60);
  return `${minutes}:${seconds.toString().padStart(2, "0")}`;
}

export function formatDurationShort(seconds: number): string {
  const h = Math.floor(seconds / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  if (h > 0) return `${h}h${m > 0 ? m + "m" : ""}`;
  return `${m}m`;
}

export function getWorkoutLabel(workoutType?: number): string | null {
  switch (workoutType) {
    case 1:
      return "Prova";
    case 2:
      return "Longão";
    case 3:
      return "Treino";
    default:
      return null;
  }
}

// ─── Distance buckets ────────────────────────────────────

export function getDistanceBucket(distanceKm: number): string {
  if (distanceKm < 3) return "< 3K";
  if (distanceKm < 7) return "5K";
  if (distanceKm < 14) return "10K";
  if (distanceKm < 25) return "21K";
  if (distanceKm < 35) return "30K";
  return "42K";
}

/** Maps distance bucket labels to approximate km ranges for matching */
export const distanceRanges: Record<string, [number, number]> = {
  "< 3K": [0, 3],
  "5K": [3, 7],
  "10K": [7, 14],
  "21K": [14, 25],
  "30K": [25, 35],
  "42K": [35, 50],
};

// ─── Race distance parsing ───────────────────────────────

/**
 * Parse a race distance string like "5km", "10 km", "21,1km", "Meia Maratona".
 * Returns the distance in km, or null if unparseable.
 */
export function parseDistanceKm(distStr: string): number | null {
  const lower = distStr.toLowerCase().trim();

  if (lower.includes("maratona") && !lower.includes("meia") && !lower.includes("ultra")) return 42;
  if (lower.includes("meia maratona") || lower.includes("meia")) return 21;

  const match = lower.match(/([\d,.]+)\s*(?:km|k)/);
  if (match) {
    return parseFloat(match[1].replace(",", "."));
  }
  return null;
}

// ─── Geo ─────────────────────────────────────────────────

/** Haversine distance between two lat/lng points in kilometers */
export function haversineKm(
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
