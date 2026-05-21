"use client";

import { useState } from "react";
import { Sparkles, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";

interface BackfillResult {
  total: number;
  processed: number;
  succeeded: number;
  failed: number;
  durationMs?: number;
  errors?: { id: string; name: string; reason: string }[];
  dryRun?: boolean;
  sample?: { id: string; name: string }[];
}

/**
 * Triggers /api/admin/ai/backfill-enrich. A dry-run first call gives the
 * admin a count before committing to the actual run, since each enrichment
 * spends a couple of LLM round-trips.
 */
export function BackfillEnrichButton() {
  const [isLoading, setIsLoading] = useState(false);

  async function call(dryRun: boolean): Promise<BackfillResult | null> {
    const res = await fetch("/api/admin/ai/backfill-enrich", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ dryRun, limit: 50 }),
    });
    const json = (await res.json()) as BackfillResult & { error?: string; message?: string };
    if (!res.ok) {
      toast.error(json.message || json.error || "Falha na operação.");
      return null;
    }
    return json;
  }

  async function run() {
    setIsLoading(true);
    try {
      const dry = await call(true);
      if (!dry) return;
      if (dry.total === 0) {
        toast.info("Nenhuma corrida precisa de enriquecimento agora.");
        return;
      }
      if (
        !window.confirm(
          `Existem ${dry.total} corridas pendentes. Processar agora? Pode levar alguns minutos.`,
        )
      ) {
        return;
      }
      const full = await call(false);
      if (!full) return;
      toast.success(
        `Enriquecidas ${full.succeeded} / ${full.processed} corridas em ${(full.durationMs ?? 0) / 1000}s.`,
      );
      if (full.failed > 0) {
        toast.warning(
          `${full.failed} falharam. Veja o console pros detalhes.`,
        );
        console.warn("[backfill] errors", full.errors);
      }
    } catch (err) {
      console.error("[backfill]", err);
      toast.error("Erro inesperado.");
    } finally {
      setIsLoading(false);
    }
  }

  return (
    <Button
      type="button"
      variant="outline"
      size="sm"
      onClick={run}
      disabled={isLoading}
      className="gap-2"
    >
      {isLoading ? (
        <Loader2 className="h-4 w-4 animate-spin" />
      ) : (
        <Sparkles className="h-4 w-4" />
      )}
      {isLoading ? "Processando..." : "Re-enriquecer corridas"}
    </Button>
  );
}
