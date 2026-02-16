import Link from "next/link";
import { RaceDistanceBadges } from "./race-distance-badges";
import { RacePrizeBadge } from "./race-prize-badge";
import { RaceStatusBadge } from "./race-status-badge";
import { MapPin, Users, ArrowRight, Route } from "lucide-react";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import type { Race } from "@/types/race";

export function RaceCard({ race }: { race: Race }) {
  const raceDate = new Date(race.date + "T00:00:00");
  const dateLabel = format(raceDate, "dd MMM", { locale: ptBR }).toUpperCase();

  return (
    <Link href={`/corrida/${race.slug}`} className="block">
      <div className="border border-zinc-800 rounded-xl bg-zinc-900/30 p-5 hover:border-zinc-600 transition-colors h-full flex flex-col justify-between">
        <div>
          {/* Top row: date badge + prize badge + status badge */}
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2 flex-wrap">
              <span className="px-2.5 py-1 rounded-md bg-zinc-800 text-[11px] font-semibold text-zinc-300 tracking-wide">
                {dateLabel}
              </span>
              <RacePrizeBadge prizeType={race.prize_type} />
            </div>
            {race.status !== "confirmed" && (
              <RaceStatusBadge status={race.status} />
            )}
          </div>

          {/* Race name */}
          <h3 className="text-base font-semibold text-white line-clamp-2 mb-3">
            {race.name}
          </h3>

          {/* City */}
          <div className="flex items-center gap-2 mb-3">
            <MapPin className="w-4 h-4 text-zinc-600 shrink-0" />
            <span className="text-sm text-zinc-400">{race.city}, {race.state}</span>
          </div>

          {/* Distances */}
          <div className="flex items-center gap-2">
            <Route className="w-4 h-4 text-zinc-600 shrink-0" />
            <RaceDistanceBadges distances={race.distances} />
          </div>
        </div>

        {/* Bottom row: RSVP count + link */}
        <div className="flex items-center justify-between mt-4 pt-3 border-t border-zinc-800/50">
          <span className="flex items-center gap-1.5 text-xs text-zinc-500">
            <Users className="w-3.5 h-3.5" />
            {race.rsvp_count} confirmados
          </span>
          <span className="flex items-center gap-1 text-sm font-medium text-zinc-300 hover:text-white transition-colors">
            Detalhes
            <ArrowRight className="w-4 h-4" />
          </span>
        </div>
      </div>
    </Link>
  );
}
