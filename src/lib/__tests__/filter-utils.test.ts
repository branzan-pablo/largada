import { describe, it, expect, vi } from "vitest";
import { getDateRange, getDatePreset } from "@/lib/filter-utils";

// Mock todayInBrazil to return a deterministic date
vi.mock("@/lib/date", () => ({
    todayInBrazil: () => "2026-03-10", // Tuesday (day 2)
}));

// ─── getDateRange ────────────────────────────────────────

describe("getDateRange", () => {
    it('returns from today to end of the week for "this_week"', () => {
        const result = getDateRange("this_week");
        expect(result.dateFrom).toBe("2026-03-10");
        // Tuesday (day 2), end of week = +5 days = Sunday 2026-03-15
        expect(result.dateTo).toBe("2026-03-15");
    });

    it('returns from today to end of current month for "this_month"', () => {
        const result = getDateRange("this_month");
        expect(result.dateFrom).toBe("2026-03-10");
        expect(result.dateTo).toBe("2026-03-31"); // March has 31 days
    });

    it('returns the entire next month for "next_month"', () => {
        const result = getDateRange("next_month");
        expect(result.dateFrom).toBe("2026-04-01"); // April 1
        expect(result.dateTo).toBe("2026-04-30"); // April has 30 days
    });

    it('returns from today to 3 months ahead for "next_3_months"', () => {
        const result = getDateRange("next_3_months");
        expect(result.dateFrom).toBe("2026-03-10");
        expect(result.dateTo).toBe("2026-06-10");
    });

    it("returns empty object for unknown value", () => {
        expect(getDateRange("unknown")).toEqual({});
    });

    it('returns empty object for "any"', () => {
        expect(getDateRange("any")).toEqual({});
    });
});

// ─── getDatePreset ───────────────────────────────────────

describe("getDatePreset", () => {
    it('returns "any" when no dateFrom is set', () => {
        expect(getDatePreset({} as any)).toBe("any");
    });

    it('detects "this_week" preset from filter values', () => {
        const filters = { dateFrom: "2026-03-10", dateTo: "2026-03-15" };
        expect(getDatePreset(filters as any)).toBe("this_week");
    });

    it('detects "this_month" preset from filter values', () => {
        const filters = { dateFrom: "2026-03-10", dateTo: "2026-03-31" };
        expect(getDatePreset(filters as any)).toBe("this_month");
    });

    it('detects "next_month" preset from filter values', () => {
        const filters = { dateFrom: "2026-04-01", dateTo: "2026-04-30" };
        expect(getDatePreset(filters as any)).toBe("next_month");
    });

    it('detects "next_3_months" preset from filter values', () => {
        const filters = { dateFrom: "2026-03-10", dateTo: "2026-06-10" };
        expect(getDatePreset(filters as any)).toBe("next_3_months");
    });

    it('returns "any" for non-matching custom range', () => {
        const filters = { dateFrom: "2026-05-01", dateTo: "2026-05-15" };
        expect(getDatePreset(filters as any)).toBe("any");
    });
});
