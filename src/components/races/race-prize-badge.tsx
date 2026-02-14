import { DollarSign, Trophy } from "lucide-react";

const badgeStyles = {
  trophy: "bg-orange-900/30 text-orange-400 border-orange-800/50",
  money: "bg-emerald-900/30 text-emerald-400 border-emerald-800/50",
};

function Badge({ type }: { type: "trophy" | "money" }) {
  return (
    <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-md border text-[11px] font-semibold uppercase tracking-wide ${badgeStyles[type]}`}>
      {type === "money" ? <DollarSign className="h-3 w-3" /> : <Trophy className="h-3 w-3" />}
      {type === "money" ? "Dinheiro" : "Troféu"}
    </span>
  );
}

export function RacePrizeBadge({ prizeType }: { prizeType: string }) {
  if (prizeType === "none") return null;

  if (prizeType === "both") {
    return (
      <>
        <Badge type="trophy" />
        <Badge type="money" />
      </>
    );
  }

  return <Badge type={prizeType === "money" ? "money" : "trophy"} />;
}
