import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";

// We test getPaymentEnv by manipulating process.env
// Need to reset the module cache between tests to clear the cached env

describe("getPaymentEnv", () => {
    const originalEnv = { ...process.env };

    beforeEach(() => {
        // Reset module registry to clear cached validatedEnv
        vi.resetModules();
    });

    afterEach(() => {
        process.env = { ...originalEnv };
    });

    it("returns validated env when both variables are set", async () => {
        process.env.ABACATEPAY_API_KEY = "test-key-123";
        process.env.ABACATEPAY_WEBHOOK_SECRET = "test-secret-456";

        const { getPaymentEnv } = await import("@/lib/payments/env");
        const env = getPaymentEnv();

        expect(env.ABACATEPAY_API_KEY).toBe("test-key-123");
        expect(env.ABACATEPAY_WEBHOOK_SECRET).toBe("test-secret-456");
    });

    it("throws when ABACATEPAY_API_KEY is missing", async () => {
        delete process.env.ABACATEPAY_API_KEY;
        process.env.ABACATEPAY_WEBHOOK_SECRET = "test-secret";

        const { getPaymentEnv } = await import("@/lib/payments/env");

        expect(() => getPaymentEnv()).toThrow("Missing or invalid environment variables");
    });

    it("throws when ABACATEPAY_WEBHOOK_SECRET is missing", async () => {
        process.env.ABACATEPAY_API_KEY = "test-key";
        delete process.env.ABACATEPAY_WEBHOOK_SECRET;

        const { getPaymentEnv } = await import("@/lib/payments/env");

        expect(() => getPaymentEnv()).toThrow("Missing or invalid environment variables");
    });

    it("throws when both variables are missing", async () => {
        delete process.env.ABACATEPAY_API_KEY;
        delete process.env.ABACATEPAY_WEBHOOK_SECRET;

        const { getPaymentEnv } = await import("@/lib/payments/env");

        expect(() => getPaymentEnv()).toThrow("Missing or invalid environment variables");
    });

    it("caches the validated result on subsequent calls", async () => {
        process.env.ABACATEPAY_API_KEY = "cached-key";
        process.env.ABACATEPAY_WEBHOOK_SECRET = "cached-secret";

        const { getPaymentEnv } = await import("@/lib/payments/env");
        const first = getPaymentEnv();
        const second = getPaymentEnv();

        expect(first).toBe(second); // Same reference = cached
    });
});

describe("payment env constants", () => {
    it("exports ABACATEPAY_API_BASE_URL", async () => {
        const { ABACATEPAY_API_BASE_URL } = await import("@/lib/payments/env");
        expect(ABACATEPAY_API_BASE_URL).toBe("https://api.abacatepay.com/v1");
    });

    it("exports ABACATEPAY_PUBLIC_KEY as a non-empty string", async () => {
        const { ABACATEPAY_PUBLIC_KEY } = await import("@/lib/payments/env");
        expect(typeof ABACATEPAY_PUBLIC_KEY).toBe("string");
        expect(ABACATEPAY_PUBLIC_KEY.length).toBeGreaterThan(0);
    });
});
