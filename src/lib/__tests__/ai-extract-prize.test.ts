import { describe, it, expect, beforeEach, afterEach } from "vitest";
import { extractPrizeStructured } from "@/lib/ai/extract-prize";

/**
 * These tests verify the cheap-path branches of extractPrizeStructured.
 * They cover the cases that avoid spending tokens. The actual LLM call is
 * exercised through manual integration testing in staging.
 */
describe("extractPrizeStructured — cheap paths", () => {
  let originalKey: string | undefined;

  beforeEach(() => {
    originalKey = process.env.GOOGLE_GENERATIVE_AI_API_KEY;
  });

  afterEach(() => {
    if (originalKey === undefined) {
      delete process.env.GOOGLE_GENERATIVE_AI_API_KEY;
    } else {
      process.env.GOOGLE_GENERATIVE_AI_API_KEY = originalKey;
    }
  });

  it("returns null when AI is disabled (no key)", async () => {
    delete process.env.GOOGLE_GENERATIVE_AI_API_KEY;
    const result = await extractPrizeStructured({
      prizeType: "money",
      prizeDetails: "1º R$500, 2º R$300",
    });
    expect(result).toBeNull();
  });

  it("returns an empty skeleton when prize_type is none and details are empty", async () => {
    process.env.GOOGLE_GENERATIVE_AI_API_KEY = "test-key";
    const result = await extractPrizeStructured({
      prizeType: "none",
      prizeDetails: null,
    });
    expect(result).toEqual({
      by_distance: [],
      by_category: false,
      has_money: false,
      has_trophy: false,
      notes: null,
    });
  });

  it("flags has_money=true with empty by_distance when prize_type=money but details are empty", async () => {
    process.env.GOOGLE_GENERATIVE_AI_API_KEY = "test-key";
    const result = await extractPrizeStructured({
      prizeType: "money",
      prizeDetails: null,
    });
    expect(result?.has_money).toBe(true);
    expect(result?.has_trophy).toBe(false);
    expect(result?.by_distance).toEqual([]);
  });

  it("flags both has_money and has_trophy when prize_type=both but details are empty", async () => {
    process.env.GOOGLE_GENERATIVE_AI_API_KEY = "test-key";
    const result = await extractPrizeStructured({
      prizeType: "both",
      prizeDetails: "  ",
    });
    expect(result?.has_money).toBe(true);
    expect(result?.has_trophy).toBe(true);
    expect(result?.by_distance).toEqual([]);
  });

  it("flags has_trophy only when prize_type=trophy and details are short", async () => {
    process.env.GOOGLE_GENERATIVE_AI_API_KEY = "test-key";
    const result = await extractPrizeStructured({
      prizeType: "trophy",
      prizeDetails: "ok",
    });
    expect(result?.has_money).toBe(false);
    expect(result?.has_trophy).toBe(true);
    expect(result?.by_distance).toEqual([]);
  });
});
