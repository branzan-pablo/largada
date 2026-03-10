import { describe, it, expect } from "vitest";
import { slugify, formatCurrency, cn } from "@/lib/utils";

// ─── slugify ─────────────────────────────────────────────

describe("slugify", () => {
    it("converts simple text to lowercase slug", () => {
        expect(slugify("Hello World")).toBe("hello-world");
    });

    it("removes accents (normalizes NFD)", () => {
        expect(slugify("São José do Rio Preto")).toBe("sao-jose-do-rio-preto");
    });

    it("replaces multiple special characters with a single hyphen", () => {
        expect(slugify("corrida 5k - especial!!!")).toBe("corrida-5k-especial");
    });

    it("trims leading and trailing hyphens", () => {
        expect(slugify("--test--")).toBe("test");
    });

    it("handles empty string", () => {
        expect(slugify("")).toBe("");
    });

    it("handles string with only special characters", () => {
        expect(slugify("!!!@@@")).toBe("");
    });

    it("preserves numbers", () => {
        expect(slugify("Corrida 42k 2026")).toBe("corrida-42k-2026");
    });
});

// ─── formatCurrency ──────────────────────────────────────

describe("formatCurrency", () => {
    it("formats integer values as BRL", () => {
        const result = formatCurrency(349);
        // pt-BR BRL: "R$\u00a0349,00" (non-breaking space may vary)
        expect(result).toContain("R$");
        expect(result).toContain("349");
        expect(result).toContain(",00");
    });

    it("formats decimal values", () => {
        const result = formatCurrency(49.9);
        expect(result).toContain("R$");
        expect(result).toContain("49,90");
    });

    it("formats zero", () => {
        const result = formatCurrency(0);
        expect(result).toContain("R$");
        expect(result).toContain("0,00");
    });

    it("formats large values with thousand separator", () => {
        const result = formatCurrency(1299.99);
        expect(result).toContain("R$");
        expect(result).toContain("1.299,99");
    });
});

// ─── cn (className utility) ─────────────────────────────

describe("cn", () => {
    it("merges class names", () => {
        expect(cn("px-2", "py-1")).toBe("px-2 py-1");
    });

    it("handles conditional classes", () => {
        expect(cn("base", false && "hidden", "visible")).toBe("base visible");
    });

    it("resolves tailwind conflicts (last wins)", () => {
        expect(cn("px-2", "px-4")).toBe("px-4");
    });

    it("handles empty inputs", () => {
        expect(cn()).toBe("");
    });
});
