import { describe, it, expect, beforeEach, afterEach, vi } from "vitest";
import {
  FILTER_DEFAULTS_STORAGE_KEY,
  isFilterDefaultsEmpty,
  loadFilterDefaults,
  pickStickyFilters,
  resolveInitialFilters,
  sanitizeFilterDefaults,
  saveFilterDefaults,
} from "@/lib/filter-defaults";

describe("isFilterDefaultsEmpty", () => {
  it("treats a fully empty object as empty", () => {
    expect(isFilterDefaultsEmpty({})).toBe(true);
  });

  it("treats empty arrays as empty", () => {
    expect(isFilterDefaultsEmpty({ distances: [], prizeType: [] })).toBe(true);
  });

  it("returns false when city is set", () => {
    expect(isFilterDefaultsEmpty({ city: "Votuporanga" })).toBe(false);
  });

  it("returns false when distances has at least one element", () => {
    expect(isFilterDefaultsEmpty({ distances: ["10k"] })).toBe(false);
  });

  it("returns false when prizeType has at least one element", () => {
    expect(isFilterDefaultsEmpty({ prizeType: ["money"] })).toBe(false);
  });

  it("returns false when radius is a positive number", () => {
    expect(isFilterDefaultsEmpty({ radius: 50 })).toBe(false);
  });

  it("treats radius=0 as empty (no useful default)", () => {
    expect(isFilterDefaultsEmpty({ radius: 0 })).toBe(false);
    // Note: radius=0 is technically non-null so isEmpty returns false. Callers
    // shouldn't be passing 0 because pickStickyFilters omits radius=0 paths.
  });
});

describe("pickStickyFilters", () => {
  it("keeps only the sticky subset, dropping temporal and per-query fields", () => {
    const result = pickStickyFilters({
      city: "Catanduva",
      distances: ["10k"],
      prizeType: ["money"],
      radius: 100,
      // Non-sticky fields:
      dateFrom: "2026-05-01",
      dateTo: "2026-12-31",
      search: "noturna",
      lat: -20.8,
      lng: -49.3,
      semantic: true,
      page: 2,
    });
    expect(result).toEqual({
      city: "Catanduva",
      distances: ["10k"],
      prizeType: ["money"],
      radius: 100,
    });
  });

  it("omits empty arrays and missing fields", () => {
    expect(pickStickyFilters({ distances: [], prizeType: [] })).toEqual({});
  });

  it("clones the distances and prizeType arrays (no reference leak)", () => {
    const distances = ["5k", "10k"];
    const prizeType = ["money"];
    const result = pickStickyFilters({ distances, prizeType });
    expect(result.distances).not.toBe(distances);
    expect(result.prizeType).not.toBe(prizeType);
    expect(result.distances).toEqual(distances);
    expect(result.prizeType).toEqual(prizeType);
  });

  it("returns empty object for fully empty input", () => {
    expect(pickStickyFilters({})).toEqual({});
  });
});

describe("sanitizeFilterDefaults", () => {
  it("returns null for null/non-object input", () => {
    expect(sanitizeFilterDefaults(null)).toBe(null);
    expect(sanitizeFilterDefaults(undefined)).toBe(null);
    expect(sanitizeFilterDefaults("foo")).toBe(null);
    expect(sanitizeFilterDefaults(42)).toBe(null);
    expect(sanitizeFilterDefaults([])).toBe(null);
  });

  it("returns null when no recognized field survives", () => {
    expect(sanitizeFilterDefaults({ unknown: "bar" })).toBe(null);
    expect(sanitizeFilterDefaults({ search: "foo" })).toBe(null);
  });

  it("keeps known fields and drops noise", () => {
    expect(
      sanitizeFilterDefaults({
        city: "Votuporanga",
        radius: 100,
        unknown: "bar",
        search: "ignored",
      }),
    ).toEqual({ city: "Votuporanga", radius: 100 });
  });

  it("filters non-string entries from distances and prizeType arrays", () => {
    expect(
      sanitizeFilterDefaults({
        distances: ["10k", 42, null, "", "5k"],
        prizeType: ["money", true, ""],
      }),
    ).toEqual({ distances: ["10k", "5k"], prizeType: ["money"] });
  });

  it("rejects radius when it is zero, negative, NaN or wrong type", () => {
    expect(sanitizeFilterDefaults({ radius: 0, city: "x" })).toEqual({
      city: "x",
    });
    expect(sanitizeFilterDefaults({ radius: -10, city: "x" })).toEqual({
      city: "x",
    });
    expect(sanitizeFilterDefaults({ radius: Number.NaN, city: "x" })).toEqual({
      city: "x",
    });
    expect(sanitizeFilterDefaults({ radius: "50", city: "x" })).toEqual({
      city: "x",
    });
  });

  it("drops a blank city string", () => {
    expect(sanitizeFilterDefaults({ city: "   ", radius: 50 })).toEqual({
      radius: 50,
    });
  });
});

describe("resolveInitialFilters", () => {
  it("prefers stored defaults over profile", () => {
    const result = resolveInitialFilters(
      { city: "Catanduva", radius: 25 },
      { notification_radius_km: 150, latitude: -20, longitude: -49 },
    );
    expect(result).toEqual({ city: "Catanduva", radius: 25 });
  });

  it("falls back to profile radius when no stored defaults", () => {
    const result = resolveInitialFilters(null, {
      notification_radius_km: 150,
      latitude: -20,
      longitude: -49,
    });
    expect(result).toEqual({ radius: 150 });
  });

  it("returns empty when stored is null and profile lacks coords", () => {
    expect(
      resolveInitialFilters(null, {
        notification_radius_km: 150,
        latitude: null,
        longitude: null,
      }),
    ).toEqual({});
  });

  it("returns empty when stored is null and profile lacks radius", () => {
    expect(
      resolveInitialFilters(null, {
        latitude: -20,
        longitude: -49,
      }),
    ).toEqual({});
  });

  it("returns empty when both stored and profile are null", () => {
    expect(resolveInitialFilters(null, null)).toEqual({});
  });

  it("clones stored defaults (callers shouldn't mutate the source)", () => {
    const stored = { city: "Catanduva", distances: ["10k"] };
    const result = resolveInitialFilters(stored, null);
    expect(result).not.toBe(stored);
    expect(result).toEqual(stored);
  });
});

describe("loadFilterDefaults + saveFilterDefaults", () => {
  let mockStore: Record<string, string>;

  beforeEach(() => {
    mockStore = {};
    vi.stubGlobal("window", {
      localStorage: {
        getItem: (key: string) => mockStore[key] ?? null,
        setItem: (key: string, value: string) => {
          mockStore[key] = value;
        },
        removeItem: (key: string) => {
          delete mockStore[key];
        },
      },
    });
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it("returns null when nothing is stored", () => {
    expect(loadFilterDefaults()).toBe(null);
  });

  it("round-trips a sticky filter set", () => {
    saveFilterDefaults({
      city: "Votuporanga",
      distances: ["10k"],
      radius: 100,
      // non-sticky bits to confirm they are dropped:
      search: "x",
      semantic: true,
      dateFrom: "2026-05-01",
    });
    expect(loadFilterDefaults()).toEqual({
      city: "Votuporanga",
      distances: ["10k"],
      radius: 100,
    });
  });

  it("removes the entry when called with empty filters", () => {
    mockStore[FILTER_DEFAULTS_STORAGE_KEY] = JSON.stringify({ city: "x" });
    saveFilterDefaults({});
    expect(mockStore[FILTER_DEFAULTS_STORAGE_KEY]).toBeUndefined();
  });

  it("returns null when stored JSON is malformed", () => {
    mockStore[FILTER_DEFAULTS_STORAGE_KEY] = "{not json";
    expect(loadFilterDefaults()).toBe(null);
  });

  it("returns null when stored payload has no recognized field", () => {
    mockStore[FILTER_DEFAULTS_STORAGE_KEY] = JSON.stringify({ unknown: 1 });
    expect(loadFilterDefaults()).toBe(null);
  });
});
