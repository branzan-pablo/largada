import { describe, it, expect } from "vitest";
import {
    formatDate,
    formatDateFull,
    formatDateShort,
    formatDateTime,
    formatTime,
    parseRaceDate,
    futureUtc,
    pastUtc,
    utcNow,
    todayInBrazil,
    futureDateInBrazil,
} from "@/lib/date";

// ─── formatTime ──────────────────────────────────────────

describe("formatTime", () => {
    it("extracts HH:mm from TIME string", () => {
        expect(formatTime("14:30:00")).toBe("14:30");
    });

    it("handles midnight", () => {
        expect(formatTime("00:00:00")).toBe("00:00");
    });

    it("handles end of day", () => {
        expect(formatTime("23:59:59")).toBe("23:59");
    });
});

// ─── parseRaceDate ───────────────────────────────────────

describe("parseRaceDate", () => {
    it("parses YYYY-MM-DD string into a Date at local midnight", () => {
        const d = parseRaceDate("2026-03-15");
        expect(d.getFullYear()).toBe(2026);
        expect(d.getMonth()).toBe(2); // March = 2
        expect(d.getDate()).toBe(15);
        expect(d.getHours()).toBe(0);
        expect(d.getMinutes()).toBe(0);
    });
});

// ─── Format functions (date-only input) ──────────────────
// Using date-only strings avoids timezone offsets in tests.

describe("formatDate", () => {
    it('formats date-only string as "d de MMMM" in pt-BR', () => {
        expect(formatDate("2026-03-15")).toBe("15 de março");
    });

    it("formats January correctly", () => {
        expect(formatDate("2026-01-01")).toBe("1 de janeiro");
    });
});

describe("formatDateFull", () => {
    it('formats date-only string as "d de MMMM de yyyy"', () => {
        expect(formatDateFull("2026-03-15")).toBe("15 de março de 2026");
    });
});

describe("formatDateShort", () => {
    it('formats date-only string as "dd/MM/yyyy"', () => {
        expect(formatDateShort("2026-03-15")).toBe("15/03/2026");
    });

    it("zero-pads single-digit day and month", () => {
        expect(formatDateShort("2026-01-05")).toBe("05/01/2026");
    });
});

describe("formatDateTime", () => {
    it("formats a date-only string with midnight time", () => {
        // date-only strings are interpreted as local midnight
        expect(formatDateTime("2026-03-15")).toBe("15/03/2026 00:00");
    });
});

// ─── futureUtc / pastUtc ─────────────────────────────────

describe("futureUtc", () => {
    it("returns an ISO string in the future", () => {
        const now = Date.now();
        const result = futureUtc(7);
        const resultMs = new Date(result).getTime();
        const expectedMs = now + 7 * 24 * 60 * 60 * 1000;
        // Allow 1 second tolerance for execution time
        expect(Math.abs(resultMs - expectedMs)).toBeLessThan(1000);
    });

    it("ends with Z (UTC marker)", () => {
        expect(futureUtc(1)).toMatch(/Z$/);
    });

    it("returns now-ish for 0 days", () => {
        const now = Date.now();
        const result = new Date(futureUtc(0)).getTime();
        expect(Math.abs(result - now)).toBeLessThan(1000);
    });
});

describe("pastUtc", () => {
    it("returns an ISO string in the past", () => {
        const now = Date.now();
        const result = pastUtc(3);
        const resultMs = new Date(result).getTime();
        const expectedMs = now - 3 * 24 * 60 * 60 * 1000;
        expect(Math.abs(resultMs - expectedMs)).toBeLessThan(1000);
    });

    it("ends with Z (UTC marker)", () => {
        expect(pastUtc(1)).toMatch(/Z$/);
    });
});

// ─── utcNow ──────────────────────────────────────────────

describe("utcNow", () => {
    it("returns a valid ISO 8601 UTC string", () => {
        const result = utcNow();
        expect(result).toMatch(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}\.\d{3}Z$/);
    });

    it("is close to the current time", () => {
        const now = Date.now();
        const result = new Date(utcNow()).getTime();
        expect(Math.abs(result - now)).toBeLessThan(1000);
    });
});

// ─── todayInBrazil ───────────────────────────────────────

describe("todayInBrazil", () => {
    it("returns a YYYY-MM-DD string", () => {
        expect(todayInBrazil()).toMatch(/^\d{4}-\d{2}-\d{2}$/);
    });
});

// ─── futureDateInBrazil ──────────────────────────────────

describe("futureDateInBrazil", () => {
    it("returns a YYYY-MM-DD string", () => {
        expect(futureDateInBrazil(5)).toMatch(/^\d{4}-\d{2}-\d{2}$/);
    });

    it("returns a date after today", () => {
        const today = todayInBrazil();
        const future = futureDateInBrazil(1);
        expect(future > today).toBe(true);
    });
});
