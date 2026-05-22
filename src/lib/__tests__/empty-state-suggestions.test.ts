import { describe, it, expect } from "vitest";
import {
  buildSuggestionLabel,
  formatDistance,
  nextRadiusStep,
  rankSuggestions,
  type Suggestion,
} from "@/lib/empty-state-suggestions";

describe("nextRadiusStep", () => {
  it("defaults to 50km when no current radius is provided", () => {
    expect(nextRadiusStep(undefined)).toBe(50);
  });

  it("returns the next ladder step above the current radius", () => {
    expect(nextRadiusStep(25)).toBe(50);
    expect(nextRadiusStep(50)).toBe(100);
    expect(nextRadiusStep(100)).toBe(150);
    expect(nextRadiusStep(150)).toBe(250);
    expect(nextRadiusStep(250)).toBe(500);
  });

  it("rounds non-canonical radii up to the next ladder step", () => {
    expect(nextRadiusStep(30)).toBe(50);
    expect(nextRadiusStep(75)).toBe(100);
    expect(nextRadiusStep(120)).toBe(150);
  });

  it("returns null when the user is already at or above the max", () => {
    expect(nextRadiusStep(500)).toBe(null);
    expect(nextRadiusStep(1000)).toBe(null);
  });
});

describe("formatDistance", () => {
  it("uppercases a normalized distance token", () => {
    expect(formatDistance("5k")).toBe("5K");
    expect(formatDistance("10k")).toBe("10K");
    expect(formatDistance("21k")).toBe("21K");
    expect(formatDistance("42k")).toBe("42K");
  });

  it("falls back to upper-casing when the token is non-canonical", () => {
    expect(formatDistance("8.5k")).toBe("8.5K");
    expect(formatDistance("100k")).toBe("100K");
  });

  it("trims whitespace before uppercasing", () => {
    expect(formatDistance(" 5k ")).toBe("5K");
  });
});

describe("buildSuggestionLabel", () => {
  it("formats expand_radius with target km and count", () => {
    expect(
      buildSuggestionLabel("expand_radius", 3, { targetRadius: 100 }),
    ).toBe("Expandir o raio para 100km mostraria 3 corridas.");
  });

  it("uses singular form when count is exactly 1", () => {
    expect(
      buildSuggestionLabel("expand_radius", 1, { targetRadius: 100 }),
    ).toBe("Expandir o raio para 100km mostraria 1 corrida.");
  });

  it("formats drop_radius", () => {
    expect(buildSuggestionLabel("drop_radius", 8, {})).toBe(
      "Sem o filtro de distância da sua cidade: 8 corridas próximas.",
    );
  });

  it("formats drop_distance", () => {
    expect(buildSuggestionLabel("drop_distance", 5, {})).toBe(
      "Sem o filtro de distância: 5 corridas disponíveis.",
    );
  });

  it("formats swap_distance with the alternative distance", () => {
    expect(
      buildSuggestionLabel("swap_distance", 4, {
        alternativeDistance: "10k",
      }),
    ).toBe("10K tem 4 corridas no mesmo período.");
  });

  it("formats drop_city including the city name", () => {
    expect(
      buildSuggestionLabel("drop_city", 7, { currentCity: "Votuporanga" }),
    ).toBe("Sem o filtro de cidade (Votuporanga): 7 corridas disponíveis.");
  });

  it("formats drop_city without a city name when none was supplied", () => {
    expect(buildSuggestionLabel("drop_city", 2, {})).toBe(
      "Sem o filtro de cidade: 2 corridas disponíveis.",
    );
  });

  it("returns an empty string when expand_radius lacks a target", () => {
    expect(buildSuggestionLabel("expand_radius", 5, {})).toBe("");
  });

  it("returns an empty string when swap_distance lacks an alternative", () => {
    expect(buildSuggestionLabel("swap_distance", 5, {})).toBe("");
  });
});

describe("rankSuggestions", () => {
  const make = (overrides: Partial<Suggestion>): Suggestion => ({
    id: overrides.id ?? "x",
    kind: overrides.kind ?? "drop_distance",
    label: overrides.label ?? "label",
    count: overrides.count ?? 1,
    apply: overrides.apply ?? {},
    priority: overrides.priority ?? 50,
  });

  it("drops suggestions with zero or negative count", () => {
    const result = rankSuggestions([
      make({ id: "a", count: 0 }),
      make({ id: "b", count: -1 }),
      make({ id: "c", count: 1 }),
    ]);
    expect(result.map((r) => r.id)).toEqual(["c"]);
  });

  it("dedupes by id keeping the first occurrence", () => {
    const result = rankSuggestions([
      make({ id: "a", count: 5 }),
      make({ id: "a", count: 10 }),
    ]);
    expect(result.length).toBe(1);
    expect(result[0].count).toBe(5);
  });

  it("orders by priority asc then by count desc", () => {
    const result = rankSuggestions([
      make({ id: "low_prio_high_count", priority: 50, count: 20 }),
      make({ id: "high_prio_low_count", priority: 10, count: 1 }),
      make({ id: "mid_prio_mid_count", priority: 30, count: 5 }),
    ]);
    expect(result.map((r) => r.id)).toEqual([
      "high_prio_low_count",
      "mid_prio_mid_count",
      "low_prio_high_count",
    ]);
  });

  it("breaks ties on priority by count desc", () => {
    const result = rankSuggestions([
      make({ id: "small", priority: 10, count: 2 }),
      make({ id: "large", priority: 10, count: 50 }),
    ]);
    expect(result.map((r) => r.id)).toEqual(["large", "small"]);
  });

  it("caps the result at maxItems", () => {
    const inputs = Array.from({ length: 10 }).map((_, i) =>
      make({ id: `s${i}`, priority: 10 + i, count: 1 }),
    );
    const result = rankSuggestions(inputs, 3);
    expect(result.length).toBe(3);
  });
});
