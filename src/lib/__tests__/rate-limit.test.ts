import { describe, it, expect, vi, beforeEach } from "vitest";
import { rateLimit } from "@/lib/rate-limit";

describe("rateLimit", () => {
    beforeEach(() => {
        // Reset time mocking between tests
        vi.useRealTimers();
    });

    it("allows requests up to the max limit", () => {
        const key = "test-allow-" + Date.now();
        for (let i = 0; i < 5; i++) {
            expect(rateLimit(key, { max: 5, windowMs: 60_000 })).toEqual({ limited: false });
        }
    });

    it("blocks requests that exceed the max limit", () => {
        const key = "test-block-" + Date.now();
        // First 3 allowed
        for (let i = 0; i < 3; i++) {
            rateLimit(key, { max: 3, windowMs: 60_000 });
        }
        // 4th should be blocked
        expect(rateLimit(key, { max: 3, windowMs: 60_000 })).toEqual({ limited: true });
    });

    it("resets the counter after the window expires", () => {
        vi.useFakeTimers();
        const key = "test-reset";

        // Exhaust the limit
        for (let i = 0; i < 2; i++) {
            rateLimit(key, { max: 2, windowMs: 10_000 });
        }
        expect(rateLimit(key, { max: 2, windowMs: 10_000 })).toEqual({ limited: true });

        // Advance time past the window
        vi.advanceTimersByTime(11_000);

        // Should be allowed again
        expect(rateLimit(key, { max: 2, windowMs: 10_000 })).toEqual({ limited: false });
    });

    it("treats different keys independently", () => {
        const keyA = "test-a-" + Date.now();
        const keyB = "test-b-" + Date.now();

        // Exhaust key A
        rateLimit(keyA, { max: 1, windowMs: 60_000 });
        expect(rateLimit(keyA, { max: 1, windowMs: 60_000 })).toEqual({ limited: true });

        // Key B should still be allowed
        expect(rateLimit(keyB, { max: 1, windowMs: 60_000 })).toEqual({ limited: false });
    });

    it("allows exactly max requests (boundary check)", () => {
        const key = "test-boundary-" + Date.now();
        // Request 1 = allowed
        expect(rateLimit(key, { max: 1, windowMs: 60_000 }).limited).toBe(false);
        // Request 2 = blocked (exceeds max of 1)
        expect(rateLimit(key, { max: 1, windowMs: 60_000 }).limited).toBe(true);
    });

    it("cleans up expired entries when map exceeds 100 keys", () => {
        vi.useFakeTimers();
        const windowMs = 5_000;

        // Fill the map with >100 expired entries
        for (let i = 0; i < 101; i++) {
            rateLimit(`cleanup-${i}`, { max: 10, windowMs });
        }

        // Advance past the window so all entries are expired
        vi.advanceTimersByTime(windowMs + 1);

        // Next call should trigger cleanup (map.size > 100) and still work
        const result = rateLimit("cleanup-new", { max: 10, windowMs });
        expect(result).toEqual({ limited: false });
    });

    it("allows subsequent requests within limit after first request", () => {
        const key = "test-within-limit-" + Date.now();
        // max=5: requests 1 through 5 should all be allowed
        expect(rateLimit(key, { max: 5, windowMs: 60_000 }).limited).toBe(false); // 1st (new entry)
        expect(rateLimit(key, { max: 5, windowMs: 60_000 }).limited).toBe(false); // 2nd (count++)
        expect(rateLimit(key, { max: 5, windowMs: 60_000 }).limited).toBe(false); // 3rd
    });
});
