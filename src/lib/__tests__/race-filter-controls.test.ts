import { describe, expect, it } from "vitest";
import {
  getActiveFilterCount,
  getDateSummary,
  getDistanceSummary,
  getPrizeMode,
  getPrizeSummary,
  toggleDistance,
  withPrizeMode,
} from "@/lib/race-filter-controls";

describe("race filter controls", () => {
  it("summarizes custom ranges precisely", () => {
    expect(getDateSummary({ dateFrom: "2026-05-01", dateTo: "2026-05-15" }))
      .toBe("01/05/2026–15/05/2026");
  });

  it("summarizes multiple distances", () => {
    expect(getDistanceSummary(["5k", "10k", "21k"])).toBe("5K +2");
  });

  it("toggles distances without duplicate values", () => {
    expect(toggleDistance({ distances: ["5k"] }, "10k").distances).toEqual(["5k", "10k"]);
    expect(toggleDistance({ distances: ["5k"] }, "5k").distances).toBeUndefined();
  });

  it("maps every prize mode to the API filter", () => {
    expect(withPrizeMode({}, "any").prizeType).toBeUndefined();
    expect(withPrizeMode({}, "trophy").prizeType).toEqual(["trophy"]);
    expect(withPrizeMode({}, "money").prizeType).toEqual(["money"]);
    expect(withPrizeMode({}, "both").prizeType).toEqual(["both"]);
    expect(getPrizeMode({ prizeType: ["money"] })).toBe("money");
    expect(getPrizeSummary({ prizeType: ["both"] })).toBe("Troféu e dinheiro");
  });

  it("counts filter groups rather than individual selections", () => {
    expect(getActiveFilterCount({ city: "Araçatuba", distances: ["5k", "10k"], prizeType: ["trophy"] })).toBe(3);
  });
});
