import { describe, it, expect } from "vitest";
import {
    AbacatePayError,
    AbacatePayApiError,
    AbacatePayValidationError,
    AbacatePayWebhookError,
} from "@/lib/payments/errors";

// ─── AbacatePayError ─────────────────────────────────────

describe("AbacatePayError", () => {
    it("creates error with message and correct name", () => {
        const err = new AbacatePayError("test error");
        expect(err.message).toBe("test error");
        expect(err.name).toBe("AbacatePayError");
    });

    it("stores optional cause", () => {
        const cause = new Error("original");
        const err = new AbacatePayError("wrapped", cause);
        expect(err.cause).toBe(cause);
    });

    it("is an instance of Error", () => {
        const err = new AbacatePayError("test");
        expect(err).toBeInstanceOf(Error);
    });
});

// ─── AbacatePayApiError ──────────────────────────────────

describe("AbacatePayApiError", () => {
    it("stores statusCode and responseBody", () => {
        const err = new AbacatePayApiError("Not Found", 404, { detail: "missing" });
        expect(err.message).toBe("Not Found");
        expect(err.name).toBe("AbacatePayApiError");
        expect(err.statusCode).toBe(404);
        expect(err.responseBody).toEqual({ detail: "missing" });
    });

    it("is an instance of AbacatePayError", () => {
        const err = new AbacatePayApiError("error", 500);
        expect(err).toBeInstanceOf(AbacatePayError);
        expect(err).toBeInstanceOf(Error);
    });
});

// ─── AbacatePayValidationError ───────────────────────────

describe("AbacatePayValidationError", () => {
    it("stores validation errors record", () => {
        const errors = { email: ["is required"], amount: ["must be positive"] };
        const err = new AbacatePayValidationError("Validation failed", errors);
        expect(err.message).toBe("Validation failed");
        expect(err.name).toBe("AbacatePayValidationError");
        expect(err.errors).toEqual(errors);
    });

    it("is an instance of AbacatePayError", () => {
        const err = new AbacatePayValidationError("error", {});
        expect(err).toBeInstanceOf(AbacatePayError);
    });
});

// ─── AbacatePayWebhookError ─────────────────────────────

describe("AbacatePayWebhookError", () => {
    it("creates error with correct name", () => {
        const err = new AbacatePayWebhookError("Invalid signature");
        expect(err.message).toBe("Invalid signature");
        expect(err.name).toBe("AbacatePayWebhookError");
    });

    it("is an instance of AbacatePayError", () => {
        const err = new AbacatePayWebhookError("error");
        expect(err).toBeInstanceOf(AbacatePayError);
        expect(err).toBeInstanceOf(Error);
    });
});
