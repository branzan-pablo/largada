import { describe, it, expect, vi, beforeEach } from "vitest";

// Mock global fetch
const mockFetch = vi.fn();
vi.stubGlobal("fetch", mockFetch);

// ─── Supabase admin mock ─────────────────────────────────

function createMockAdmin(overrides: {
  tokensData?: Record<string, unknown> | null;
  tokensError?: unknown;
  cacheData?: Record<string, unknown> | null;
  cacheError?: unknown;
}) {
  const updateEq = vi.fn().mockResolvedValue({ data: null, error: null });
  const upsertResult = { data: null, error: null };

  const makeChain = (resolvedValue: { data: unknown; error: unknown }) => ({
    select: vi.fn().mockReturnValue({
      eq: vi.fn().mockReturnValue({
        single: vi.fn().mockResolvedValue(resolvedValue),
      }),
    }),
    update: vi.fn().mockReturnValue({ eq: updateEq }),
    upsert: vi.fn().mockResolvedValue(upsertResult),
  });

  const hasCacheError = !("cacheError" in overrides) || overrides.cacheError !== null;

  return {
    from: vi.fn((table: string) => {
      if (table === "strava_tokens") {
        return makeChain({
          data: overrides.tokensData ?? null,
          error: overrides.tokensError ?? null,
        });
      }
      if (table === "strava_athlete_cache") {
        return makeChain({
          data: overrides.cacheData ?? null,
          error: hasCacheError ? (overrides.cacheError ?? { code: "PGRST116" }) : null,
        });
      }
      return makeChain({ data: null, error: null });
    }),
    _updateEq: updateEq,
  };
}

// ─── getValidAccessToken ─────────────────────────────────

describe("getValidAccessToken", () => {
  beforeEach(() => {
    vi.resetModules();
    mockFetch.mockReset();
    // Set env vars needed by refreshStravaToken
    process.env.NEXT_PUBLIC_STRAVA_CLIENT_ID = "test-client-id";
    process.env.STRAVA_CLIENT_SECRET = "test-secret";
  });

  it("returns null when no tokens exist", async () => {
    const { getValidAccessToken } = await import("@/lib/strava");
    const admin = createMockAdmin({ tokensData: null });
    const result = await getValidAccessToken(admin as never, "user-1");
    expect(result).toBeNull();
  });

  it("returns token directly when not expired", async () => {
    const { getValidAccessToken } = await import("@/lib/strava");
    const futureExpiry = Math.floor(Date.now() / 1000) + 3600;
    const admin = createMockAdmin({
      tokensData: {
        access_token: "valid-token",
        refresh_token: "refresh-token",
        expires_at: futureExpiry,
        athlete_id: 12345,
        scope: "read,activity:read",
      },
    });

    const result = await getValidAccessToken(admin as never, "user-1");
    expect(result).toEqual({
      accessToken: "valid-token",
      athleteId: 12345,
      scope: "read,activity:read",
    });
    expect(mockFetch).not.toHaveBeenCalled();
  });

  it("refreshes token when expired", async () => {
    const { getValidAccessToken } = await import("@/lib/strava");
    const pastExpiry = Math.floor(Date.now() / 1000) - 100;
    const admin = createMockAdmin({
      tokensData: {
        access_token: "expired-token",
        refresh_token: "old-refresh",
        expires_at: pastExpiry,
        athlete_id: 12345,
        scope: "read,activity:read",
      },
    });

    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: async () => ({
        access_token: "new-token",
        refresh_token: "new-refresh",
        expires_at: pastExpiry + 21600,
      }),
    });

    const result = await getValidAccessToken(admin as never, "user-1");
    expect(result).toEqual({
      accessToken: "new-token",
      athleteId: 12345,
      scope: "read,activity:read",
    });
    // Should have called Strava token endpoint
    expect(mockFetch).toHaveBeenCalledWith(
      "https://www.strava.com/oauth/token",
      expect.objectContaining({ method: "POST" })
    );
    // Should update DB with new tokens
    expect(admin._updateEq).toHaveBeenCalled();
  });

  it("returns null when refresh fails", async () => {
    const { getValidAccessToken } = await import("@/lib/strava");
    const pastExpiry = Math.floor(Date.now() / 1000) - 100;
    const admin = createMockAdmin({
      tokensData: {
        access_token: "expired-token",
        refresh_token: "bad-refresh",
        expires_at: pastExpiry,
        athlete_id: 12345,
        scope: "read,activity:read",
      },
    });

    mockFetch.mockResolvedValueOnce({ ok: false, status: 401 });

    const result = await getValidAccessToken(admin as never, "user-1");
    expect(result).toBeNull();
  });
});

// ─── getAthleteData ──────────────────────────────────────

describe("getAthleteData", () => {
  beforeEach(() => {
    vi.resetModules();
    mockFetch.mockReset();
    process.env.NEXT_PUBLIC_STRAVA_CLIENT_ID = "test-client-id";
    process.env.STRAVA_CLIENT_SECRET = "test-secret";
  });

  it("returns needs_scope_upgrade when scope is missing activity:read", async () => {
    const { getAthleteData } = await import("@/lib/strava");
    const futureExpiry = Math.floor(Date.now() / 1000) + 3600;
    const admin = createMockAdmin({
      tokensData: {
        access_token: "token",
        refresh_token: "refresh",
        expires_at: futureExpiry,
        athlete_id: 12345,
        scope: "read,profile:read_all", // no activity:read
      },
    });

    const result = await getAthleteData(admin as never, "user-1");
    expect(result.needs_scope_upgrade).toBe(true);
    expect(result.activities).toEqual([]);
  });

  it("returns empty data when no tokens exist", async () => {
    const { getAthleteData } = await import("@/lib/strava");
    const admin = createMockAdmin({ tokensData: null });

    const result = await getAthleteData(admin as never, "user-1");
    expect(result.activities).toEqual([]);
    expect(result.stats).toBeNull();
    expect(result.needs_scope_upgrade).toBe(false);
  });

  it("returns cached data when cache is fresh", async () => {
    const { getAthleteData } = await import("@/lib/strava");
    const futureExpiry = Math.floor(Date.now() / 1000) + 3600;
    const cachedActivities = [{ id: 1, name: "Morning Run", type: "Run" }];
    const cachedStats = { all_run_totals: { count: 50 } };

    const admin = createMockAdmin({
      tokensData: {
        access_token: "token",
        refresh_token: "refresh",
        expires_at: futureExpiry,
        athlete_id: 12345,
        scope: "read,activity:read",
      },
      cacheData: {
        activities: cachedActivities,
        stats: cachedStats,
        synced_at: new Date().toISOString(), // fresh
      },
      cacheError: null,
    });

    const result = await getAthleteData(admin as never, "user-1");
    expect(result.activities).toEqual(cachedActivities);
    expect(result.stats).toEqual(cachedStats);
    // Should NOT have called Strava API
    expect(mockFetch).not.toHaveBeenCalled();
  });

  it("fetches from Strava when forceRefresh is true", async () => {
    const { getAthleteData } = await import("@/lib/strava");
    const futureExpiry = Math.floor(Date.now() / 1000) + 3600;
    const admin = createMockAdmin({
      tokensData: {
        access_token: "token",
        refresh_token: "refresh",
        expires_at: futureExpiry,
        athlete_id: 12345,
        scope: "read,activity:read",
      },
    });

    // Mock activities endpoint
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: async () => [
        { id: 1, name: "Run 1", type: "Run", distance: 5000 },
        { id: 2, name: "Ride", type: "Ride", distance: 20000 },
      ],
    });
    // Mock stats endpoint
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: async () => ({ all_run_totals: { count: 10, distance: 50000 } }),
    });

    const result = await getAthleteData(admin as never, "user-1", true);
    // Should only include Run, not Ride
    expect(result.activities).toHaveLength(1);
    expect(result.activities[0].name).toBe("Run 1");
    expect(result.stats).toEqual({ all_run_totals: { count: 10, distance: 50000 } });
    expect(result.needs_scope_upgrade).toBe(false);
  });

  it("returns empty on Strava API failure", async () => {
    const { getAthleteData } = await import("@/lib/strava");
    const futureExpiry = Math.floor(Date.now() / 1000) + 3600;
    const admin = createMockAdmin({
      tokensData: {
        access_token: "token",
        refresh_token: "refresh",
        expires_at: futureExpiry,
        athlete_id: 12345,
        scope: "read,activity:read",
      },
    });

    // Both API calls fail
    mockFetch.mockRejectedValue(new Error("Network error"));

    const result = await getAthleteData(admin as never, "user-1", true);
    expect(result.activities).toEqual([]);
    expect(result.stats).toBeNull();
  });
});
