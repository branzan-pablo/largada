import Link from "next/link";
import { RaceDistanceBadges } from "./race-distance-badges";
import { RacePrizeBadge } from "./race-prize-badge";
import { MapPin, Users, ArrowRight, Bookmark, Tag } from "lucide-react";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import type { Race } from "@/types/race";
import { cn } from "@/lib/utils";

export function RaceCard({ race }: { race: Race }) {
  const raceDate = new Date(race.date + "T00:00:00");
  const day = format(raceDate, "dd");
  const month = format(raceDate, "MMM", { locale: ptBR }).toUpperCase();

  return (
    <Link href={`/corrida/${race.slug}`} className="block group">
      <div className="relative border border-zinc-800 rounded-xl bg-zinc-950/30 p-5 hover:border-zinc-700 hover:bg-zinc-900/30 transition-all duration-300 h-full flex flex-col">
        {/* Header: Date + Badges + Bookmark */}
        <div className="flex items-start justify-between mb-4">
          <div className="flex items-center gap-2">
            <div className="flex flex-col items-center justify-center bg-zinc-900 border border-zinc-800 rounded-lg px-2.5 py-1.5 min-w-14">
              <span className="text-xs font-bold text-zinc-300 leading-none mb-0.5">{day}</span>
              <span className="text-[10px] font-semibold text-zinc-500 leading-none">{month}</span>
            </div>
            {race.prize_type !== "none" && (
              <RacePrizeBadge prizeType={race.prize_type} />
            )}
          </div>
          <button
            type="button"
            className="text-zinc-600 hover:text-zinc-300 transition-colors p-1 -mr-1"
            aria-label="Salvar corrida"
          >
            <Bookmark className="w-5 h-5" />
          </button>
        </div>

        {/* Info */}
        <div className="flex-1">
          <h3 className="text-lg font-bold text-white mb-2 group-hover:text-[#E85D2A] transition-colors line-clamp-2">
            {race.name}
          </h3>

          <div className="flex items-center gap-2 mb-4">
            <MapPin className="w-4 h-4 text-zinc-600 shrink-0" />
            <span className="text-sm text-zinc-400">{race.city}, {race.state}</span>
          </div>

          <div className="flex items-center gap-2 mb-5">
            <Tag className="w-3.5 h-3.5 text-zinc-600 shrink-0" />
            <RaceDistanceBadges distances={race.distances} />
          </div>
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between pt-4 border-t border-zinc-800/50">
          <span className="flex items-center gap-2 text-xs text-zinc-500">
            <Users className="w-3.5 h-3.5" />
            <span className="font-medium text-zinc-400">{race.rsvp_count}</span> confirmados
          </span>
          <span className="flex items-center gap-1 text-xs font-semibold text-white group-hover:translate-x-0.5 transition-transform">
            Detalhes
            <ArrowRight className="w-3.5 h-3.5" />
          </span>
        </div>
      </div>
    </Link>
  );
}
