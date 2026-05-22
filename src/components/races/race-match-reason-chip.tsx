import { Sparkles } from "lucide-react";

/**
 * Compact "Pra você porque..." chip rendered above the race card title when
 * the listing API joined a match_reason from the user's recommendation logs.
 * Distinct from the orange Destaque badge by using indigo so the two never
 * compete visually on the same card.
 */
export function RaceMatchReasonChip({ reason }: { reason: string }) {
  if (!reason || reason.trim().length === 0) return null;
  return (
    <span className="inline-flex max-w-full items-center gap-1 rounded-md border border-indigo-200 bg-indigo-50 px-2 py-0.5 text-[11px] font-semibold uppercase tracking-wide text-indigo-700">
      <Sparkles className="h-3 w-3 shrink-0" />
      <span className="truncate normal-case font-medium tracking-normal">
        Pra você: {reason}
      </span>
    </span>
  );
}
