import { describe, it, expect, beforeEach, afterEach } from "vitest";
import { extractPrizeStructured } from "@/lib/ai/extract-prize";

/**
 * These tests verify the cheap-path branches of extractPrizeStructured —
 * the ones that avoid spending tokens. The actual LLM call is exercised in
 * integration testing (manual), since mocking a streaming provider would
 * test the mock more than the code.
 */
describe("extractPrizeStructured — cheap paths", () => {
  let originalKey: string | undefined;

  beforeEach(() => {
    originalKey = process.env.OPENAI_API_KEY;
  });

  afterEach(() => {
    if (originalKey === undefined) {
      delete process.env.OPENAI_API_KEY;
    } else {
      process.env.OPENAI_API_KEY = originalKey;
    }
  });

  it("returns null when AI is disabled (no OPENAI_API_KEY)", async () => {
    delete process.env.OPENAI_API_KEY;
    const result = await extractPrizeStructured({
      prizeType: "money",
      prizeDetails: "1º R$500, 2º R$300",
    });
    expect(result).toBeNull();
  });

  it("returns a zero/false skeleton when prize_type is none and details are empty", async () => {
    process.env.OPENAI_API_KEY = "test-key";
    const result = await extractPrizeStructured({
      prizeType: "none",
      prizeDetails: null,
    });
    expect(result).toEqual({
      total_money_brl: null,
      top_n: null,
      by_category: false,
      max_per_position: null,
      has_money: false,
      has_trophy: false,
      notes: null,
    });
  });

  it("flags has_money=true when prize_type is money but details are empty", async () => {
    process.env.OPENAI_API_KEY = "test-key";
    const result = await extractPrizeStructured({
      prizeType: "money",
      prizeDetails: null,
    });
    expect(result?.has_money).toBe(true);
    expect(result?.has_trophy).toBe(false);
    expect(result?.total_money_brl).toBeNull();
  });

  it("flags both has_money and has_trophy when prize_type=both but details are empty", async () => {
    process.env.OPENAI_API_KEY = "test-key";
    const result = await extractPrizeStructured({
      prizeType: "both",
      prizeDetails: "  ",
    });
    expect(result?.has_money).toBe(true);
    expect(result?.has_trophy).toBe(true);
  });

  it("flags has_trophy only when prize_type=trophy and details are short", async () => {
    process.env.OPENAI_API_KEY = "test-key";
    const result = await extractPrizeStructured({
      prizeType: "trophy",
      prizeDetails: "ok",
    });
    expect(result?.has_money).toBe(false);
    expect(result?.has_trophy).toBe(true);
  });
});
