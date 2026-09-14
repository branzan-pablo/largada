import { describe, expect, it } from "vitest";
import { PUBLIC_RACE_SUMMARY_COLUMNS } from "@/lib/public-races";

describe("public race contract", () => {
  it("exposes only fields required by race cards", () => {
    expect(PUBLIC_RACE_SUMMARY_COLUMNS.split(",")).toEqual([
      "id",
      "name",
      "slug",
      "date",
      "start_time",
      "city",
      "state",
      "distances",
      "prize_type",
      "prize_structured",
      "image_url",
    ]);
  });

  it.each([
    "embedding",
    "created_by",
    "notification_sent_at",
    "rsvp_count",
    "is_promoted",
  ])("does not expose internal field %s", (field) => {
    expect(PUBLIC_RACE_SUMMARY_COLUMNS.split(",")).not.toContain(field);
  });
});
