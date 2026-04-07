import { describe, it, expect, beforeEach } from "vitest";

/**
 * Tests for the sessionStorage cache logic used by scroll restoration
 * in the race listing. We test the cache contract directly since
 * saveCache/loadCache are private — we replicate their logic here
 * to validate the serialization/deserialization contract.
 */

const CACHE_KEY = "race-list-cache";
const SCROLL_KEY = "race-list-scroll";

interface CachedState {
  races: Array<{ id: string; name: string }>;
  page: number;
  hasMore: boolean;
  filterKey: string;
}

// Minimal sessionStorage mock for node environment
const store = new Map<string, string>();
const sessionStorage = {
  getItem: (key: string) => store.get(key) ?? null,
  setItem: (key: string, value: string) => { store.set(key, value); },
  removeItem: (key: string) => { store.delete(key); },
  clear: () => { store.clear(); },
};

function saveCache(state: CachedState) {
  try {
    sessionStorage.setItem(CACHE_KEY, JSON.stringify(state));
  } catch { /* quota exceeded — ignore */ }
}

function loadCache(filterKey: string): CachedState | null {
  try {
    const raw = sessionStorage.getItem(CACHE_KEY);
    if (!raw) return null;
    const cached: CachedState = JSON.parse(raw);
    return cached.filterKey === filterKey ? cached : null;
  } catch {
    return null;
  }
}

// ─── Cache save/load ─────────────────────────────────────

describe("race list cache", () => {
  beforeEach(() => {
    store.clear();
  });

  it("saves and loads cache when filterKey matches", () => {
    const state: CachedState = {
      races: [{ id: "1", name: "Corrida A" }, { id: "2", name: "Corrida B" }],
      page: 2,
      hasMore: true,
      filterKey: '{"city":"SP"}',
    };

    saveCache(state);

    const loaded = loadCache('{"city":"SP"}');
    expect(loaded).toEqual(state);
  });

  it("returns null when filterKey does not match", () => {
    saveCache({
      races: [{ id: "1", name: "Corrida A" }],
      page: 1,
      hasMore: false,
      filterKey: '{"city":"SP"}',
    });

    const loaded = loadCache('{"city":"RJ"}');
    expect(loaded).toBeNull();
  });

  it("returns null when no cache exists", () => {
    const loaded = loadCache('{"city":"SP"}');
    expect(loaded).toBeNull();
  });

  it("returns null when cache contains invalid JSON", () => {
    sessionStorage.setItem(CACHE_KEY, "not-json{{{");
    const loaded = loadCache("anything");
    expect(loaded).toBeNull();
  });

  it("overwrites previous cache on save", () => {
    saveCache({
      races: [{ id: "1", name: "Old" }],
      page: 1,
      hasMore: true,
      filterKey: "key1",
    });

    saveCache({
      races: [{ id: "2", name: "New" }],
      page: 3,
      hasMore: false,
      filterKey: "key2",
    });

    expect(loadCache("key1")).toBeNull();
    expect(loadCache("key2")).toEqual({
      races: [{ id: "2", name: "New" }],
      page: 3,
      hasMore: false,
      filterKey: "key2",
    });
  });
});

// ─── Scroll position storage ────────────────────────────

describe("scroll position storage", () => {
  beforeEach(() => {
    store.clear();
  });

  it("saves and retrieves scroll position", () => {
    sessionStorage.setItem(SCROLL_KEY, "1250");
    const scrollY = Number(sessionStorage.getItem(SCROLL_KEY));
    expect(scrollY).toBe(1250);
  });

  it("returns NaN for non-numeric values", () => {
    sessionStorage.setItem(SCROLL_KEY, "abc");
    const scrollY = Number(sessionStorage.getItem(SCROLL_KEY));
    expect(Number.isNaN(scrollY)).toBe(true);
  });

  it("returns null when no scroll position saved", () => {
    const raw = sessionStorage.getItem(SCROLL_KEY);
    expect(raw).toBeNull();
  });
});

// ─── buildUrl contract ──────────────────────────────────

describe("buildUrl contract", () => {
  // Replicate buildUrl to validate query param construction
  function buildUrl(
    filters: Record<string, unknown>,
    search: string,
    pageNum: number,
  ) {
    const params = new URLSearchParams();
    params.set("page", String(pageNum));
    params.set("limit", "20");

    if (filters.city) params.set("city", String(filters.city));
    if (filters.dateFrom) params.set("dateFrom", String(filters.dateFrom));
    if (filters.dateTo) params.set("dateTo", String(filters.dateTo));
    if (Array.isArray(filters.distances) && filters.distances.length)
      params.set("distances", filters.distances.join(","));
    if (Array.isArray(filters.prizeType) && filters.prizeType.length)
      params.set("prizeType", filters.prizeType.join(","));
    if (search) params.set("search", search);
    if (filters.lat) params.set("lat", String(filters.lat));
    if (filters.lng) params.set("lng", String(filters.lng));
    if (filters.radius) params.set("radius", String(filters.radius));

    return `/api/races?${params.toString()}`;
  }

  it("builds URL with page and limit", () => {
    const url = buildUrl({}, "", 1);
    expect(url).toBe("/api/races?page=1&limit=20");
  });

  it("includes city filter", () => {
    const url = buildUrl({ city: "São Paulo" }, "", 1);
    expect(url).toContain("city=S%C3%A3o+Paulo");
  });

  it("includes search term", () => {
    const url = buildUrl({}, "maratona", 1);
    expect(url).toContain("search=maratona");
  });

  it("includes multiple distances", () => {
    const url = buildUrl({ distances: ["5K", "10K", "21K"] }, "", 1);
    expect(url).toContain("distances=5K%2C10K%2C21K");
  });

  it("includes radius with coordinates", () => {
    const url = buildUrl({ lat: -23.55, lng: -46.63, radius: 50 }, "", 1);
    expect(url).toContain("lat=-23.55");
    expect(url).toContain("lng=-46.63");
    expect(url).toContain("radius=50");
  });

  it("increments page for load more", () => {
    const url = buildUrl({}, "", 3);
    expect(url).toContain("page=3");
  });
});
