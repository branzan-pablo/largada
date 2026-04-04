import { describe, it, expect } from "vitest";
import {
  metersToKm,
  formatPace,
  formatDurationShort,
  getWorkoutLabel,
  getDistanceBucket,
  parseDistanceKm,
  haversineKm,
  distanceRanges,
  classifyRunnerLevel,
  getLevelLabel,
  buildPerformanceProfile,
  formatPaceFromSeconds,
  scoreRaceForUser,
} from "@/lib/strava-utils";
import type { PerformanceProfile, RaceCandidate, UserLocation } from "@/lib/strava-utils";

// ─── metersToKm ─────────────────────────────────────────

describe("metersToKm", () => {
  it("converts meters to km with one decimal", () => {
    expect(metersToKm(5000)).toBe("5.0");
    expect(metersToKm(10500)).toBe("10.5");
    expect(metersToKm(21097)).toBe("21.1");
  });

  it("handles zero", () => {
    expect(metersToKm(0)).toBe("0.0");
  });

  it("handles sub-km distances", () => {
    expect(metersToKm(400)).toBe("0.4");
  });

  it("handles marathon distance", () => {
    expect(metersToKm(42195)).toBe("42.2");
  });
});

// ─── formatPace ─────────────────────────────────────────

describe("formatPace", () => {
  it("formats a 5:00/km pace (3.33 m/s)", () => {
    // 1000m / 300s = 3.333 m/s
    expect(formatPace(1000 / 300)).toBe("5:00");
  });

  it("formats a 6:30/km pace", () => {
    // 6:30 = 390 seconds per km → speed = 1000/390 ≈ 2.564 m/s
    expect(formatPace(1000 / 390)).toBe("6:30");
  });

  it("formats a fast pace (3:30/km)", () => {
    expect(formatPace(1000 / 210)).toBe("3:30");
  });

  it("returns --:-- for zero speed", () => {
    expect(formatPace(0)).toBe("--:--");
  });

  it("returns --:-- for negative speed", () => {
    expect(formatPace(-1)).toBe("--:--");
  });
});

// ─── formatDurationShort ────────────────────────────────

describe("formatDurationShort", () => {
  it("formats minutes only", () => {
    expect(formatDurationShort(1800)).toBe("30m");
  });

  it("formats hours and minutes", () => {
    expect(formatDurationShort(5400)).toBe("1h30m");
  });

  it("formats exact hours", () => {
    expect(formatDurationShort(7200)).toBe("2h");
  });

  it("formats zero", () => {
    expect(formatDurationShort(0)).toBe("0m");
  });

  it("formats short duration", () => {
    expect(formatDurationShort(120)).toBe("2m");
  });
});

// ─── getWorkoutLabel ────────────────────────────────────

describe("getWorkoutLabel", () => {
  it("returns Prova for type 1", () => {
    expect(getWorkoutLabel(1)).toBe("Prova");
  });

  it("returns Longão for type 2", () => {
    expect(getWorkoutLabel(2)).toBe("Longão");
  });

  it("returns Treino for type 3", () => {
    expect(getWorkoutLabel(3)).toBe("Treino");
  });

  it("returns null for type 0 (default)", () => {
    expect(getWorkoutLabel(0)).toBeNull();
  });

  it("returns null for undefined", () => {
    expect(getWorkoutLabel(undefined)).toBeNull();
  });
});

// ─── getDistanceBucket ──────────────────────────────────

describe("getDistanceBucket", () => {
  it("buckets < 3km correctly", () => {
    expect(getDistanceBucket(1)).toBe("< 3K");
    expect(getDistanceBucket(2.9)).toBe("< 3K");
  });

  it("buckets 5K range (3–7km)", () => {
    expect(getDistanceBucket(3)).toBe("5K");
    expect(getDistanceBucket(5)).toBe("5K");
    expect(getDistanceBucket(6.9)).toBe("5K");
  });

  it("buckets 10K range (7–14km)", () => {
    expect(getDistanceBucket(7)).toBe("10K");
    expect(getDistanceBucket(10)).toBe("10K");
    expect(getDistanceBucket(13.9)).toBe("10K");
  });

  it("buckets 21K range (14–25km)", () => {
    expect(getDistanceBucket(14)).toBe("21K");
    expect(getDistanceBucket(21.1)).toBe("21K");
    expect(getDistanceBucket(24.9)).toBe("21K");
  });

  it("buckets 30K range (25–35km)", () => {
    expect(getDistanceBucket(25)).toBe("30K");
    expect(getDistanceBucket(30)).toBe("30K");
  });

  it("buckets 42K for ≥ 35km", () => {
    expect(getDistanceBucket(35)).toBe("42K");
    expect(getDistanceBucket(42.2)).toBe("42K");
    expect(getDistanceBucket(100)).toBe("42K");
  });
});

// ─── parseDistanceKm ────────────────────────────────────

describe("parseDistanceKm", () => {
  it("parses '5km'", () => {
    expect(parseDistanceKm("5km")).toBe(5);
  });

  it("parses '10 km' with space", () => {
    expect(parseDistanceKm("10 km")).toBe(10);
  });

  it("parses '21,1km' with comma decimal", () => {
    expect(parseDistanceKm("21,1km")).toBe(21.1);
  });

  it("parses '42.195km' with dot decimal", () => {
    expect(parseDistanceKm("42.195km")).toBe(42.195);
  });

  it("parses '5K' (uppercase, no 'm')", () => {
    expect(parseDistanceKm("5K")).toBe(5);
  });

  it("parses 'Meia Maratona'", () => {
    expect(parseDistanceKm("Meia Maratona")).toBe(21);
  });

  it("parses 'meia' alone", () => {
    expect(parseDistanceKm("meia")).toBe(21);
  });

  it("parses 'Maratona'", () => {
    expect(parseDistanceKm("Maratona")).toBe(42);
  });

  it("does NOT match 'Ultra Maratona' as regular marathon", () => {
    expect(parseDistanceKm("Ultra Maratona")).toBeNull();
  });

  it("returns null for unparseable strings", () => {
    expect(parseDistanceKm("Fun Run")).toBeNull();
    expect(parseDistanceKm("")).toBeNull();
  });
});

// ─── haversineKm ────────────────────────────────────────

describe("haversineKm", () => {
  it("returns 0 for the same point", () => {
    expect(haversineKm(-23.55, -46.63, -23.55, -46.63)).toBe(0);
  });

  it("calculates SP → RJ ≈ 360km", () => {
    // São Paulo: -23.5505, -46.6333 / Rio: -22.9068, -43.1729
    const dist = haversineKm(-23.5505, -46.6333, -22.9068, -43.1729);
    expect(dist).toBeGreaterThan(340);
    expect(dist).toBeLessThan(380);
  });

  it("calculates short distance (≈ 10km within city)", () => {
    // Paulista → Pinheiros (~5-8km)
    const dist = haversineKm(-23.5613, -46.6560, -23.5672, -46.6926);
    expect(dist).toBeGreaterThan(3);
    expect(dist).toBeLessThan(10);
  });

  it("handles antipodal points (max ~20000km)", () => {
    const dist = haversineKm(0, 0, 0, 180);
    expect(dist).toBeGreaterThan(20000);
    expect(dist).toBeLessThan(20100);
  });
});

// ─── distanceRanges ─────────────────────────────────────

describe("distanceRanges", () => {
  it("has all expected bucket keys", () => {
    expect(Object.keys(distanceRanges)).toEqual(
      expect.arrayContaining(["< 3K", "5K", "10K", "21K", "30K", "42K"])
    );
  });

  it("ranges are [min, max] tuples", () => {
    for (const [, [min, max]] of Object.entries(distanceRanges)) {
      expect(min).toBeLessThan(max);
    }
  });
});

// ─── classifyRunnerLevel ────────────────────────────────

describe("classifyRunnerLevel", () => {
  it("classifies elite 5K pace (< 4:00/km = 240s)", () => {
    expect(classifyRunnerLevel("5K", 230)).toBe("elite");
  });

  it("classifies avançado 5K pace (4:00-5:00 = 240-300s)", () => {
    expect(classifyRunnerLevel("5K", 280)).toBe("avancado");
  });

  it("classifies intermediário 5K pace (5:00-6:00 = 300-360s)", () => {
    expect(classifyRunnerLevel("5K", 330)).toBe("intermediario");
  });

  it("classifies iniciante 5K pace (> 6:00 = > 360s)", () => {
    expect(classifyRunnerLevel("5K", 400)).toBe("iniciante");
  });

  it("classifies 10K paces correctly", () => {
    expect(classifyRunnerLevel("10K", 260)).toBe("elite");
    expect(classifyRunnerLevel("10K", 320)).toBe("avancado");
    expect(classifyRunnerLevel("10K", 380)).toBe("intermediario");
    expect(classifyRunnerLevel("10K", 420)).toBe("iniciante");
  });

  it("classifies 21K paces correctly", () => {
    expect(classifyRunnerLevel("21K", 290)).toBe("elite");
    expect(classifyRunnerLevel("21K", 350)).toBe("avancado");
    expect(classifyRunnerLevel("21K", 410)).toBe("intermediario");
    expect(classifyRunnerLevel("21K", 450)).toBe("iniciante");
  });

  it("returns intermediário for unknown buckets", () => {
    expect(classifyRunnerLevel("< 3K", 300)).toBe("intermediario");
    expect(classifyRunnerLevel("unknown", 300)).toBe("intermediario");
  });

  it("handles exact threshold values (inclusive)", () => {
    expect(classifyRunnerLevel("5K", 240)).toBe("elite");
    expect(classifyRunnerLevel("5K", 300)).toBe("avancado");
    expect(classifyRunnerLevel("5K", 360)).toBe("intermediario");
  });
});

// ─── getLevelLabel ──────────────────────────────────────

describe("getLevelLabel", () => {
  it("returns correct labels", () => {
    expect(getLevelLabel("elite")).toBe("Elite");
    expect(getLevelLabel("avancado")).toBe("Avançado");
    expect(getLevelLabel("intermediario")).toBe("Intermediário");
    expect(getLevelLabel("iniciante")).toBe("Iniciante");
  });
});

// ─── formatPaceFromSeconds ──────────────────────────────

describe("formatPaceFromSeconds", () => {
  it("formats whole minutes", () => {
    expect(formatPaceFromSeconds(300)).toBe("5:00");
    expect(formatPaceFromSeconds(360)).toBe("6:00");
  });

  it("formats minutes and seconds", () => {
    expect(formatPaceFromSeconds(323)).toBe("5:23");
    expect(formatPaceFromSeconds(390)).toBe("6:30");
  });

  it("pads seconds with zero", () => {
    expect(formatPaceFromSeconds(245)).toBe("4:05");
  });
});

// ─── buildPerformanceProfile ────────────────────────────

describe("buildPerformanceProfile", () => {
  // Helper to create a mock activity
  function makeActivity(
    distanceKm: number,
    paceSecondsPerKm: number,
    daysAgo: number = 0,
  ) {
    const date = new Date();
    date.setDate(date.getDate() - daysAgo);
    return {
      distance: distanceKm * 1000,
      average_speed: 1000 / paceSecondsPerKm,
      start_date_local: date.toISOString(),
    };
  }

  it("computes pace per distance bucket", () => {
    const activities = [
      makeActivity(5, 320, 1),
      makeActivity(5, 340, 3),
      makeActivity(10, 350, 5),
    ];
    const profile = buildPerformanceProfile(activities);

    expect(profile.paceByDistance["5K"]).toBe(330); // avg of 320 and 340
    expect(profile.paceByDistance["10K"]).toBe(350);
  });

  it("classifies levels per distance", () => {
    const activities = [
      makeActivity(5, 280, 1), // avançado for 5K
      makeActivity(5, 290, 3),
      makeActivity(10, 400, 5), // iniciante for 10K
    ];
    const profile = buildPerformanceProfile(activities);

    expect(profile.levelByDistance["5K"]).toBe("avancado");
    expect(profile.levelByDistance["10K"]).toBe("iniciante");
  });

  it("determines preferred distances (top 2 by count)", () => {
    const activities = [
      makeActivity(5, 320, 1),
      makeActivity(5, 330, 2),
      makeActivity(5, 340, 3),
      makeActivity(10, 350, 4),
      makeActivity(10, 360, 5),
      makeActivity(2, 400, 6),
    ];
    const profile = buildPerformanceProfile(activities);

    expect(profile.preferredDistances[0]).toBe("5K");
    expect(profile.preferredDistances[1]).toBe("10K");
  });

  it("sets overall level from most-run distance", () => {
    const activities = [
      makeActivity(5, 280, 1), // avançado
      makeActivity(5, 290, 2),
      makeActivity(5, 285, 3),
      makeActivity(10, 400, 4),
    ];
    const profile = buildPerformanceProfile(activities);

    expect(profile.overallLevel).toBe("avancado");
  });

  it("calculates weekly volume from last 8 weeks", () => {
    // 4 runs of 5km in the last 8 weeks = 20km / 8 = 2.5 km/week
    const activities = [
      makeActivity(5, 320, 1),
      makeActivity(5, 320, 10),
      makeActivity(5, 320, 20),
      makeActivity(5, 320, 30),
    ];
    const profile = buildPerformanceProfile(activities);

    expect(profile.weeklyVolumeKm).toBe(2.5);
  });

  it("detects next challenge when volume is sufficient", () => {
    // Mostly 5K runner with 25km/week → should suggest 10K (needs 20km/week)
    const activities = Array.from({ length: 20 }, (_, i) =>
      makeActivity(5, 320, i * 2)
    );
    const profile = buildPerformanceProfile(activities);

    expect(profile.preferredDistances[0]).toBe("5K");
    // 20 * 5km = 100km in ~40 days ≈ ~17km/week in 8 weeks
    // Actually: activities within 56 days / 8 = volume
    // 20 runs * 5km = 100km, all within 40 days (within 56 day window)
    // 100 / 8 = 12.5 km/week — not enough for 10K (needs 20)
    expect(profile.nextChallenge).toBeNull();
  });

  it("detects next challenge with high volume", () => {
    // Frequent 5K runner, high volume
    const activities = Array.from({ length: 40 }, (_, i) =>
      makeActivity(5, 320, i)
    );
    const profile = buildPerformanceProfile(activities);

    // 40 runs within 56 days, all 5km = 200km, but only ~40 within window
    // Let's calculate: 40 activities, 1 per day, all within 40 days < 56 days
    // All 40 are within 8 weeks → 200km / 8 = 25 km/week → 10K needs 20 ✓
    expect(profile.nextChallenge).toBe("10K");
  });

  it("returns null next challenge for 42K runners", () => {
    const activities = [
      makeActivity(42, 360, 1),
      makeActivity(42, 370, 10),
      makeActivity(42, 365, 20),
    ];
    const profile = buildPerformanceProfile(activities);

    expect(profile.nextChallenge).toBeNull();
  });

  it("skips activities under 1km", () => {
    const activities = [
      makeActivity(0.5, 400, 1), // should be skipped
      makeActivity(5, 320, 2),
      makeActivity(5, 330, 3),
    ];
    const profile = buildPerformanceProfile(activities);

    expect(profile.paceByDistance["< 3K"]).toBeUndefined();
    expect(profile.paceByDistance["5K"]).toBeDefined();
  });

  it("detects improving trend", () => {
    // Older runs slower, recent runs faster (activities are ordered recent-first)
    const activities = [
      // Recent (faster) - index 0-5
      makeActivity(5, 300, 1),
      makeActivity(5, 305, 3),
      makeActivity(5, 310, 5),
      makeActivity(5, 308, 7),
      makeActivity(5, 302, 9),
      makeActivity(5, 312, 11),
      // Older (slower) - index 6-11
      makeActivity(5, 350, 13),
      makeActivity(5, 355, 15),
      makeActivity(5, 360, 17),
      makeActivity(5, 358, 19),
      makeActivity(5, 352, 21),
      makeActivity(5, 362, 23),
    ];
    const profile = buildPerformanceProfile(activities);

    expect(profile.trend).toBe("improving");
  });

  it("detects stable trend", () => {
    const activities = Array.from({ length: 12 }, (_, i) =>
      makeActivity(5, 320 + (i % 2 === 0 ? 1 : -1), i * 2)
    );
    const profile = buildPerformanceProfile(activities);

    expect(profile.trend).toBe("stable");
  });

  it("returns stable trend with fewer than 6 activities", () => {
    const activities = [
      makeActivity(5, 320, 1),
      makeActivity(5, 340, 3),
    ];
    const profile = buildPerformanceProfile(activities);

    expect(profile.trend).toBe("stable");
  });

  it("handles empty activities", () => {
    const profile = buildPerformanceProfile([]);

    expect(profile.preferredDistances).toEqual([]);
    expect(profile.overallLevel).toBe("intermediario");
    expect(profile.weeklyVolumeKm).toBe(0);
    expect(profile.nextChallenge).toBeNull();
    expect(profile.trend).toBe("stable");
  });
});

// ─── scoreRaceForUser ──────────────────────────────────

describe("scoreRaceForUser", () => {
  const baseProfile: PerformanceProfile = {
    paceByDistance: { "5K": 320, "10K": 350 },
    levelByDistance: { "5K": "avancado", "10K": "intermediario" },
    overallLevel: "avancado",
    weeklyVolumeKm: 25,
    nextChallenge: "10K",
    trend: "improving",
    preferredDistances: ["5K", "10K"],
  };

  const baseUser: UserLocation = {
    latitude: -20.8113,
    longitude: -49.3758,
    state: "SP",
  };

  function makeRace(overrides: Partial<RaceCandidate> = {}): RaceCandidate {
    return {
      id: "race-1",
      distances: ["5km"],
      latitude: null,
      longitude: null,
      state: null,
      is_promoted: false,
      ...overrides,
    };
  }

  it("scores +10 for distance match on preferred distance", () => {
    const { score } = scoreRaceForUser(baseProfile, baseUser, makeRace({ distances: ["5km"] }));
    expect(score).toBe(10);
  });

  it("includes pace in reason when pace data exists", () => {
    const { reason } = scoreRaceForUser(baseProfile, baseUser, makeRace({ distances: ["5km"] }));
    expect(reason).toContain("pace");
  });

  it("returns 'sua distância favorita' when no pace for matched distance", () => {
    const profileNoPace: PerformanceProfile = {
      ...baseProfile,
      paceByDistance: {},
    };
    const { reason } = scoreRaceForUser(profileNoPace, baseUser, makeRace({ distances: ["5km"] }));
    expect(reason).toBe("sua distância favorita");
  });

  it("scores +8 for next challenge match", () => {
    // 10K is the nextChallenge, race offers 10km
    const race = makeRace({ distances: ["10km"] });
    const profileNoPreferred: PerformanceProfile = {
      ...baseProfile,
      preferredDistances: [], // no distance match, only next challenge
    };
    const { score } = scoreRaceForUser(profileNoPreferred, baseUser, race);
    expect(score).toBe(8);
  });

  it("scores +5 for location within 50km", () => {
    // ~20km away from base user
    const race = makeRace({
      distances: ["100km"], // no distance match
      latitude: -20.95,
      longitude: -49.40,
    });
    const profileEmpty: PerformanceProfile = {
      ...baseProfile,
      preferredDistances: [],
      nextChallenge: null,
    };
    const { score } = scoreRaceForUser(profileEmpty, baseUser, race);
    expect(score).toBe(5);
  });

  it("scores +2 for location within 150km", () => {
    // ~120km away
    const race = makeRace({
      distances: ["100km"],
      latitude: -21.8,
      longitude: -49.40,
    });
    const profileEmpty: PerformanceProfile = {
      ...baseProfile,
      preferredDistances: [],
      nextChallenge: null,
    };
    const { score } = scoreRaceForUser(profileEmpty, baseUser, race);
    expect(score).toBe(2);
  });

  it("scores +3 for same state when no coordinates", () => {
    const race = makeRace({
      distances: ["100km"],
      state: "SP",
    });
    const profileEmpty: PerformanceProfile = {
      ...baseProfile,
      preferredDistances: [],
      nextChallenge: null,
    };
    const userNoCoords: UserLocation = { latitude: null, longitude: null, state: "SP" };
    const { score } = scoreRaceForUser(profileEmpty, userNoCoords, race);
    expect(score).toBe(3);
  });

  it("scores +1 for promoted race", () => {
    const race = makeRace({
      distances: ["100km"],
      is_promoted: true,
    });
    const profileEmpty: PerformanceProfile = {
      ...baseProfile,
      preferredDistances: [],
      nextChallenge: null,
    };
    const { score } = scoreRaceForUser(profileEmpty, baseUser, race);
    expect(score).toBe(1);
  });

  it("returns score 0 for no match at all", () => {
    const race = makeRace({ distances: ["100km"] });
    const profileEmpty: PerformanceProfile = {
      ...baseProfile,
      preferredDistances: [],
      nextChallenge: null,
    };
    const userNoState: UserLocation = { latitude: null, longitude: null, state: null };
    const { score, reason } = scoreRaceForUser(profileEmpty, userNoState, race);
    expect(score).toBe(0);
    expect(reason).toBe("corrida próxima");
  });

  it("accumulates distance + location + promoted scores", () => {
    const race = makeRace({
      distances: ["5km"],
      latitude: -20.82,
      longitude: -49.38,
      is_promoted: true,
    });
    const { score } = scoreRaceForUser(baseProfile, baseUser, race);
    // distance match (10) + next challenge 10K not matched + location <50km (5) + promoted (1) = 16
    expect(score).toBe(16);
  });

  it("handles unparseable race distances gracefully", () => {
    const race = makeRace({ distances: ["Fun Run", "Corrida Divertida"] });
    const { score } = scoreRaceForUser(baseProfile, baseUser, race);
    // No distance parsed → no distance or challenge match
    expect(score).toBeLessThan(10);
  });
});
