import { DollarSign, Trophy } from "lucide-react";

const badgeStyles = {
  trophy: "bg-orange-50 text-orange-600 border-orange-200",
  money: "bg-emerald-50 text-emerald-600 border-emerald-200",
};

function Badge({ type }: { type: "trophy" | "money" }) {
  return (
    <span className={`inline-flex items-center gap-1 px-1.5 py-0.5 md:px-2 rounded-md border text-[11px] md:text-[12px] font-semibold uppercase tracking-wide ${badgeStyles[type]}`}>
      {type === "money" ? <DollarSign className="h-3 w-3 md:h-4 md:w-4" /> : <Trophy className="h-3 w-3 md:h-4 md:w-4" />}
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
