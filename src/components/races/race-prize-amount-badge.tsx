import { Banknote } from "lucide-react";
import type { PrizeStructured } from "@/types/race";

/**
 * Compact money-amount badge shown next to the prize-type badge when the
 * LLM-extracted prize_structured has a credible total. Only renders if the
 * extraction returned at least one positive figure — keeps "💰 R$ X" honest.
 */
export function RacePrizeAmountBadge({
  prize,
}: {
  prize: PrizeStructured | null | undefined;
}) {
  if (!prize) return null;

  const amount = prize.total_money_brl ?? prize.max_per_position;
  if (!amount || amount <= 0) return null;

  const formatted = amount.toLocaleString("pt-BR");
  const isTotal = prize.total_money_brl !== null && prize.total_money_brl > 0;

  return (
    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md border text-[12px] font-semibold uppercase tracking-wide bg-emerald-50 text-emerald-700 border-emerald-200">
      <Banknote className="h-4 w-4" />
      R$ {formatted}
      {!isTotal && " (1º)"}
    </span>
  );
}
