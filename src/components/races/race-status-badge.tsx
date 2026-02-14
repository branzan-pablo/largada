import { RACE_STATUSES } from "@/lib/constants";
import { cn } from "@/lib/utils";

const statusStyles: Record<string, string> = {
  confirmed: "bg-emerald-900/30 text-emerald-400 border-emerald-800/50",
  postponed: "bg-yellow-900/30 text-yellow-400 border-yellow-800/50",
  cancelled: "bg-red-900/30 text-red-400 border-red-800/50",
};

export function RaceStatusBadge({ status }: { status: string }) {
  return (
    <span className={cn(
      "inline-flex items-center px-2 py-0.5 rounded-md border text-[11px] font-semibold uppercase tracking-wide",
      statusStyles[status]
    )}>
      {RACE_STATUSES[status as keyof typeof RACE_STATUSES] ?? status}
    </span>
  );
}
