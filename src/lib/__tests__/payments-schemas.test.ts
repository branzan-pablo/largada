import { describe, it, expect } from "vitest";
import {
    createBillingSchema,
    createPixQrCodeSchema,
    checkPixStatusSchema,
} from "@/types/payments";

// ─── createBillingSchema ─────────────────────────────────

describe("createBillingSchema", () => {
    const validBilling = {
        frequency: "ONE_TIME",
        methods: ["PIX"],
        products: [
            {
                externalId: "promo-123",
                name: "Promoção de Corrida",
                quantity: 1,
                price: 4900, // R$ 49,00 in centavos
            },
        ],
        returnUrl: "https://largadas.com.br/corridas",
        completionUrl: "https://largadas.com.br/pagamento/sucesso",
    };

    it("accepts valid billing data", () => {
        const result = createBillingSchema.safeParse(validBilling);
        expect(result.success).toBe(true);
    });

    it("defaults orderType to 'other'", () => {
        const result = createBillingSchema.safeParse(validBilling);
        expect(result.success).toBe(true);
        if (result.success) {
            expect(result.data.orderType).toBe("other");
        }
    });

    it("accepts MULTIPLE_PAYMENTS frequency", () => {
        const result = createBillingSchema.safeParse({
            ...validBilling,
            frequency: "MULTIPLE_PAYMENTS",
        });
        expect(result.success).toBe(true);
    });

    it("rejects invalid frequency", () => {
        const result = createBillingSchema.safeParse({
            ...validBilling,
            frequency: "WEEKLY",
        });
        expect(result.success).toBe(false);
    });

    it("rejects empty methods array", () => {
        const result = createBillingSchema.safeParse({
            ...validBilling,
            methods: [],
        });
        expect(result.success).toBe(false);
    });

    it("accepts both PIX and CARD methods", () => {
        const result = createBillingSchema.safeParse({
            ...validBilling,
            methods: ["PIX", "CARD"],
        });
        expect(result.success).toBe(true);
    });

    it("rejects more than 2 methods", () => {
        const result = createBillingSchema.safeParse({
            ...validBilling,
            methods: ["PIX", "CARD", "PIX"],
        });
        expect(result.success).toBe(false);
    });

    it("rejects empty products array", () => {
        const result = createBillingSchema.safeParse({
            ...validBilling,
            products: [],
        });
        expect(result.success).toBe(false);
    });

    it("rejects product with price = 0", () => {
        const result = createBillingSchema.safeParse({
            ...validBilling,
            products: [{ externalId: "x", name: "Test", quantity: 1, price: 0 }],
        });
        expect(result.success).toBe(false);
    });

    it("rejects invalid returnUrl", () => {
        const result = createBillingSchema.safeParse({
            ...validBilling,
            returnUrl: "not-a-url",
        });
        expect(result.success).toBe(false);
    });

    it("accepts optional customer data", () => {
        const result = createBillingSchema.safeParse({
            ...validBilling,
            customer: {
                name: "João",
                cellphone: "17999999999",
                email: "joao@test.com",
                taxId: "12345678901",
            },
        });
        expect(result.success).toBe(true);
    });

    it("accepts race_promotion orderType", () => {
        const result = createBillingSchema.safeParse({
            ...validBilling,
            orderType: "race_promotion",
        });
        expect(result.success).toBe(true);
    });

    it("accepts premium_subscription orderType", () => {
        const result = createBillingSchema.safeParse({
            ...validBilling,
            orderType: "premium_subscription",
        });
        expect(result.success).toBe(true);
    });
});

// ─── createPixQrCodeSchema ──────────────────────────────

describe("createPixQrCodeSchema", () => {
    it("accepts valid pix data", () => {
        const result = createPixQrCodeSchema.safeParse({ amount: 5000 });
        expect(result.success).toBe(true);
    });

    it("rejects amount = 0", () => {
        const result = createPixQrCodeSchema.safeParse({ amount: 0 });
        expect(result.success).toBe(false);
    });

    it("rejects negative amount", () => {
        const result = createPixQrCodeSchema.safeParse({ amount: -100 });
        expect(result.success).toBe(false);
    });

    it("rejects non-integer amount", () => {
        const result = createPixQrCodeSchema.safeParse({ amount: 49.99 });
        expect(result.success).toBe(false);
    });

    it("accepts optional expiresIn (min 60 seconds)", () => {
        const result = createPixQrCodeSchema.safeParse({
            amount: 1000,
            expiresIn: 300,
        });
        expect(result.success).toBe(true);
    });

    it("rejects expiresIn less than 60 seconds", () => {
        const result = createPixQrCodeSchema.safeParse({
            amount: 1000,
            expiresIn: 30,
        });
        expect(result.success).toBe(false);
    });

    it("rejects description longer than 37 chars", () => {
        const result = createPixQrCodeSchema.safeParse({
            amount: 1000,
            description: "A".repeat(38),
        });
        expect(result.success).toBe(false);
    });

    it("accepts description with exactly 37 chars", () => {
        const result = createPixQrCodeSchema.safeParse({
            amount: 1000,
            description: "A".repeat(37),
        });
        expect(result.success).toBe(true);
    });

    it("defaults orderType to 'other'", () => {
        const result = createPixQrCodeSchema.safeParse({ amount: 1000 });
        expect(result.success).toBe(true);
        if (result.success) {
            expect(result.data.orderType).toBe("other");
        }
    });
});

// ─── checkPixStatusSchema ────────────────────────────────

describe("checkPixStatusSchema", () => {
    it("accepts valid id", () => {
        const result = checkPixStatusSchema.safeParse({ id: "pix_abc123" });
        expect(result.success).toBe(true);
    });

    it("rejects empty id", () => {
        const result = checkPixStatusSchema.safeParse({ id: "" });
        expect(result.success).toBe(false);
    });

    it("rejects missing id", () => {
        const result = checkPixStatusSchema.safeParse({});
        expect(result.success).toBe(false);
    });
});
