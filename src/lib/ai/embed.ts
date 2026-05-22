import { embed as aiEmbed } from "ai";
import { embeddingModel, EMBEDDING_DIMENSIONS } from "./provider";
import { withTelemetry } from "./observability";

const GOOGLE_EMBED_PROVIDER_OPTIONS = {
  google: { outputDimensionality: EMBEDDING_DIMENSIONS },
};

/**
 * Build the canonical "race fingerprint" string used both at insertion time
 * (for dedup) and at backfill (for existing rows). Keep this stable — changing
 * it invalidates the existing embeddings and you'd need a rebuild.
 */
export function buildRaceFingerprint(race: {
  name: string;
  city: string | null;
  date: string | null;
  organizer?: string | null;
}): string {
  const parts = [
    race.name,
    race.city ?? "",
    race.date ?? "",
    race.organizer ?? "",
  ];
  return parts
    .map((p) => p.trim())
    .filter(Boolean)
    .join(" | ");
}

export async function embedText(text: string): Promise<number[]> {
  return withTelemetry(
    "embed",
    async () => {
      const { embedding, usage } = await aiEmbed({
        model: embeddingModel,
        value: text,
        providerOptions: GOOGLE_EMBED_PROVIDER_OPTIONS,
      });
      if (embedding.length !== EMBEDDING_DIMENSIONS) {
        throw new Error(
          `Unexpected embedding length: got ${embedding.length}, expected ${EMBEDDING_DIMENSIONS}`,
        );
      }
      return {
        result: embedding,
        usage: { promptTokens: usage?.tokens, totalTokens: usage?.tokens },
        model: "gemini-embedding-001",
      };
    },
    { text_length: text.length },
  );
}

/**
 * Convenience: turn a number[] embedding into the pgvector string format used
 * by Supabase RPCs that expect a `vector` argument bound as text.
 */
export function toPgVector(embedding: number[]): string {
  return `[${embedding.join(",")}]`;
}
