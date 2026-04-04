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
} from "@/lib/strava-utils";

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
