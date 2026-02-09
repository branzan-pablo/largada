import { Badge } from "@/components/ui/badge";
import { DollarSign, Trophy } from "lucide-react";
import { PRIZE_TYPES } from "@/lib/constants";

export function RacePrizeBadge({ prizeType }: { prizeType: string }) {
  if (prizeType === "none") return null;

  const icon =
    prizeType === "money" ? (
      <DollarSign className="h-3 w-3" />
    ) : prizeType === "trophy" ? (
      <Trophy className="h-3 w-3" />
    ) : (
      <Trophy className="h-3 w-3" />
    );

  const style =
    prizeType === "money" || prizeType === "both"
      ? "bg-green-50 text-green-700 border-green-200"
      : "bg-yellow-50 text-yellow-700 border-yellow-200";

  return (
    <Badge variant="outline" className={style}>
      <span className="flex items-center gap-1">
        {icon}
        {PRIZE_TYPES[prizeType as keyof typeof PRIZE_TYPES]}
      </span>
    </Badge>
  );
}
