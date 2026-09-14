import { beforeEach, describe, expect, it, vi } from "vitest";

const { rpc } = vi.hoisted(() => ({ rpc: vi.fn() }));

vi.mock("@/lib/supabase/admin", () => ({
  createAdminClient: () => ({ rpc }),
}));

import { rateLimit } from "@/lib/rate-limit";

describe("rateLimit", () => {
  beforeEach(() => rpc.mockReset());

  it("delegates enforcement to the distributed database function", async () => {
    rpc.mockResolvedValue({ data: false, error: null });
    await expect(rateLimit("admin:user-123", { max: 5, windowMs: 60_001 }))
      .resolves.toEqual({ limited: false });
    expect(rpc).toHaveBeenCalledWith("consume_rate_limit", {
      p_key_hash: expect.stringMatching(/^[a-f0-9]{64}$/),
      p_max: 5,
      p_window_seconds: 61,
    });
  });

  it("reports a request blocked by the database", async () => {
    rpc.mockResolvedValue({ data: true, error: null });
    await expect(rateLimit("view:ip:race", { max: 1, windowMs: 600_000 }))
      .resolves.toEqual({ limited: true });
  });

  it("fails open when the limiter storage is unavailable", async () => {
    const errorSpy = vi.spyOn(console, "error").mockImplementation(() => undefined);
    rpc.mockResolvedValue({ data: null, error: { message: "database unavailable" } });
    await expect(rateLimit("profile:user", { max: 5, windowMs: 60_000 }))
      .resolves.toEqual({ limited: false });
    expect(errorSpy).toHaveBeenCalled();
    errorSpy.mockRestore();
  });

  it("never stores the raw identifier", async () => {
    rpc.mockResolvedValue({ data: false, error: null });
    const rawKey = "private-user-id";
    await rateLimit(rawKey, { max: 2, windowMs: 1_000 });
    expect(rpc.mock.calls[0][1].p_key_hash).not.toContain(rawKey);
  });

  it("uses distinct hashes for distinct identifiers", async () => {
    rpc.mockResolvedValue({ data: false, error: null });
    await rateLimit("user-a", { max: 1, windowMs: 1_000 });
    await rateLimit("user-b", { max: 1, windowMs: 1_000 });
    expect(rpc.mock.calls[0][1].p_key_hash).not.toBe(rpc.mock.calls[1][1].p_key_hash);
  });

  it("rounds sub-second windows up to one second", async () => {
    rpc.mockResolvedValue({ data: false, error: null });
    await rateLimit("short-window", { max: 1, windowMs: 1 });
    expect(rpc.mock.calls[0][1].p_window_seconds).toBe(1);
  });

  it("passes the configured maximum unchanged", async () => {
    rpc.mockResolvedValue({ data: false, error: null });
    await rateLimit("ai:user", { max: 17, windowMs: 60_000 });
    expect(rpc.mock.calls[0][1].p_max).toBe(17);
  });
});
