import { Banknote } from "lucide-react";
import type { PrizeStructured, DistancePrize } from "@/types/race";

const BADGE_CLASS =
  "inline-flex items-center gap-1 px-1.5 py-0.5 md:px-2 rounded-md border text-[11px] md:text-[12px] font-semibold uppercase tracking-wide bg-emerald-50 text-emerald-700 border-emerald-200";

function formatBrl(value: number): string {
  return value.toLocaleString("pt-BR");
}

function describeDistance(d: DistancePrize): string {
  if (d.distance === "geral" || !d.distance) {
    return `Até R$ ${formatBrl(d.top_prize ?? 0)} ao 1º`;
  }
  return `${d.distance.toUpperCase()} até R$ ${formatBrl(d.top_prize ?? 0)}`;
}

/**
 * Per-distance prize badges. Each distance with a credible top_prize gets its
 * own chip so a 5K runner reads the 5K payout and a 10K runner reads the 10K
 * payout, never the sum across categories.
 */
export function RacePrizeAmountBadge({
  prize,
}: {
  prize: PrizeStructured | null | undefined;
}) {
  if (!prize || !prize.has_money) return null;

  const payouts = (prize.by_distance ?? [])
    .filter((d) => (d.top_prize ?? 0) > 0)
    .sort((a, b) => (b.top_prize ?? 0) - (a.top_prize ?? 0));

  if (payouts.length === 0) return null;

  return (
    <>
      {payouts.map((d) => (
        <span key={d.distance} className={BADGE_CLASS}>
          <Banknote className="h-3 w-3 md:h-4 md:w-4" />
          {describeDistance(d)}
        </span>
      ))}
    </>
  );
}
