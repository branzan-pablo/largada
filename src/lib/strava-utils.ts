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

export function formatDurationHMS(seconds: number): string {
  const h = Math.floor(seconds / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  const s = Math.round(seconds % 60);
  if (h > 0) return `${h}:${m.toString().padStart(2, "0")}:${s.toString().padStart(2, "0")}`;
  return `${m}:${s.toString().padStart(2, "0")}`;
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

// ─── Performance analysis ───────────────────────────────

/** Pace thresholds in seconds/km for each distance bucket */
const paceThresholds: Record<string, { elite: number; avancado: number; intermediario: number }> = {
  "5K":  { elite: 240, avancado: 300, intermediario: 360 },  // 4:00, 5:00, 6:00
  "10K": { elite: 270, avancado: 330, intermediario: 390 },  // 4:30, 5:30, 6:30
  "21K": { elite: 300, avancado: 360, intermediario: 420 },  // 5:00, 6:00, 7:00
  "42K": { elite: 300, avancado: 360, intermediario: 420 },  // 5:00, 6:00, 7:00
};

export type RunnerLevel = "elite" | "avancado" | "intermediario" | "iniciante";

const levelLabels: Record<RunnerLevel, string> = {
  elite: "Elite",
  avancado: "Avançado",
  intermediario: "Intermediário",
  iniciante: "Iniciante",
};

export function getLevelLabel(level: RunnerLevel): string {
  return levelLabels[level];
}

/** Classify runner level based on average pace (seconds/km) for a distance bucket */
export function classifyRunnerLevel(bucket: string, paceSecondsPerKm: number): RunnerLevel {
  const thresholds = paceThresholds[bucket];
  if (!thresholds) return "intermediario";
  if (paceSecondsPerKm <= thresholds.elite) return "elite";
  if (paceSecondsPerKm <= thresholds.avancado) return "avancado";
  if (paceSecondsPerKm <= thresholds.intermediario) return "intermediario";
  return "iniciante";
}

/** Next distance progression map */
const nextDistanceMap: Record<string, string> = {
  "< 3K": "5K",
  "5K": "10K",
  "10K": "21K",
  "21K": "42K",
};

/** Minimum weekly volume (km) recommended before attempting each distance */
const minWeeklyVolumeForDistance: Record<string, number> = {
  "5K": 10,
  "10K": 20,
  "21K": 30,
  "42K": 50,
};

export interface PersonalRecord {
  paceSecondsPerKm: number;
  movingTime: number;
  distanceMeters: number;
  date: string;
  isRace: boolean;
}

export interface PerformanceProfile {
  /** Best pace in seconds/km per distance bucket */
  paceByDistance: Record<string, number>;
  /** Personal records per distance bucket */
  bestPRByDistance: Record<string, PersonalRecord>;
  /** Runner level per distance bucket */
  levelByDistance: Record<string, RunnerLevel>;
  /** Overall runner level (from most-run distance) */
  overallLevel: RunnerLevel;
  /** Average weekly volume in km (last 8 weeks) */
  weeklyVolumeKm: number;
  /** Top distance bucket the runner is ready for next */
  nextChallenge: string | null;
  /** Whether the runner's pace trend is improving */
  trend: "improving" | "stable" | "declining";
  /** Preferred distances (top 2 by count) */
  preferredDistances: string[];
}

/** Build a full performance profile from Strava activities */
export function buildPerformanceProfile(
  activities: {
    distance: number;
    average_speed: number;
    moving_time?: number;
    start_date_local: string;
    workout_type?: number;
  }[]
): PerformanceProfile {
  // Track counts and best pace per bucket
  const bucketCounts = new Map<string, number>();
  const bucketBest = new Map<string, { pace: number; activity: typeof activities[number] }>();
  const bucketBestRace = new Map<string, { pace: number; activity: typeof activities[number] }>();

  for (const a of activities) {
    const km = a.distance / 1000;
    if (km < 1) continue; // skip very short activities
    const bucket = getDistanceBucket(km);
    bucketCounts.set(bucket, (bucketCounts.get(bucket) ?? 0) + 1);
    const paceSeconds = 1000 / a.average_speed; // seconds per km

    const currentBest = bucketBest.get(bucket);
    if (!currentBest || paceSeconds < currentBest.pace) {
      bucketBest.set(bucket, { pace: paceSeconds, activity: a });
    }

    if (a.workout_type === 1) {
      const currentBestRace = bucketBestRace.get(bucket);
      if (!currentBestRace || paceSeconds < currentBestRace.pace) {
        bucketBestRace.set(bucket, { pace: paceSeconds, activity: a });
      }
    }
  }

  // Best pace per distance (prefer race if within 10% of absolute best)
  const paceByDistance: Record<string, number> = {};
  const bestPRByDistance: Record<string, PersonalRecord> = {};
  const levelByDistance: Record<string, RunnerLevel> = {};
  for (const [bucket] of bucketCounts) {
    const best = bucketBest.get(bucket);
    if (!best) continue;

    const bestRace = bucketBestRace.get(bucket);
    let chosen = best;
    if (bestRace && bestRace.pace <= best.pace * 1.10) {
      chosen = bestRace;
    }

    const pace = Math.round(chosen.pace);
    paceByDistance[bucket] = pace;
    levelByDistance[bucket] = classifyRunnerLevel(bucket, chosen.pace);

    const a = chosen.activity;
    bestPRByDistance[bucket] = {
      paceSecondsPerKm: pace,
      movingTime: a.moving_time ?? Math.round(a.distance / a.average_speed),
      distanceMeters: a.distance,
      date: a.start_date_local,
      isRace: a.workout_type === 1,
    };
  }

  // Preferred distances (top 2)
  const preferredDistances = [...bucketCounts.entries()]
    .sort((a, b) => b[1] - a[1])
    .slice(0, 2)
    .map(([bucket]) => bucket);

  // Overall level from most-run distance
  const overallLevel = preferredDistances.length > 0
    ? (levelByDistance[preferredDistances[0]] ?? "intermediario")
    : "intermediario";

  // Weekly volume (last 8 weeks)
  const eightWeeksAgo = new Date();
  eightWeeksAgo.setDate(eightWeeksAgo.getDate() - 56);
  const recentKm = activities
    .filter((a) => new Date(a.start_date_local) >= eightWeeksAgo)
    .reduce((sum, a) => sum + a.distance / 1000, 0);
  const weeklyVolumeKm = Math.round((recentKm / 8) * 10) / 10;

  // Next challenge
  const topBucket = preferredDistances[0] ?? "5K";
  const nextDist = nextDistanceMap[topBucket] ?? null;
  const minVolume = nextDist ? (minWeeklyVolumeForDistance[nextDist] ?? 0) : Infinity;
  const nextChallenge = nextDist && weeklyVolumeKm >= minVolume ? nextDist : null;

  // Trend (compare first half vs second half of last 12 runs)
  const recentRuns = activities
    .filter((a) => a.distance > 1000)
    .slice(0, 12);
  let trend: "improving" | "stable" | "declining" = "stable";
  if (recentRuns.length >= 6) {
    const firstHalf = recentRuns.slice(Math.floor(recentRuns.length / 2));
    const secondHalf = recentRuns.slice(0, Math.floor(recentRuns.length / 2));
    const avgFirst = firstHalf.reduce((s, a) => s + 1000 / a.average_speed, 0) / firstHalf.length;
    const avgSecond = secondHalf.reduce((s, a) => s + 1000 / a.average_speed, 0) / secondHalf.length;
    const diff = avgFirst - avgSecond; // positive = second half is faster (improving)
    if (diff > 5) trend = "improving";
    else if (diff < -5) trend = "declining";
  }

  return {
    paceByDistance,
    bestPRByDistance,
    levelByDistance,
    overallLevel,
    weeklyVolumeKm,
    nextChallenge,
    trend,
    preferredDistances,
  };
}

/** Map Strava best effort names to our distance buckets */
const bestEffortToBucket: Record<string, string> = {
  "1k": "1K",
  "5k": "5K",
  "10k": "10K",
  "Half-Marathon": "21K",
  "30k": "30K",
  "Marathon": "42K",
};

/**
 * Enhance a performance profile with Strava best_efforts data.
 * Best efforts are extracted from GPS data and ignore warmup/cooldown.
 */
export function enhanceProfileWithBestEfforts(
  profile: PerformanceProfile,
  bestEfforts: { name: string; distance: number; moving_time: number; start_date_local: string }[]
): PerformanceProfile {
  if (bestEfforts.length === 0) return profile;

  const updatedPace = { ...profile.paceByDistance };
  const updatedPR = { ...profile.bestPRByDistance };
  const updatedLevel = { ...profile.levelByDistance };

  for (const effort of bestEfforts) {
    const bucket = bestEffortToBucket[effort.name];
    if (!bucket) continue;

    const paceSeconds = Math.round(effort.moving_time / (effort.distance / 1000));

    // Use best_effort pace if it's faster than what we have
    if (!updatedPace[bucket] || paceSeconds < updatedPace[bucket]) {
      updatedPace[bucket] = paceSeconds;
      updatedLevel[bucket] = classifyRunnerLevel(bucket, paceSeconds);
      updatedPR[bucket] = {
        paceSecondsPerKm: paceSeconds,
        movingTime: effort.moving_time,
        distanceMeters: effort.distance,
        date: effort.start_date_local,
        isRace: false,
      };
    }
  }

  // Recalculate overall level from most-run distance
  const overallLevel = profile.preferredDistances.length > 0
    ? (updatedLevel[profile.preferredDistances[0]] ?? profile.overallLevel)
    : profile.overallLevel;

  return {
    ...profile,
    paceByDistance: updatedPace,
    bestPRByDistance: updatedPR,
    levelByDistance: updatedLevel,
    overallLevel,
  };
}

// ─── Race scoring ───────────────────────────────────────

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

/**
 * Score a race for a user based on their performance profile and location.
 * Pure function — no DB or network calls.
 */
export function scoreRaceForUser(
  perfProfile: PerformanceProfile,
  userLocation: UserLocation,
  race: RaceCandidate,
): RaceScore {
  let score = 0;
  const reasons: string[] = [];

  // Distance match
  for (const raceDistStr of race.distances) {
    const raceDistKm = parseDistanceKm(raceDistStr);
    if (raceDistKm === null) continue;

    for (const pref of perfProfile.preferredDistances) {
      const range = distanceRanges[pref];
      if (range && raceDistKm >= range[0] && raceDistKm <= range[1]) {
        score += 10;
        const pace = perfProfile.paceByDistance[pref];
        if (pace) {
          reasons.push(
            `seu pace de ${formatPaceFromSeconds(pace)}/km é ideal`,
          );
        } else {
          reasons.push("sua distância favorita");
        }
        break;
      }
    }
  }

  // Next challenge match
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

  // Location proximity
  if (
    userLocation.latitude &&
    userLocation.longitude &&
    race.latitude &&
    race.longitude
  ) {
    const dist = haversineKm(
      userLocation.latitude,
      userLocation.longitude,
      race.latitude,
      race.longitude,
    );
    if (dist < 50) {
      score += 5;
    } else if (dist < 150) {
      score += 2;
    }
  } else if (userLocation.state && race.state === userLocation.state) {
    score += 3;
  }

  if (race.is_promoted) score += 1;

  return { score, reason: reasons[0] ?? "corrida próxima" };
}

/** Format pace from seconds/km to "M:SS" string */
export function formatPaceFromSeconds(paceSeconds: number): string {
  const minutes = Math.floor(paceSeconds / 60);
  const seconds = Math.round(paceSeconds % 60);
  return `${minutes}:${seconds.toString().padStart(2, "0")}`;
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
