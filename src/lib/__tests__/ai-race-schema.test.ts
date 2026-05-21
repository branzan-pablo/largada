import { describe, it, expect } from "vitest";
import { raceExtractionSchema } from "@/lib/ai/schemas/race-extraction";

const FULL_VALID = {
  name: "Corrida Teste",
  date: "2026-06-15",
  startTime: "07:00",
  city: "São José do Rio Preto",
  state: "SP",
  address: "Praça XV de Novembro",
  distances: ["5k", "10k"],
  registrationPrice: "R$ 80",
  registrationLink: "https://example.com/inscricao",
  registrationDeadline: "2026-06-10",
  prizeType: "money" as const,
  prizeDetails: "1º R$ 500",
  organizer: "Acme Eventos",
  description: "Corrida noturna pelo centro da cidade.",
  routeDescription: "Largada na praça, saída pela av. principal.",
  imageUrl: "https://example.com/cartaz.jpg",
};

describe("raceExtractionSchema", () => {
  it("accepts a complete object", () => {
    const result = raceExtractionSchema.safeParse(FULL_VALID);
    expect(result.success).toBe(true);
  });

  it("accepts null for every field (LLM returned nothing)", () => {
    const allNull = Object.fromEntries(
      Object.keys(FULL_VALID).map((k) => [k, null]),
    );
    const result = raceExtractionSchema.safeParse(allNull);
    expect(result.success).toBe(true);
  });

  it("rejects a malformed date", () => {
    const result = raceExtractionSchema.safeParse({
      ...FULL_VALID,
      date: "15/06/2026",
    });
    expect(result.success).toBe(false);
  });

  it("rejects a malformed startTime", () => {
    const result = raceExtractionSchema.safeParse({
      ...FULL_VALID,
      startTime: "7am",
    });
    expect(result.success).toBe(false);
  });

  it("rejects a state with more than 2 letters", () => {
    const result = raceExtractionSchema.safeParse({
      ...FULL_VALID,
      state: "São Paulo",
    });
    expect(result.success).toBe(false);
  });

  it("rejects an unknown prizeType", () => {
    const result = raceExtractionSchema.safeParse({
      ...FULL_VALID,
      prizeType: "cash",
    });
    expect(result.success).toBe(false);
  });

  it("accepts distances list with custom labels", () => {
    const result = raceExtractionSchema.safeParse({
      ...FULL_VALID,
      distances: ["5k", "21.1k", "100k"],
    });
    expect(result.success).toBe(true);
  });

  it("rejects empty string in distances list", () => {
    const result = raceExtractionSchema.safeParse({
      ...FULL_VALID,
      distances: ["5k", ""],
    });
    expect(result.success).toBe(false);
  });
});
