import { google } from "@ai-sdk/google";
import { anthropic } from "@ai-sdk/anthropic";

/**
 * Centralized model routing. Tasks pick the model from `models.<task>` so swapping
 * provider or tier later is a single-file change.
 *
 * Default lane is Google Gemini Flash because it has a real free tier (no
 * card required at AI Studio) which suits the project's bootstrap phase.
 * Anthropic Haiku 4.5 stays wired as a future failover lane.
 */
export const models = {
  extract: google("gemini-2.0-flash-001"),
  describe: google("gemini-2.0-flash-001"),
  classify: google("gemini-2.0-flash-001"),
  chat: google("gemini-2.0-flash-001"),
  reasoning: anthropic("claude-haiku-4-5-20251001"),
} as const;

export const embeddingModel = google.textEmbeddingModel("text-embedding-004");

export const EMBEDDING_DIMENSIONS = 768;

export function isAIEnabled(): boolean {
  return !!process.env.GOOGLE_GENERATIVE_AI_API_KEY;
}
