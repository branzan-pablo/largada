import { describe, it, expect } from "vitest";
import {
  suggestionAnalysisSchema,
  suggestionVerdictSchema,
} from "@/lib/ai/schemas/suggestion-analysis";

const MIN_VALID_ANALYSIS = {
  verdict: "legit" as const,
  confidence: 0.85,
  summary: "Corrida legítima em SJRP com link de inscrição público.",
  flags: [],
  duplicate_of: null,
  extracted: null,
};

describe("suggestionAnalysisSchema", () => {
  it("accepts a minimal valid analysis", () => {
    const result = suggestionAnalysisSchema.safeParse(MIN_VALID_ANALYSIS);
    expect(result.success).toBe(true);
  });

  it("accepts an analysis with duplicate_of populated", () => {
    const result = suggestionAnalysisSchema.safeParse({
      ...MIN_VALID_ANALYSIS,
      verdict: "duplicate",
      duplicate_of: {
        race_id: "123e4567-e89b-42d3-a456-556642440000",
        race_name: "Corrida X",
        race_date: "2026-06-15",
        similarity: 0.94,
      },
    });
    expect(result.success).toBe(true);
  });

  it("rejects an unknown verdict", () => {
    const result = suggestionAnalysisSchema.safeParse({
      ...MIN_VALID_ANALYSIS,
      verdict: "approved",
    });
    expect(result.success).toBe(false);
  });

  it("rejects confidence outside 0..1", () => {
    expect(
      suggestionAnalysisSchema.safeParse({ ...MIN_VALID_ANALYSIS, confidence: -0.1 }).success,
    ).toBe(false);
    expect(
      suggestionAnalysisSchema.safeParse({ ...MIN_VALID_ANALYSIS, confidence: 1.5 }).success,
    ).toBe(false);
  });

  it("rejects empty summary", () => {
    const result = suggestionAnalysisSchema.safeParse({
      ...MIN_VALID_ANALYSIS,
      summary: "",
    });
    expect(result.success).toBe(false);
  });

  it("rejects summary longer than 280 chars", () => {
    const result = suggestionAnalysisSchema.safeParse({
      ...MIN_VALID_ANALYSIS,
      summary: "x".repeat(281),
    });
    expect(result.success).toBe(false);
  });

  it("rejects duplicate_of with bad UUID", () => {
    const result = suggestionAnalysisSchema.safeParse({
      ...MIN_VALID_ANALYSIS,
      duplicate_of: {
        race_id: "not-a-uuid",
        race_name: "Corrida X",
        race_date: null,
        similarity: 0.9,
      },
    });
    expect(result.success).toBe(false);
  });
});

describe("suggestionVerdictSchema (LLM subset)", () => {
  it("accepts the four verdicts the LLM is allowed to produce", () => {
    for (const verdict of ["legit", "duplicate", "suspect", "uncertain"] as const) {
      const result = suggestionVerdictSchema.safeParse({
        verdict,
        confidence: 0.7,
        summary: "Mock summary",
        flags: [],
      });
      expect(result.success).toBe(true);
    }
  });

  it("rejects flag strings longer than 40 chars", () => {
    const result = suggestionVerdictSchema.safeParse({
      verdict: "legit",
      confidence: 0.9,
      summary: "ok",
      flags: ["x".repeat(41)],
    });
    expect(result.success).toBe(false);
  });
});
