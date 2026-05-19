import { openai } from "@ai-sdk/openai";
import { anthropic } from "@ai-sdk/anthropic";

/**
 * Centralized model routing. Tasks pick the model from `models.<task>` so swapping
 * provider or tier later is a single-file change.
 *
 * Cost references (2026-05): gpt-4o-mini ~$0.15 in / $0.60 out per 1M tokens,
 * text-embedding-3-small ~$0.02/1M. Anthropic Haiku 4.5 is the failover lane.
 */
export const models = {
  extract: openai("gpt-4o-mini"),
  describe: openai("gpt-4o-mini"),
  classify: openai("gpt-4o-mini"),
  chat: openai("gpt-4o-mini"),
  reasoning: anthropic("claude-haiku-4-5-20251001"),
} as const;

export const embeddingModel = openai.embedding("text-embedding-3-small");

export const EMBEDDING_DIMENSIONS = 1536;

export function isAIEnabled(): boolean {
  return !!process.env.OPENAI_API_KEY;
}
