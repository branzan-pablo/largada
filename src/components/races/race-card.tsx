import Link from "next/link";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { RaceDistanceBadges } from "./race-distance-badges";
import { RacePrizeBadge } from "./race-prize-badge";
import { RaceStatusBadge } from "./race-status-badge";
import { RsvpButton } from "@/components/rsvp/rsvp-button";
import { CalendarDays, MapPin } from "lucide-react";
import { formatDate } from "@/lib/utils";
import type { Race } from "@/types/race";

export function RaceCard({ race }: { race: Race }) {
  const isUpcoming = new Date(race.date) >= new Date();
  const showStatusBadge = race.status !== "confirmed";

  return (
    <Link href={`/corrida/${race.slug}`}>
      <Card className="h-full transition-shadow hover:shadow-sm">
        <CardHeader className="pb-3">
          <div className="flex items-start justify-between gap-2">
            <CardTitle className="line-clamp-2 text-base font-semibold leading-tight">
              {race.name}
            </CardTitle>
            {showStatusBadge && <RaceStatusBadge status={race.status} />}
          </div>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="flex items-center gap-4 text-sm text-muted-foreground">
            <span className="flex items-center gap-1">
              <CalendarDays className="h-3.5 w-3.5" />
              {formatDate(race.date)}
            </span>
            <span className="flex items-center gap-1">
              <MapPin className="h-3.5 w-3.5" />
              {race.city}
            </span>
          </div>

          <RaceDistanceBadges distances={race.distances} />

          <div className="flex items-center justify-between">
            <RacePrizeBadge prizeType={race.prize_type} />
            <RsvpButton
              raceId={race.id}
              initialRsvped={false}
              initialCount={race.rsvp_count}
              variant="compact"
            />
          </div>

          {!isUpcoming && (
            <p className="text-xs text-muted-foreground">Corrida já realizada</p>
          )}
        </CardContent>
      </Card>
    </Link>
  );
}
