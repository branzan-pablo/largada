import { describe, it, expect, vi } from "vitest";
import crypto from "node:crypto";
import {
    verifyWebhookSecret,
    verifyWebhookSignature,
    verifyWebhook,
} from "@/lib/payments/webhook";
import { AbacatePayWebhookError } from "@/lib/payments/errors";
import { ABACATEPAY_PUBLIC_KEY } from "@/lib/payments/env";

// Mock getPaymentEnv to return a deterministic secret
vi.mock("@/lib/payments/env", async (importOriginal) => {
    const original = await importOriginal<typeof import("@/lib/payments/env")>();
    return {
        ...original,
        getPaymentEnv: () => ({
            ABACATEPAY_API_KEY: "test-api-key",
            ABACATEPAY_WEBHOOK_SECRET: "test-webhook-secret-123",
        }),
    };
});

// ─── verifyWebhookSecret ─────────────────────────────────

describe("verifyWebhookSecret", () => {
    it("does not throw when secret matches", () => {
        expect(() => verifyWebhookSecret("test-webhook-secret-123")).not.toThrow();
    });

    it("throws AbacatePayWebhookError when secret is null", () => {
        expect(() => verifyWebhookSecret(null)).toThrow(AbacatePayWebhookError);
        expect(() => verifyWebhookSecret(null)).toThrow("Missing webhook secret");
    });

    it("throws AbacatePayWebhookError when secret is wrong", () => {
        expect(() => verifyWebhookSecret("wrong-secret")).toThrow(AbacatePayWebhookError);
        expect(() => verifyWebhookSecret("wrong-secret")).toThrow("Invalid webhook secret");
    });

    it("throws when secret has different length (timing-safe)", () => {
        expect(() => verifyWebhookSecret("short")).toThrow(AbacatePayWebhookError);
    });
});

// ─── verifyWebhookSignature ──────────────────────────────

describe("verifyWebhookSignature", () => {
    function computeSignature(body: string): string {
        return crypto
            .createHmac("sha256", ABACATEPAY_PUBLIC_KEY)
            .update(Buffer.from(body, "utf8"))
            .digest("base64");
    }

    it("does not throw when signature is valid", () => {
        const body = '{"event":"billing.paid"}';
        const sig = computeSignature(body);
        expect(() => verifyWebhookSignature(body, sig)).not.toThrow();
    });

    it("throws when signature is null", () => {
        expect(() => verifyWebhookSignature("body", null)).toThrow(AbacatePayWebhookError);
        expect(() => verifyWebhookSignature("body", null)).toThrow(
            "Missing X-Webhook-Signature header"
        );
    });

    it("throws when signature is invalid", () => {
        expect(() => verifyWebhookSignature("body", "invalid-sig")).toThrow(
            AbacatePayWebhookError
        );
        expect(() => verifyWebhookSignature("body", "invalid-sig")).toThrow(
            "Invalid webhook signature"
        );
    });

    it("throws when body has been tampered with", () => {
        const body = '{"event":"billing.paid"}';
        const sig = computeSignature(body);
        expect(() => verifyWebhookSignature(body + "tampered", sig)).toThrow(
            AbacatePayWebhookError
        );
    });
});

// ─── verifyWebhook (combined) ────────────────────────────

describe("verifyWebhook", () => {
    function computeSignature(body: string): string {
        return crypto
            .createHmac("sha256", ABACATEPAY_PUBLIC_KEY)
            .update(Buffer.from(body, "utf8"))
            .digest("base64");
    }

    it("succeeds when both secret and signature are valid", () => {
        const body = '{"event":"test"}';
        const sig = computeSignature(body);
        expect(() => verifyWebhook(body, sig, "test-webhook-secret-123")).not.toThrow();
    });

    it("throws when secret is valid but signature header is null (HMAC is mandatory)", () => {
        expect(() =>
            verifyWebhook('{"event":"test"}', null, "test-webhook-secret-123")
        ).toThrow(AbacatePayWebhookError);
        expect(() =>
            verifyWebhook('{"event":"test"}', null, "test-webhook-secret-123")
        ).toThrow("Missing X-Webhook-Signature header");
    });

    it("throws when secret is wrong (even if signature is valid)", () => {
        const body = '{"event":"test"}';
        const sig = computeSignature(body);
        expect(() => verifyWebhook(body, sig, "wrong-secret")).toThrow(
            AbacatePayWebhookError
        );
    });

    it("throws when secret is null", () => {
        expect(() => verifyWebhook("body", null, null)).toThrow(AbacatePayWebhookError);
    });
});
