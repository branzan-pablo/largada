import Link from "next/link";
import { CheckCircle2, AlertTriangle, Copy, HelpCircle } from "lucide-react";
import type { SuggestionAnalysis } from "@/lib/ai/schemas/suggestion-analysis";

const VERDICT_STYLES: Record<
  SuggestionAnalysis["verdict"],
  { label: string; className: string; Icon: typeof CheckCircle2 }
> = {
  legit: {
    label: "Legítima",
    className: "bg-emerald-50 text-emerald-800 border-emerald-200",
    Icon: CheckCircle2,
  },
  duplicate: {
    label: "Duplicada",
    className: "bg-amber-50 text-amber-800 border-amber-200",
    Icon: Copy,
  },
  suspect: {
    label: "Suspeita",
    className: "bg-rose-50 text-rose-800 border-rose-200",
    Icon: AlertTriangle,
  },
  uncertain: {
    label: "Incerta",
    className: "bg-slate-50 text-slate-800 border-slate-200",
    Icon: HelpCircle,
  },
};

/**
 * Renders the AI moderation verdict for a suggestion card: colored badge,
 * one-line summary, flags as chips, and link to the duplicate race when
 * applicable. Designed to fit inside the suggestion card body.
 */
export function SuggestionAiBadge({ analysis }: { analysis: SuggestionAnalysis }) {
  const style = VERDICT_STYLES[analysis.verdict];
  const Icon = style.Icon;

  return (
    <div
      className={`rounded-md border px-2 py-1.5 text-xs space-y-1 ${style.className}`}
    >
      <div className="flex items-center gap-1.5 font-semibold">
        <Icon className="h-3.5 w-3.5 shrink-0" />
        <span>{style.label}</span>
        <span className="ml-auto text-[10px] font-normal opacity-70">
          {Math.round(analysis.confidence * 100)}% conf
        </span>
      </div>
      <p className="leading-snug">{analysis.summary}</p>
      {analysis.duplicate_of && (
        <p className="leading-snug">
          Similar a:{" "}
          <span className="font-medium">{analysis.duplicate_of.race_name}</span>
          {analysis.duplicate_of.race_date && ` (${analysis.duplicate_of.race_date})`}{" "}
          ({Math.round(analysis.duplicate_of.similarity * 100)}%)
        </p>
      )}
      {analysis.flags.length > 0 && (
        <div className="flex flex-wrap gap-1 pt-0.5">
          {analysis.flags.map((f) => (
            <span
              key={f}
              className="rounded bg-white/60 px-1.5 py-0.5 text-[10px] font-mono"
            >
              {f}
            </span>
          ))}
        </div>
      )}
      {analysis.extracted && (
        <p className="text-[10px] opacity-70">
          Pré-extração disponível. Será aplicada ao criar corrida.
        </p>
      )}
    </div>
  );
}
