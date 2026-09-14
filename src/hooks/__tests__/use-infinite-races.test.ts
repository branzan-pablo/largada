import { describe, expect, it } from "vitest";
import { buildUrl } from "@/hooks/use-infinite-races";

const params = (url: string) => new URL(url, "http://localhost").searchParams;

describe("buildUrl", () => {
  it("serializes the supported public filters", () => {
    const query = params(buildUrl({
      city: "Catanduva",
      dateFrom: "2026-09-01",
      dateTo: "2026-09-30",
      distances: ["5k", "10k"],
      prizeType: ["trophy"],
    }, "noturna", 2));
    expect(Object.fromEntries(query)).toMatchObject({
      city: "Catanduva",
      dateFrom: "2026-09-01",
      dateTo: "2026-09-30",
      distances: "5k,10k",
      prizeType: "trophy",
      search: "noturna",
      page: "2",
    });
  });

  it("omits empty optional filters", () => {
    const query = params(buildUrl({ distances: [], prizeType: [] }, "", 1));
    expect(query.has("distances")).toBe(false);
    expect(query.has("prizeType")).toBe(false);
    expect(query.has("search")).toBe(false);
  });
});
