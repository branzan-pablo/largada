import { NextResponse } from "next/server";
import { z } from "zod";
import { requireAdmin } from "@/lib/auth";
import { rateLimit } from "@/lib/rate-limit";
import { createAdminClient } from "@/lib/supabase/admin";
import { enrichRace } from "@/lib/ai/enrich-race";
import { isAIEnabled } from "@/lib/ai/provider";
import { todayInBrazil } from "@/lib/date";

const bodySchema = z
  .object({
    limit: z.number().int().positive().max(200).optional(),
    dryRun: z.boolean().optional(),
  })
  .optional();

const DEFAULT_LIMIT = 50;

/**
 * Backfill enrichment over races that are missing prize_structured (new per-
 * distance shape) or embedding. Runs sequentially so we never spike the
 * Gemini quota; the admin can re-trigger to process the next batch.
 */
export async function POST(request: Request) {
  if (!isAIEnabled()) {
    return NextResponse.json(
      { error: "IA não disponível no momento." },
      { status: 503 },
    );
  }

  const authResult = await requireAdmin();
  if (authResult instanceof NextResponse) return authResult;

  // Tight cap because each call can spend dozens of LLM round-trips.
  const { limited } = await rateLimit(`ai-backfill:${authResult.user.id}`, {
    max: 1,
    windowMs: 5 * 60_000,
  });
  if (limited) {
    return NextResponse.json(
      { error: "Aguarde 5 minutos antes de rodar de novo." },
      { status: 429 },
    );
  }

  let raw: unknown = undefined;
  if (request.headers.get("content-length") !== "0") {
    try {
      raw = await request.json();
    } catch {
      raw = undefined;
    }
  }
  const parsed = bodySchema.safeParse(raw);
  if (!parsed.success) {
    return NextResponse.json(
      { error: "Dados inválidos", details: parsed.error.issues },
      { status: 400 },
    );
  }

  const limit = parsed.data?.limit ?? DEFAULT_LIMIT;
  const dryRun = parsed.data?.dryRun ?? false;

  const supabase = createAdminClient();
  const today = todayInBrazil();
  const { data: candidates, error } = await supabase
    .from("races")
    .select("id, name, prize_structured, embedding")
    .in("status", ["confirmed", "pending_review"])
    .gte("date", today)
    .order("created_at", { ascending: true })
    .limit(limit);

  if (error) {
    return NextResponse.json(
      { error: "Falha ao listar corridas", message: error.message },
      { status: 500 },
    );
  }

  // Filter rows that still need work: missing embedding, or missing
  // prize_structured, or stuck on the old shape (no by_distance key).
  const needWork = (candidates ?? []).filter((r) => {
    if (!r.embedding) return true;
    const ps = r.prize_structured as Record<string, unknown> | null;
    if (!ps) return true;
    if (!Array.isArray(ps.by_distance)) return true;
    return false;
  });

  if (dryRun) {
    return NextResponse.json({
      total: needWork.length,
      processed: 0,
      succeeded: 0,
      failed: 0,
      dryRun: true,
      sample: needWork.slice(0, 10).map((r) => ({ id: r.id, name: r.name })),
    });
  }

  const start = Date.now();
  let succeeded = 0;
  let failed = 0;
  const errors: { id: string; name: string; reason: string }[] = [];

  for (const race of needWork) {
    try {
      const result = await enrichRace(race.id);
      if (result.skipped) {
        failed++;
        errors.push({ id: race.id, name: race.name, reason: "skipped" });
      } else if (result.prizeUpdated || result.embeddingUpdated) {
        succeeded++;
      } else {
        failed++;
        errors.push({ id: race.id, name: race.name, reason: "no fields updated" });
      }
    } catch (err) {
      failed++;
      errors.push({
        id: race.id,
        name: race.name,
        reason: err instanceof Error ? err.message : String(err),
      });
    }
  }

  return NextResponse.json({
    total: needWork.length,
    processed: needWork.length,
    succeeded,
    failed,
    durationMs: Date.now() - start,
    errors: errors.slice(0, 20),
  });
}
