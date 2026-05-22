import { describe, it, expect } from "vitest";
import { prizeStructuredSchema } from "@/lib/ai/schemas/prize-extraction";

describe("prizeStructuredSchema", () => {
  it("accepts a complete object with per-distance prizes", () => {
    const result = prizeStructuredSchema.safeParse({
      by_distance: [
        { distance: "10k", total: 1800, top_prize: 1000, top_n: 3 },
        { distance: "5k", total: 600, top_prize: 300, top_n: 3 },
      ],
      by_category: true,
      has_money: true,
      has_trophy: true,
      notes: "Apenas categoria geral",
    });
    expect(result.success).toBe(true);
  });

  it("accepts a single 'geral' entry when prize does not differentiate by distance", () => {
    const result = prizeStructuredSchema.safeParse({
      by_distance: [
        { distance: "geral", total: 1000, top_prize: 500, top_n: 3 },
      ],
      by_category: false,
      has_money: true,
      has_trophy: false,
      notes: null,
    });
    expect(result.success).toBe(true);
  });

  it("accepts empty by_distance when there is no money prize", () => {
    const result = prizeStructuredSchema.safeParse({
      by_distance: [],
      by_category: false,
      has_money: false,
      has_trophy: true,
      notes: null,
    });
    expect(result.success).toBe(true);
  });

  it("rejects negative top_prize", () => {
    const result = prizeStructuredSchema.safeParse({
      by_distance: [
        { distance: "10k", total: 1000, top_prize: -1, top_n: 3 },
      ],
      by_category: false,
      has_money: true,
      has_trophy: false,
      notes: null,
    });
    expect(result.success).toBe(false);
  });

  it("rejects empty distance string", () => {
    const result = prizeStructuredSchema.safeParse({
      by_distance: [
        { distance: "", total: 100, top_prize: 50, top_n: 1 },
      ],
      by_category: false,
      has_money: true,
      has_trophy: false,
      notes: null,
    });
    expect(result.success).toBe(false);
  });

  it("rejects non-integer top_n", () => {
    const result = prizeStructuredSchema.safeParse({
      by_distance: [
        { distance: "10k", total: 100, top_prize: 50, top_n: 3.5 },
      ],
      by_category: false,
      has_money: true,
      has_trophy: false,
      notes: null,
    });
    expect(result.success).toBe(false);
  });

  it("rejects notes longer than 280 chars", () => {
    const result = prizeStructuredSchema.safeParse({
      by_distance: [],
      by_category: false,
      has_money: false,
      has_trophy: true,
      notes: "x".repeat(281),
    });
    expect(result.success).toBe(false);
  });

  it("allows nullable numeric fields inside a distance entry", () => {
    const result = prizeStructuredSchema.safeParse({
      by_distance: [
        { distance: "21k", total: null, top_prize: null, top_n: null },
      ],
      by_category: false,
      has_money: true,
      has_trophy: false,
      notes: null,
    });
    expect(result.success).toBe(true);
  });
});
