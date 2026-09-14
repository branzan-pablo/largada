import { beforeEach, describe, expect, it, vi } from "vitest";
import { loadFilterDefaults, saveFilterDefaults } from "@/lib/filter-defaults";

const storage = new Map<string, string>();

beforeEach(() => {
  storage.clear();
  vi.stubGlobal("localStorage", {
    getItem: (key: string) => storage.get(key) ?? null,
    setItem: (key: string, value: string) => storage.set(key, value),
    removeItem: (key: string) => storage.delete(key),
  });
});

describe("filter defaults", () => {
  it("persists a custom date range with the other sticky filters", () => {
    saveFilterDefaults({ city: "Birigui", dateFrom: "2026-10-01", dateTo: "2026-10-31", distances: ["5k"] });
    expect(loadFilterDefaults()).toEqual({ city: "Birigui", dateFrom: "2026-10-01", dateTo: "2026-10-31", distances: ["5k"] });
  });

  it("ignores malformed persisted dates", () => {
    storage.set("race-filter-defaults", JSON.stringify({ dateFrom: "tomorrow", prizeType: ["money"] }));
    expect(loadFilterDefaults()).toEqual({ prizeType: ["money"] });
  });
});
