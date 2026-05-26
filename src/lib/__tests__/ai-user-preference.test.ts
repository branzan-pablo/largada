import { describe, it, expect } from "vitest";
import {
  cosineSimilarity,
  weightedAverage,
  parsePgVector,
} from "@/lib/ai/user-preference";

describe("cosineSimilarity", () => {
  it("returns 1 for identical vectors", () => {
    expect(cosineSimilarity([1, 2, 3], [1, 2, 3])).toBeCloseTo(1, 6);
  });

  it("returns 0 for orthogonal vectors", () => {
    expect(cosineSimilarity([1, 0], [0, 1])).toBeCloseTo(0, 6);
  });

  it("returns -1 for opposite vectors", () => {
    expect(cosineSimilarity([1, 2, 3], [-1, -2, -3])).toBeCloseTo(-1, 6);
  });

  it("returns 0 when either vector is empty", () => {
    expect(cosineSimilarity([], [])).toBe(0);
    expect(cosineSimilarity([], [1, 2, 3])).toBe(0);
  });

  it("returns 0 when vectors have different lengths", () => {
    expect(cosineSimilarity([1, 2, 3], [1, 2])).toBe(0);
  });

  it("returns 0 when either vector is the zero vector", () => {
    expect(cosineSimilarity([0, 0, 0], [1, 2, 3])).toBe(0);
    expect(cosineSimilarity([1, 2, 3], [0, 0, 0])).toBe(0);
  });

  it("handles normalized unit vectors", () => {
    const norm = (v: number[]) => {
      const len = Math.sqrt(v.reduce((s, x) => s + x * x, 0));
      return v.map((x) => x / len);
    };
    const a = norm([3, 4]);
    const b = norm([4, 3]);
    expect(cosineSimilarity(a, b)).toBeCloseTo(24 / 25, 6);
  });
});

describe("weightedAverage", () => {
  it("returns null on an empty list", () => {
    expect(weightedAverage([])).toBeNull();
  });

  it("returns null when total weight is zero", () => {
    expect(
      weightedAverage([
        { embedding: new Array(768).fill(1), weight: 0 },
        { embedding: new Array(768).fill(2), weight: 0 },
      ]),
    ).toBeNull();
  });

  it("returns null when vectors do not match EMBEDDING_DIMENSIONS", () => {
    expect(
      weightedAverage([{ embedding: [1, 2, 3], weight: 1 }]),
    ).toBeNull();
  });

  it("computes a weighted mean across multiple 768-dim vectors", () => {
    const a = new Array(768).fill(1);
    const b = new Array(768).fill(3);
    const out = weightedAverage([
      { embedding: a, weight: 1 },
      { embedding: b, weight: 3 },
    ]);
    expect(out).not.toBeNull();
    // (1*1 + 3*3) / (1+3) = 10/4 = 2.5
    expect(out![0]).toBeCloseTo(2.5, 6);
    expect(out![767]).toBeCloseTo(2.5, 6);
  });

  it("ignores vectors whose length differs from the first one", () => {
    const ref = new Array(768).fill(2);
    const bad = new Array(100).fill(99);
    const out = weightedAverage([
      { embedding: ref, weight: 1 },
      { embedding: bad, weight: 1 },
    ]);
    expect(out).not.toBeNull();
    // bad ignored; only ref contributes
    expect(out![0]).toBeCloseTo(2, 6);
  });

  it("treats negative or zero weights as no-op", () => {
    const ref = new Array(768).fill(5);
    const out = weightedAverage([
      { embedding: ref, weight: 2 },
      { embedding: new Array(768).fill(100), weight: -1 },
      { embedding: new Array(768).fill(100), weight: 0 },
    ]);
    expect(out).not.toBeNull();
    expect(out![0]).toBeCloseTo(5, 6);
  });
});

describe("parsePgVector", () => {
  it("parses a well-formed pgvector text representation", () => {
    expect(parsePgVector("[1,2,3]")).toEqual([1, 2, 3]);
  });

  it("parses floats including negative and scientific notation", () => {
    const out = parsePgVector("[-0.5,0.25,1e-3]");
    expect(out).toEqual([-0.5, 0.25, 0.001]);
  });

  it("returns a passthrough when input is already a number array", () => {
    expect(parsePgVector([1.5, 2.5])).toEqual([1.5, 2.5]);
  });

  it("returns null when the string is not bracketed", () => {
    expect(parsePgVector("1,2,3")).toBeNull();
    expect(parsePgVector("(1,2,3)")).toBeNull();
  });

  it("returns null when the parsed numbers contain NaN", () => {
    expect(parsePgVector("[1,abc,3]")).toBeNull();
  });

  it("returns null for non-string, non-array input", () => {
    expect(parsePgVector(null)).toBeNull();
    expect(parsePgVector(undefined)).toBeNull();
    expect(parsePgVector(42)).toBeNull();
  });

  it("trims surrounding whitespace", () => {
    expect(parsePgVector("   [1, 2, 3]   ")).toEqual([1, 2, 3]);
  });
});
