"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import Link from "next/link";
import { ArrowRight, Loader2, Sparkles, ScanSearch } from "lucide-react";

interface SuggestionActionsProps {
  suggestion: {
    id: string;
    name: string;
    city: string;
    state: string | null;
    date: string | null;
    link: string | null;
    notes: string | null;
  };
  alreadyAnalyzed?: boolean;
}

export function SuggestionActions({
  suggestion,
  alreadyAnalyzed,
}: SuggestionActionsProps) {
  const router = useRouter();
  const [isRejecting, setIsRejecting] = useState(false);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [isDescribing, setIsDescribing] = useState(false);
  const [draftDescription, setDraftDescription] = useState<string | null>(null);

  const handleReject = async () => {
    setIsRejecting(true);
    const res = await fetch("/api/suggestions", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id: suggestion.id, status: "rejected" }),
    });

    if (res.ok) {
      toast.success("Sugestão rejeitada");
      router.refresh();
    } else {
      toast.error("Erro ao rejeitar sugestão");
    }
    setIsRejecting(false);
  };

  const handleAnalyze = async () => {
    setIsAnalyzing(true);
    try {
      const res = await fetch(
        `/api/admin/ai/analyze-suggestion/${suggestion.id}`,
        { method: "POST" },
      );
      const json = await res.json();
      if (!res.ok) {
        toast.error(json.message || json.error || "Falha ao analisar.");
        return;
      }
      toast.success(`Veredito: ${json.analysis?.verdict ?? "?"}.`);
      router.refresh();
    } catch (err) {
      console.error("[analyze-suggestion]", err);
      toast.error("Erro inesperado na análise.");
    } finally {
      setIsAnalyzing(false);
    }
  };

  const handleSuggestDescription = async () => {
    setIsDescribing(true);
    try {
      const res = await fetch("/api/admin/ai/describe-race", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: suggestion.name,
          city: suggestion.city,
          state: suggestion.state,
          date: suggestion.date,
        }),
      });
      const json = await res.json();
      if (!res.ok) {
        toast.error(json.message || json.error || "Falha ao gerar.");
        return;
      }
      if (typeof json.description !== "string" || !json.description.trim()) {
        toast.warning("Resposta vazia.");
        return;
      }
      setDraftDescription(json.description);
      toast.success("Descrição gerada. Será aplicada ao criar a corrida.");
    } catch (err) {
      console.error("[describe-suggestion]", err);
      toast.error("Erro inesperado.");
    } finally {
      setIsDescribing(false);
    }
  };

  const approveParams = new URLSearchParams({
    suggestionId: suggestion.id,
    name: suggestion.name,
    city: suggestion.city,
    ...(suggestion.state ? { state: suggestion.state } : {}),
    ...(suggestion.date ? { date: suggestion.date } : {}),
    link: suggestion.link || "",
    notes: suggestion.notes || "",
    ...(draftDescription ? { description: draftDescription } : {}),
  });

  return (
    <div className="space-y-3 pt-1">
      {draftDescription && (
        <div className="rounded-md border border-emerald-200 bg-emerald-50 p-2 text-xs text-emerald-900">
          <strong className="block">Descrição sugerida:</strong>
          <p className="mt-1 whitespace-pre-line">{draftDescription}</p>
        </div>
      )}

      {/* Row 1: AI tools — aids that inform the decision. */}
      <div className="grid grid-cols-2 gap-2">
        <Button
          size="sm"
          variant="outline"
          onClick={handleAnalyze}
          disabled={isAnalyzing}
          className="gap-1.5"
          title={alreadyAnalyzed ? "Re-analisar com IA" : "Analisar com IA"}
        >
          {isAnalyzing ? (
            <Loader2 className="h-3.5 w-3.5 animate-spin" />
          ) : (
            <ScanSearch className="h-3.5 w-3.5" />
          )}
          {isAnalyzing
            ? "Analisando..."
            : alreadyAnalyzed
              ? "Re-analisar"
              : "Analisar com IA"}
        </Button>
        <Button
          size="sm"
          variant="outline"
          onClick={handleSuggestDescription}
          disabled={isDescribing}
          className="gap-1.5"
        >
          {isDescribing ? (
            <Loader2 className="h-3.5 w-3.5 animate-spin" />
          ) : (
            <Sparkles className="h-3.5 w-3.5" />
          )}
          {isDescribing ? "Gerando..." : "Sugerir descrição"}
        </Button>
      </div>

      {/* Row 2: final decision — primary action + destructive. */}
      <div className="flex gap-2 border-t border-dashed border-gray-200 pt-2">
        <Button size="sm" asChild className="flex-1">
          <Link href={`/admin/corridas/nova?${approveParams.toString()}`}>
            Criar corrida
            <ArrowRight className="ml-1 h-3.5 w-3.5" />
          </Link>
        </Button>
        <Button
          size="sm"
          variant="outline"
          className="cursor-pointer text-destructive border-destructive/40 hover:bg-destructive/5 hover:text-destructive"
          onClick={handleReject}
          disabled={isRejecting}
        >
          {isRejecting && <Loader2 className="mr-1 h-3.5 w-3.5 animate-spin" />}
          Rejeitar
        </Button>
      </div>
    </div>
  );
}
