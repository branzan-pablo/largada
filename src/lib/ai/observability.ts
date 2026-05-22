import { createAdminClient } from "@/lib/supabase/admin";
import type { Json } from "@/types/database";

export interface AICallUsage {
  promptTokens?: number;
  completionTokens?: number;
  totalTokens?: number;
}

interface AICallLog {
  task: string;
  model?: string;
  ms: number;
  input_tokens: number | null;
  output_tokens: number | null;
  success: boolean;
  error?: string | null;
  metadata?: Json | null;
}

async function persist(log: AICallLog): Promise<void> {
  try {
    const supabase = createAdminClient();
    await supabase.from("ai_call_logs").insert({
      task: log.task,
      model: log.model ?? null,
      duration_ms: log.ms,
      input_tokens: log.input_tokens,
      output_tokens: log.output_tokens,
      success: log.success,
      error: log.error ?? null,
      metadata: log.metadata ?? null,
    });
  } catch (err) {
    console.error("[ai/observability] Failed to persist call log:", err);
  }
}

/**
 * Wrap an AI call so its latency, token usage, success/failure get recorded in
 * `ai_call_logs`. Use this as the only path that talks to a provider so we
 * never lose visibility on what's spending tokens.
 *
 * The callback returns `{ result, usage, model }` — `usage` is whatever the
 * provider returns; the wrapper handles the persistence side-effect.
 */
export async function withTelemetry<T>(
  taskName: string,
  fn: () => Promise<{ result: T; usage?: AICallUsage; model?: string }>,
  metadata?: Json,
): Promise<T> {
  const start = Date.now();
  try {
    const { result, usage, model } = await fn();
    await persist({
      task: taskName,
      model,
      ms: Date.now() - start,
      input_tokens: usage?.promptTokens ?? null,
      output_tokens: usage?.completionTokens ?? null,
      success: true,
      metadata: metadata ?? null,
    });
    return result;
  } catch (err) {
    await persist({
      task: taskName,
      ms: Date.now() - start,
      input_tokens: null,
      output_tokens: null,
      success: false,
      error: err instanceof Error ? err.message : String(err),
      metadata: metadata ?? null,
    });
    throw err;
  }
}
