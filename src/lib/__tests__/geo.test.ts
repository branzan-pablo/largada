import { describe, it, expect } from "vitest";
import { haversineDistance, isWithinRegion } from "@/lib/geo";

// ─── haversineDistance ───────────────────────────────────

describe("haversineDistance", () => {
    it("returns 0 for the same point", () => {
        expect(haversineDistance(-20.8113, -49.3758, -20.8113, -49.3758)).toBe(0);
    });

    it("calculates distance between São José do Rio Preto and Votuporanga (~70 km)", () => {
        const distance = haversineDistance(
            -20.8113, -49.3758, // SJRP
            -20.4218, -49.9729  // Votuporanga
        );
        expect(distance).toBeGreaterThan(60);
        expect(distance).toBeLessThan(80);
    });

    it("calculates distance between São Paulo and Rio de Janeiro (~360 km)", () => {
        const distance = haversineDistance(
            -23.5505, -46.6333, // SP
            -22.9068, -43.1729  // RJ
        );
        expect(distance).toBeGreaterThan(340);
        expect(distance).toBeLessThan(380);
    });

    it("handles antipodal points (max ~20,000 km)", () => {
        const distance = haversineDistance(0, 0, 0, 180);
        expect(distance).toBeGreaterThan(20000);
        expect(distance).toBeLessThan(20100);
    });

    it("is symmetric (A→B = B→A)", () => {
        const ab = haversineDistance(-20.8113, -49.3758, -22.9068, -43.1729);
        const ba = haversineDistance(-22.9068, -43.1729, -20.8113, -49.3758);
        expect(ab).toBeCloseTo(ba, 10);
    });
});

// ─── isWithinRegion ──────────────────────────────────────

describe("isWithinRegion", () => {
    it("returns true for São José do Rio Preto (center of region)", () => {
        expect(isWithinRegion(-20.8113, -49.3758)).toBe(true);
    });

    it("returns true for Votuporanga (within region)", () => {
        expect(isWithinRegion(-20.4218, -49.9729)).toBe(true);
    });

    it("returns true for Araçatuba (within region)", () => {
        expect(isWithinRegion(-21.2089, -50.4328)).toBe(true);
    });

    it("returns false for São Paulo capital (far outside region)", () => {
        expect(isWithinRegion(-23.5505, -46.6333)).toBe(false);
    });

    it("returns false for Rio de Janeiro (far outside region)", () => {
        expect(isWithinRegion(-22.9068, -43.1729)).toBe(false);
    });
});
