import { google } from "@ai-sdk/google";
import { anthropic } from "@ai-sdk/anthropic";

/**
 * Centralized model routing. Tasks pick the model from `models.<task>` so swapping
 * provider or tier later is a single-file change.
 *
 * Default lane is Google Gemini Flash Lite because it has the most generous free
 * tier (1000 req/day at the time of writing) which suits the bootstrap phase.
 * Anthropic Haiku 4.5 stays wired as a future failover lane.
 */
export const modelIds = {
  extract: "gemini-3.5-flash",
  describe: "gemini-3.5-flash-lite",
  classify: "gemini-3.5-flash-lite",
  chat: "gemini-3.5-flash-lite",
  embedding: "gemini-embedding-001",
} as const;

export const models = {
  extract: google(modelIds.extract),
  describe: google(modelIds.describe),
  classify: google(modelIds.classify),
  chat: google(modelIds.chat),
  reasoning: anthropic("claude-haiku-4-5-20251001"),
} as const;

export const embeddingModel = google.textEmbedding(modelIds.embedding);

/**
 * gemini-embedding-001 emits 3072-dim vectors natively, but supports Matryoshka
 * truncation. We pin to 768 here (passed via providerOptions in embed.ts) so the
 * vectors fit pgvector's HNSW index limit and stay cheap to store.
 */
export const EMBEDDING_DIMENSIONS = 768;

export function isAIEnabled(): boolean {
  return !!process.env.GOOGLE_GENERATIVE_AI_API_KEY;
}
