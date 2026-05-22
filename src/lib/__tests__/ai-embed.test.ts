import { describe, it, expect } from "vitest";
import { buildRaceFingerprint, toPgVector } from "@/lib/ai/embed";

describe("buildRaceFingerprint", () => {
  it("joins available fields with pipe separator", () => {
    expect(
      buildRaceFingerprint({
        name: "Corrida X",
        city: "São José do Rio Preto",
        date: "2026-06-15",
        organizer: "Acme",
      }),
    ).toBe("Corrida X | São José do Rio Preto | 2026-06-15 | Acme");
  });

  it("omits empty / null parts but preserves order of remaining ones", () => {
    expect(
      buildRaceFingerprint({
        name: "Corrida X",
        city: null,
        date: "2026-06-15",
        organizer: null,
      }),
    ).toBe("Corrida X | 2026-06-15");
  });

  it("trims whitespace inside each part", () => {
    expect(
      buildRaceFingerprint({
        name: "  Corrida X  ",
        city: " SJRP ",
        date: "2026-06-15",
      }),
    ).toBe("Corrida X | SJRP | 2026-06-15");
  });

  it("returns only name when other fields are empty strings", () => {
    expect(
      buildRaceFingerprint({
        name: "Corrida X",
        city: "",
        date: "",
        organizer: "",
      }),
    ).toBe("Corrida X");
  });
});

describe("toPgVector", () => {
  it("serializes to pgvector text format with brackets", () => {
    expect(toPgVector([1, 2, 3])).toBe("[1,2,3]");
  });

  it("handles floating point values", () => {
    expect(toPgVector([0.1, -0.2, 0.3])).toBe("[0.1,-0.2,0.3]");
  });

  it("handles an empty array", () => {
    expect(toPgVector([])).toBe("[]");
  });
});
