import { describe, it, expect } from "vitest";
import { prizeStructuredSchema } from "@/lib/ai/schemas/prize-extraction";

describe("prizeStructuredSchema", () => {
  it("accepts a complete object", () => {
    const result = prizeStructuredSchema.safeParse({
      total_money_brl: 1000,
      top_n: 3,
      by_category: true,
      max_per_position: 500,
      has_money: true,
      has_trophy: true,
      notes: "Apenas categoria geral",
    });
    expect(result.success).toBe(true);
  });

  it("accepts nullable numeric fields", () => {
    const result = prizeStructuredSchema.safeParse({
      total_money_brl: null,
      top_n: null,
      by_category: false,
      max_per_position: null,
      has_money: false,
      has_trophy: true,
      notes: null,
    });
    expect(result.success).toBe(true);
  });

  it("rejects negative money totals", () => {
    const result = prizeStructuredSchema.safeParse({
      total_money_brl: -100,
      top_n: 3,
      by_category: false,
      max_per_position: null,
      has_money: true,
      has_trophy: false,
      notes: null,
    });
    expect(result.success).toBe(false);
  });

  it("rejects non-integer top_n", () => {
    const result = prizeStructuredSchema.safeParse({
      total_money_brl: 100,
      top_n: 3.5,
      by_category: false,
      max_per_position: null,
      has_money: true,
      has_trophy: false,
      notes: null,
    });
    expect(result.success).toBe(false);
  });

  it("rejects notes longer than 280 chars", () => {
    const result = prizeStructuredSchema.safeParse({
      total_money_brl: null,
      top_n: null,
      by_category: false,
      max_per_position: null,
      has_money: false,
      has_trophy: true,
      notes: "x".repeat(281),
    });
    expect(result.success).toBe(false);
  });

  it("rejects zero top_n (must be positive)", () => {
    const result = prizeStructuredSchema.safeParse({
      total_money_brl: 0,
      top_n: 0,
      by_category: false,
      max_per_position: null,
      has_money: false,
      has_trophy: false,
      notes: null,
    });
    expect(result.success).toBe(false);
  });
});
