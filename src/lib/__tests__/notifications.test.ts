import { describe, it, expect, vi, beforeEach } from "vitest";

const { mockSendNotification, mockSetVapidDetails, mockFrom, mockRpc } = vi.hoisted(() => ({
  mockSendNotification: vi.fn(),
  mockSetVapidDetails: vi.fn(),
  mockFrom: vi.fn(),
  mockRpc: vi.fn(),
}));

vi.mock("web-push", () => ({
  default: {
    setVapidDetails: mockSetVapidDetails,
    sendNotification: mockSendNotification,
  },
}));

vi.mock("@/lib/supabase/admin", () => ({
  createAdminClient: () => ({ from: mockFrom, rpc: mockRpc }),
}));

// Must import AFTER mocks are set up
import { sendToSubscriptions, notifyPersonalizedRace, notifyNewSuggestion } from "@/lib/notifications";

function makeSub(endpoint = "https://push.example.com/sub1") {
  return { endpoint, p256dh: "key-p256dh", auth: "key-auth" };
}

beforeEach(() => {
  vi.clearAllMocks();
  // Set required env vars for VAPID
  process.env.VAPID_SUBJECT = "mailto:test@test.com";
  process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY = "public-key";
  process.env.VAPID_PRIVATE_KEY = "private-key";
  process.env.NEXT_PUBLIC_APP_URL = "https://largada.app";
});

// ─── sendToSubscriptions ────────────────────────────────

describe("sendToSubscriptions", () => {
  it("returns {sent:0, failed:0} for empty subscriptions", async () => {
    const result = await sendToSubscriptions({
      title: "Test",
      body: "Body",
      url: "/test",
      subscriptions: [],
    });
    expect(result).toEqual({ sent: 0, failed: 0 });
    expect(mockSendNotification).not.toHaveBeenCalled();
  });

  it("returns correct sent/failed counts", async () => {
    mockSendNotification
      .mockResolvedValueOnce({}) // success
      .mockRejectedValueOnce({ statusCode: 500 }); // failure (not expired)

    const result = await sendToSubscriptions({
      title: "Nova corrida",
      body: "5K em SP",
      url: "/corrida/slug",
      subscriptions: [makeSub("https://a.com"), makeSub("https://b.com")],
    });

    expect(result).toEqual({ sent: 1, failed: 1 });
    expect(mockSendNotification).toHaveBeenCalledTimes(2);
  });

  it("cleans up expired subscriptions (410)", async () => {
    const mockDelete = vi.fn().mockReturnValue({ in: vi.fn().mockResolvedValue({}) });
    mockFrom.mockReturnValue({ delete: mockDelete });

    mockSendNotification.mockRejectedValueOnce({ statusCode: 410 });

    await sendToSubscriptions({
      title: "Test",
      body: "Body",
      url: "/test",
      subscriptions: [makeSub("https://expired.com")],
    });

    expect(mockFrom).toHaveBeenCalledWith("push_subscriptions");
    expect(mockDelete).toHaveBeenCalled();
  });

  it("cleans up expired subscriptions (404)", async () => {
    const mockIn = vi.fn().mockResolvedValue({});
    const mockDelete = vi.fn().mockReturnValue({ in: mockIn });
    mockFrom.mockReturnValue({ delete: mockDelete });

    mockSendNotification.mockRejectedValueOnce({ statusCode: 404 });

    await sendToSubscriptions({
      title: "Test",
      body: "Body",
      url: "/test",
      subscriptions: [makeSub("https://gone.com")],
    });

    expect(mockIn).toHaveBeenCalledWith("endpoint", ["https://gone.com"]);
  });

  it("builds absolute URL from relative path", async () => {
    mockSendNotification.mockResolvedValueOnce({});

    await sendToSubscriptions({
      title: "Test",
      body: "Body",
      url: "/corrida/abc",
      subscriptions: [makeSub()],
    });

    const payload = JSON.parse(mockSendNotification.mock.calls[0][1]);
    expect(payload.url).toBe("https://largada.app/corrida/abc");
  });

  it("keeps absolute URL as-is", async () => {
    mockSendNotification.mockResolvedValueOnce({});

    await sendToSubscriptions({
      title: "Test",
      body: "Body",
      url: "https://other.com/page",
      subscriptions: [makeSub()],
    });

    const payload = JSON.parse(mockSendNotification.mock.calls[0][1]);
    expect(payload.url).toBe("https://other.com/page");
  });
});

// ─── notifyPersonalizedRace ─────────────────────────────

describe("notifyPersonalizedRace", () => {
  it("logs the recommendation even when user has no subscriptions", async () => {
    // The upsert must still happen so the "Pra você porque..." chip can render
    // on the listing even for users who opted out of push.
    const mockUpsert = vi.fn().mockResolvedValue({});
    mockFrom.mockImplementation((table: string) => {
      if (table === "push_subscriptions") {
        return {
          select: vi.fn().mockReturnValue({
            eq: vi.fn().mockResolvedValue({ data: null }),
          }),
        };
      }
      if (table === "race_recommendation_logs") {
        return { upsert: mockUpsert };
      }
      return {};
    });

    const result = await notifyPersonalizedRace(
      "user-1",
      { id: "race-1", name: "Corrida X", city: "SP", slug: "corrida-x" },
      "sua distância favorita",
    );

    expect(result).toEqual({ sent: 0 });
    expect(mockUpsert).toHaveBeenCalledTimes(1);
    expect(mockUpsert).toHaveBeenCalledWith(
      expect.objectContaining({
        user_id: "user-1",
        race_id: "race-1",
        match_reason: "sua distância favorita",
      }),
      { onConflict: "user_id,race_id" },
    );
  });

  it("sends push and logs the recommendation with match_reason on success", async () => {
    const mockEq = vi.fn().mockResolvedValue({
      data: [makeSub()],
    });
    const mockUpsert = vi.fn().mockResolvedValue({});

    mockFrom.mockImplementation((table: string) => {
      if (table === "push_subscriptions") {
        return { select: vi.fn().mockReturnValue({ eq: mockEq }) };
      }
      if (table === "race_recommendation_logs") {
        return { upsert: mockUpsert };
      }
      return {};
    });

    mockSendNotification.mockResolvedValueOnce({});

    const result = await notifyPersonalizedRace(
      "user-1",
      { id: "race-1", name: "Corrida X", city: "São Paulo", slug: "corrida-x" },
      "seu pace de 5:20/km é ideal",
      { heuristic: 12, cosine_sim: 0.9, final: 10.8, source: "blended" },
    );

    expect(result.sent).toBe(1);
    expect(mockUpsert).toHaveBeenCalledWith(
      expect.objectContaining({
        user_id: "user-1",
        race_id: "race-1",
        match_reason: "seu pace de 5:20/km é ideal",
        match_score_breakdown: expect.objectContaining({
          heuristic: 12,
          cosine_sim: 0.9,
          final: 10.8,
          source: "blended",
        }),
      }),
      { onConflict: "user_id,race_id" },
    );
  });

  it("still logs the recommendation when the push send fails", async () => {
    // The chip should appear in the listing regardless of push delivery — if
    // the user opens the app organically we want them to see why the race was
    // recommended.
    const mockEq = vi.fn().mockResolvedValue({
      data: [makeSub()],
    });
    const mockUpsert = vi.fn().mockResolvedValue({});

    mockFrom.mockImplementation((table: string) => {
      if (table === "push_subscriptions") {
        return { select: vi.fn().mockReturnValue({ eq: mockEq }) };
      }
      if (table === "race_recommendation_logs") {
        return { upsert: mockUpsert };
      }
      return {};
    });

    mockSendNotification.mockRejectedValueOnce({ statusCode: 500 });

    const result = await notifyPersonalizedRace(
      "user-1",
      { id: "race-1", name: "Corrida X", city: "SP", slug: "corrida-x" },
      "match",
    );

    expect(result.sent).toBe(0);
    expect(mockUpsert).toHaveBeenCalledTimes(1);
    expect(mockUpsert).toHaveBeenCalledWith(
      expect.objectContaining({
        user_id: "user-1",
        race_id: "race-1",
        match_reason: "match",
      }),
      { onConflict: "user_id,race_id" },
    );
  });
});

// ─── notifyNewSuggestion ────────────────────────────────

describe("notifyNewSuggestion", () => {
  it("does nothing when no admins exist", async () => {
    mockFrom.mockReturnValue({
      select: vi.fn().mockReturnValue({
        eq: vi.fn().mockReturnValue({
          eq: vi.fn().mockResolvedValue({ data: null }),
        }),
      }),
    });

    await notifyNewSuggestion("Corrida Legal", "SP");
    expect(mockSendNotification).not.toHaveBeenCalled();
  });

  it("sends notification to admin push subscriptions", async () => {
    mockFrom.mockImplementation((table: string) => {
      if (table === "profiles") {
        return {
          select: vi.fn().mockReturnValue({
            eq: vi.fn().mockReturnValue({
              eq: vi.fn().mockResolvedValue({
                data: [{ id: "admin-1" }],
              }),
            }),
          }),
        };
      }
      if (table === "push_subscriptions") {
        return {
          select: vi.fn().mockReturnValue({
            in: vi.fn().mockResolvedValue({
              data: [makeSub()],
            }),
          }),
        };
      }
      return {};
    });

    mockSendNotification.mockResolvedValueOnce({});

    await notifyNewSuggestion("Corrida Legal", "Rio Preto");

    expect(mockSendNotification).toHaveBeenCalledTimes(1);
    const payload = JSON.parse(mockSendNotification.mock.calls[0][1]);
    expect(payload.title).toBe("Nova sugestão de corrida");
    expect(payload.body).toContain("Corrida Legal");
    expect(payload.body).toContain("Rio Preto");
  });
});
