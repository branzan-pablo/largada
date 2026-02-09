import { Badge } from "@/components/ui/badge";

export function RaceDistanceBadges({ distances }: { distances: string[] }) {
  return (
    <div className="flex flex-wrap gap-1">
      {distances.map((d) => (
        <Badge key={d} variant="outline" className="text-xs">
          {d.toUpperCase()}
        </Badge>
      ))}
    </div>
  );
}
