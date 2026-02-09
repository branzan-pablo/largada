import { Badge } from "@/components/ui/badge";
import { RACE_STATUSES } from "@/lib/constants";
import { cn } from "@/lib/utils";

const statusStyles: Record<string, string> = {
  confirmed: "bg-green-50 text-green-700 border-green-200",
  postponed: "bg-yellow-50 text-yellow-700 border-yellow-200",
  cancelled: "bg-red-50 text-red-700 border-red-200",
};

export function RaceStatusBadge({ status }: { status: string }) {
  return (
    <Badge variant="outline" className={cn(statusStyles[status])}>
      {RACE_STATUSES[status as keyof typeof RACE_STATUSES] ?? status}
    </Badge>
  );
}
