import { describe, it, expect } from "vitest";
import {
    normalizeUrl,
    loginSchema,
    registerSchema,
    profileUpdateSchema,
    raceSchemaBase,
    raceSchema,
    suggestionSchema,
} from "@/lib/validations";

// ─── normalizeUrl ────────────────────────────────────────

describe("normalizeUrl", () => {
    it("returns empty string for empty input", () => {
        expect(normalizeUrl("")).toBe("");
        expect(normalizeUrl("   ")).toBe("");
    });

    it("preserves URLs that already have http://", () => {
        expect(normalizeUrl("http://example.com")).toBe("http://example.com");
    });

    it("preserves URLs that already have https://", () => {
        expect(normalizeUrl("https://example.com")).toBe("https://example.com");
    });

    it("adds https:// to URLs without protocol", () => {
        expect(normalizeUrl("example.com")).toBe("https://example.com");
    });

    it("trims whitespace", () => {
        expect(normalizeUrl("  https://example.com  ")).toBe("https://example.com");
    });

    it("is case-insensitive for protocol detection", () => {
        expect(normalizeUrl("HTTP://EXAMPLE.COM")).toBe("HTTP://EXAMPLE.COM");
    });
});

// ─── loginSchema ─────────────────────────────────────────

describe("loginSchema", () => {
    it("accepts valid credentials", () => {
        const result = loginSchema.safeParse({
            email: "user@example.com",
            password: "12345678",
        });
        expect(result.success).toBe(true);
    });

    it("rejects invalid email", () => {
        const result = loginSchema.safeParse({
            email: "not-an-email",
            password: "12345678",
        });
        expect(result.success).toBe(false);
    });

    it("rejects short password (< 8 chars)", () => {
        const result = loginSchema.safeParse({
            email: "user@example.com",
            password: "1234567",
        });
        expect(result.success).toBe(false);
    });
});

// ─── registerSchema ──────────────────────────────────────

describe("registerSchema", () => {
    const validData = {
        fullName: "João Silva",
        email: "joao@example.com",
        password: "senha123",
        city: "São José do Rio Preto",
    };

    it("accepts valid registration data", () => {
        const result = registerSchema.safeParse(validData);
        expect(result.success).toBe(true);
    });

    it("rejects name with less than 2 characters", () => {
        const result = registerSchema.safeParse({ ...validData, fullName: "J" });
        expect(result.success).toBe(false);
    });

    it("rejects empty city", () => {
        const result = registerSchema.safeParse({ ...validData, city: "" });
        expect(result.success).toBe(false);
    });
});

// ─── profileUpdateSchema ────────────────────────────────

describe("profileUpdateSchema", () => {
    it("accepts valid profile update", () => {
        const result = profileUpdateSchema.safeParse({
            fullName: "João",
            city: "Votuporanga",
            notificationsEnabled: true,
        });
        expect(result.success).toBe(true);
    });

    it("rejects non-boolean notificationsEnabled", () => {
        const result = profileUpdateSchema.safeParse({
            fullName: "João",
            city: "Votuporanga",
            notificationsEnabled: "yes",
        });
        expect(result.success).toBe(false);
    });
});

// ─── raceSchema ──────────────────────────────────────────

describe("raceSchema", () => {
    const validRace = {
        name: "Corrida Noturna 5K",
        date: "2026-06-15",
        startTime: "19:00",
        city: "São José do Rio Preto",
        state: "SP",
        address: "Av. Brigadeiro Faria Lima, 1000",
        latitude: -20.8113,
        longitude: -49.3758,
        distances: ["5k"],
        registrationPrice: "R$ 50,00",
        registrationLink: "https://example.com/inscricao",
        registrationDeadline: "2026-06-10",
        prizeType: "trophy" as const,
    };

    it("accepts valid race data", () => {
        const result = raceSchema.safeParse(validRace);
        expect(result.success).toBe(true);
    });

    it("rejects name shorter than 3 characters", () => {
        const result = raceSchema.safeParse({ ...validRace, name: "AB" });
        expect(result.success).toBe(false);
    });

    it("rejects empty distances array", () => {
        const result = raceSchema.safeParse({ ...validRace, distances: [] });
        expect(result.success).toBe(false);
    });

    it("rejects latitude out of range", () => {
        const result = raceSchema.safeParse({ ...validRace, latitude: 91 });
        expect(result.success).toBe(false);
    });

    it("rejects longitude out of range", () => {
        const result = raceSchema.safeParse({ ...validRace, longitude: -181 });
        expect(result.success).toBe(false);
    });

    it("normalizes registration link without protocol", () => {
        const result = raceSchema.safeParse({
            ...validRace,
            registrationLink: "example.com/inscricao",
        });
        expect(result.success).toBe(true);
        if (result.success) {
            expect(result.data.registrationLink).toBe("https://example.com/inscricao");
        }
    });

    it("rejects registrationDeadline after race date", () => {
        const result = raceSchema.safeParse({
            ...validRace,
            registrationDeadline: "2026-06-20", // after date 2026-06-15
        });
        expect(result.success).toBe(false);
    });

    it("accepts registrationDeadline equal to race date", () => {
        const result = raceSchema.safeParse({
            ...validRace,
            registrationDeadline: "2026-06-15", // same as date
        });
        expect(result.success).toBe(true);
    });

    it("rejects when no price info is provided (no registrationPrice, no registrationPrices, no batches)", () => {
        const result = raceSchema.safeParse({
            ...validRace,
            registrationPrice: "",
            registrationPrices: undefined,
            registrationBatches: undefined,
        });
        expect(result.success).toBe(false);
    });

    it("accepts when registrationPrices map is provided instead of single price", () => {
        const result = raceSchema.safeParse({
            ...validRace,
            registrationPrice: "",
            registrationPrices: { "5k": "R$ 50,00" },
        });
        expect(result.success).toBe(true);
    });

    it("accepts when registrationBatches are provided", () => {
        const result = raceSchema.safeParse({
            ...validRace,
            registrationPrice: "",
            registrationBatches: [
                {
                    name: "Primeiro Lote",
                    items: [{ label: "5k", price: "R$ 40,00" }],
                },
            ],
        });
        expect(result.success).toBe(true);
    });
});

// ─── suggestionSchema ────────────────────────────────────

describe("suggestionSchema", () => {
    it("accepts valid suggestion", () => {
        const result = suggestionSchema.safeParse({
            name: "Corrida do Interior",
            city: "Votuporanga",
        });
        expect(result.success).toBe(true);
    });

    it("rejects name shorter than 3 characters", () => {
        const result = suggestionSchema.safeParse({
            name: "AB",
            city: "Votuporanga",
        });
        expect(result.success).toBe(false);
    });

    it("rejects empty city", () => {
        const result = suggestionSchema.safeParse({
            name: "Corrida do Interior",
            city: "",
        });
        expect(result.success).toBe(false);
    });

    it("accepts valid optional link", () => {
        const result = suggestionSchema.safeParse({
            name: "Corrida do Interior",
            city: "Votuporanga",
            link: "example.com",
        });
        expect(result.success).toBe(true);
        if (result.success) {
            expect(result.data.link).toBe("https://example.com");
        }
    });

    it("accepts empty string as link", () => {
        const result = suggestionSchema.safeParse({
            name: "Corrida do Interior",
            city: "Votuporanga",
            link: "",
        });
        expect(result.success).toBe(true);
    });
});
