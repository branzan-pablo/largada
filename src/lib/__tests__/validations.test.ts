import { describe, expect, it } from "vitest";
import { loginSchema, normalizeUrl, raceSchema } from "@/lib/validations";

describe("normalizeUrl", () => {
  it("normalizes links without a protocol", () => expect(normalizeUrl(" exemplo.com ")).toBe("https://exemplo.com"));
  it("preserves absolute links", () => expect(normalizeUrl("https://exemplo.com")).toBe("https://exemplo.com"));
});

describe("loginSchema", () => {
  it("accepts valid administrative credentials", () => expect(loginSchema.safeParse({ email: "admin@example.com", password: "12345678" }).success).toBe(true));
  it("rejects invalid credentials", () => expect(loginSchema.safeParse({ email: "admin", password: "short" }).success).toBe(false));
});

describe("raceSchema", () => {
  const race = {
    name: "Corrida de Teste",
    date: "2026-10-10",
    startTime: "07:00",
    city: "Catanduva",
    state: "SP",
    address: "Praça Central",
    latitude: -21.13,
    longitude: -48.97,
    distances: ["5k"],
    registrationPrice: "R$ 50",
    registrationLink: "example.com/inscricao",
    registrationDeadline: "2026-10-01",
    prizeType: "none" as const,
  };
  it("accepts and normalizes a complete race", () => {
    const parsed = raceSchema.parse(race);
    expect(parsed.registrationLink).toBe("https://example.com/inscricao");
  });
  it("rejects a deadline after the race", () => expect(raceSchema.safeParse({ ...race, registrationDeadline: "2026-10-11" }).success).toBe(false));
});
