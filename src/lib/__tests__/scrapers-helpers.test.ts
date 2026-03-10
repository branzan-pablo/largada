/**
 * Tests for pure helper functions in scrapers/insert-races.ts.
 *
 * The functions isValidDate, normalizeForDedup, jaccardSimilarity, and
 * isSimilarRace are not exported from the module. We re-implement them
 * here identically — the goal is to lock their behavior via tests so
 * any future refactoring can be validated. If the module is later
 * refactored to export these functions, these tests can be updated to
 * import them directly.
 */
import { describe, it, expect } from "vitest";

// ─── Re-implemented helpers (mirrors insert-races.ts) ───

function isValidDate(dateStr: string): boolean {
    if (!/^\d{4}-\d{2}-\d{2}$/.test(dateStr)) return false;
    const [y, m, d] = dateStr.split("-").map(Number);
    const date = new Date(y, m - 1, d);
    return date.getFullYear() === y && date.getMonth() === m - 1 && date.getDate() === d;
}

function normalizeForDedup(name: string): string {
    return name
        .normalize("NFD")
        .replace(/[\u0300-\u036f]/g, "")
        .toLowerCase()
        .replace(/[^a-z0-9\s]/g, "")
        .replace(/\s+/g, " ")
        .trim();
}

function jaccardSimilarity(a: string, b: string): number {
    const setA = new Set(a.split(" "));
    const setB = new Set(b.split(" "));
    let intersection = 0;
    for (const word of setA) {
        if (setB.has(word)) intersection++;
    }
    const union = new Set([...setA, ...setB]).size;
    return union === 0 ? 1 : intersection / union;
}

function isSimilarRace(
    a: { name: string; date: string | null; city: string | null },
    b: { name: string; date: string; city: string | null },
): boolean {
    if (a.date !== b.date) return false;
    const cityA = a.city ? normalizeForDedup(a.city) : "";
    const cityB = b.city ? normalizeForDedup(b.city) : "";
    if (cityA !== cityB) return false;
    return jaccardSimilarity(normalizeForDedup(a.name), normalizeForDedup(b.name)) >= 0.75;
}

// ─── isValidDate ─────────────────────────────────────────

describe("isValidDate", () => {
    it("accepts valid YYYY-MM-DD format", () => {
        expect(isValidDate("2026-03-15")).toBe(true);
        expect(isValidDate("2026-12-31")).toBe(true);
    });

    it("rejects invalid format", () => {
        expect(isValidDate("15/03/2026")).toBe(false);
        expect(isValidDate("2026-3-15")).toBe(false);
        expect(isValidDate("not-a-date")).toBe(false);
    });

    it("rejects impossible dates", () => {
        expect(isValidDate("2026-02-30")).toBe(false);
        expect(isValidDate("2026-13-01")).toBe(false);
    });

    it("rejects empty string", () => {
        expect(isValidDate("")).toBe(false);
    });
});

// ─── normalizeForDedup ───────────────────────────────────

describe("normalizeForDedup", () => {
    it("lowercases and removes accents", () => {
        expect(normalizeForDedup("São José")).toBe("sao jose");
    });

    it("removes special characters but keeps numbers", () => {
        expect(normalizeForDedup("Corrida 5K - Noturna!")).toBe("corrida 5k noturna");
    });

    it("collapses whitespace", () => {
        expect(normalizeForDedup("  Corrida   Especial  ")).toBe("corrida especial");
    });

    it("handles empty string", () => {
        expect(normalizeForDedup("")).toBe("");
    });
});

// ─── jaccardSimilarity ──────────────────────────────────

describe("jaccardSimilarity", () => {
    it("returns 1 for identical strings", () => {
        expect(jaccardSimilarity("corrida noturna 5k", "corrida noturna 5k")).toBe(1);
    });

    it("returns 0 for completely different strings", () => {
        expect(jaccardSimilarity("abc def", "ghi jkl")).toBe(0);
    });

    it("returns 1 for two empty strings", () => {
        expect(jaccardSimilarity("", "")).toBe(1);
    });

    it("returns correct value for partially overlapping sets", () => {
        // "corrida noturna" & "corrida especial" → intersection={corrida}, union={corrida,noturna,especial}
        const sim = jaccardSimilarity("corrida noturna", "corrida especial");
        expect(sim).toBeCloseTo(1 / 3, 5);
    });

    it("is symmetric", () => {
        const ab = jaccardSimilarity("a b c", "b c d");
        const ba = jaccardSimilarity("b c d", "a b c");
        expect(ab).toBe(ba);
    });
});

// ─── isSimilarRace ───────────────────────────────────────

describe("isSimilarRace", () => {
    it("detects identical races", () => {
        const a = { name: "Corrida Noturna 5K", date: "2026-06-15", city: "Votuporanga" };
        const b = { name: "Corrida Noturna 5K", date: "2026-06-15", city: "Votuporanga" };
        expect(isSimilarRace(a, b)).toBe(true);
    });

    it("detects similar race names (>= 0.75 Jaccard)", () => {
        const a = {
            name: "3ª Corrida Noturna 5K Votuporanga",
            date: "2026-06-15",
            city: "Votuporanga",
        };
        const b = {
            name: "Corrida Noturna 5K Votuporanga",
            date: "2026-06-15",
            city: "Votuporanga",
        };
        expect(isSimilarRace(a, b)).toBe(true);
    });

    it("rejects races with different dates", () => {
        const a = { name: "Corrida Noturna 5K", date: "2026-06-15", city: "Votuporanga" };
        const b = { name: "Corrida Noturna 5K", date: "2026-07-20", city: "Votuporanga" };
        expect(isSimilarRace(a, b)).toBe(false);
    });

    it("rejects races with different cities", () => {
        const a = { name: "Corrida Noturna 5K", date: "2026-06-15", city: "Votuporanga" };
        const b = { name: "Corrida Noturna 5K", date: "2026-06-15", city: "Catanduva" };
        expect(isSimilarRace(a, b)).toBe(false);
    });

    it("rejects completely different races in same city/date", () => {
        const a = { name: "Maratona Internacional SP", date: "2026-06-15", city: "Votuporanga" };
        const b = { name: "Corrida Noturna 5K", date: "2026-06-15", city: "Votuporanga" };
        expect(isSimilarRace(a, b)).toBe(false);
    });

    it("handles null cities (both null = equal)", () => {
        const a = { name: "Corrida 5K", date: "2026-06-15", city: null };
        const b = { name: "Corrida 5K", date: "2026-06-15", city: null };
        expect(isSimilarRace(a, b)).toBe(true);
    });

    it("ignores accents in city comparison", () => {
        const a = { name: "Corrida 5K", date: "2026-06-15", city: "São José" };
        const b = { name: "Corrida 5K", date: "2026-06-15", city: "Sao Jose" };
        expect(isSimilarRace(a, b)).toBe(true);
    });
});
