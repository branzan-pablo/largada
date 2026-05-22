import { describe, it, expect } from "vitest";
import { buildUrl } from "@/hooks/use-infinite-races";
import type { RaceFilters } from "@/types/race";

function parse(url: string): URLSearchParams {
  return new URL(url, "http://localhost").searchParams;
}

describe("buildUrl — semantic mode parameter", () => {
  it("omits mode when semantic is false even if search is set", () => {
    const params = parse(buildUrl({} satisfies RaceFilters, "5k", 1));
    expect(params.has("mode")).toBe(false);
    expect(params.get("search")).toBe("5k");
  });

  it("omits mode when semantic is true but search is empty", () => {
    const filters: RaceFilters = { semantic: true };
    const params = parse(buildUrl(filters, "", 1));
    expect(params.has("mode")).toBe(false);
  });

  it("emits mode=semantic when both semantic and search are set", () => {
    const filters: RaceFilters = { semantic: true };
    const params = parse(buildUrl(filters, "corrida fácil pra iniciante", 1));
    expect(params.get("mode")).toBe("semantic");
    expect(params.get("search")).toBe("corrida fácil pra iniciante");
  });

  it("omits mode when semantic is explicitly false", () => {
    const filters: RaceFilters = { semantic: false };
    const params = parse(buildUrl(filters, "Maratona Rio Preto", 1));
    expect(params.has("mode")).toBe(false);
  });

  it("preserves other filters alongside mode=semantic", () => {
    const filters: RaceFilters = {
      semantic: true,
      city: "São José do Rio Preto",
      distances: ["5k", "10k"],
      prizeType: ["money"],
      radius: 100,
      lat: -20.81,
      lng: -49.37,
    };
    const params = parse(buildUrl(filters, "noturna", 2));
    expect(params.get("mode")).toBe("semantic");
    expect(params.get("city")).toBe("São José do Rio Preto");
    expect(params.get("distances")).toBe("5k,10k");
    expect(params.get("prizeType")).toBe("money");
    expect(params.get("radius")).toBe("100");
    expect(params.get("lat")).toBe("-20.81");
    expect(params.get("lng")).toBe("-49.37");
    expect(params.get("page")).toBe("2");
  });
});

describe("buildUrl — non-semantic", () => {
  it("forwards page and limit unconditionally", () => {
    const params = parse(buildUrl({}, "", 3));
    expect(params.get("page")).toBe("3");
    expect(params.has("limit")).toBe(true);
  });

  it("skips empty arrays for distances and prizeType", () => {
    const filters: RaceFilters = { distances: [], prizeType: [] };
    const params = parse(buildUrl(filters, "", 1));
    expect(params.has("distances")).toBe(false);
    expect(params.has("prizeType")).toBe(false);
  });

  it("skips lat/lng when both are zero (falsy)", () => {
    const filters: RaceFilters = { lat: 0, lng: 0 };
    const params = parse(buildUrl(filters, "", 1));
    expect(params.has("lat")).toBe(false);
    expect(params.has("lng")).toBe(false);
  });

  it("emits radius when present and non-zero", () => {
    const filters: RaceFilters = { radius: 50 };
    const params = parse(buildUrl(filters, "", 1));
    expect(params.get("radius")).toBe("50");
  });
});
