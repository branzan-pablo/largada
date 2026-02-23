import Image from "next/image";
import Link from "next/link";
import { RaceDistanceBadges } from "./race-distance-badges";
import { RacePrizeBadge } from "./race-prize-badge";
import { MapPin, Users, ArrowRight, Tag, Flame } from "lucide-react";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import type { Race } from "@/types/race";

export function RaceCard({ race }: { race: Race }) {
  // DATE field ("2026-03-15") — append T00:00:00 to interpret as local midnight
  const raceDate = new Date(race.date + "T00:00:00");
  const day = format(raceDate, "dd");
  const month = format(raceDate, "MMM", { locale: ptBR }).toUpperCase();

  return (
    <Link href={`/corrida/${race.slug}`} className="block group">
      <div
        className={`relative rounded-xl bg-white overflow-hidden transition-all duration-300 h-full flex flex-col ${
          race.is_promoted
            ? "border border-[#FF4D00]/40 ring-1 ring-[#FF4D00]/20 hover:ring-[#FF4D00]/40 shadow-sm hover:shadow-md"
            : "border border-gray-200 hover:border-[#FF4D00]/30"
        }`}
      >

        {/* Banner image */}
        {race.image_url && (
          <div className="relative aspect-[16/9] w-full">
            <Image
              src={race.image_url}
              alt={race.name}
              fill
              className="object-cover"
              sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
            />
            {/* Promoted badge overlay on image */}
            {race.is_promoted && (
              <div className="absolute top-3 left-3 flex items-center gap-1 rounded-md bg-[#FF4D00] px-2 py-1 shadow-sm">
                <Flame className="w-3 h-3 text-white" />
                <span className="text-[10px] font-semibold text-white uppercase tracking-wider">Destaque</span>
              </div>
            )}
          </div>
        )}

        <div className="p-5 flex flex-col flex-1">
          {/* Promoted badge (no image) */}
          {race.is_promoted && !race.image_url && (
            <div className="flex items-center gap-1 rounded-md bg-[#FF4D00] px-2 py-1 self-start mb-3 shadow-sm">
              <Flame className="w-3 h-3 text-white" />
              <span className="text-[10px] font-semibold text-white uppercase tracking-wider">Destaque</span>
            </div>
          )}

          {/* Header: Date + Badges */}
          <div className="flex items-start gap-2 mb-4">
            <div className="flex flex-col items-center justify-center bg-gray-50 border border-gray-200 rounded-lg px-2.5 py-1.5 min-w-14">
              <span className="text-xs font-bold text-[#0D1B2A] leading-none mb-0.5">{day}</span>
              <span className="text-[10px] font-semibold text-gray-500 leading-none">{month}</span>
            </div>
            {race.prize_type !== "none" && (
              <RacePrizeBadge prizeType={race.prize_type} />
            )}
          </div>

          {/* Info */}
          <div className="flex-1">
            <h3 className="text-lg font-bold text-[#0D1B2A] mb-2 line-clamp-2">
              {race.name}
            </h3>

            <div className="flex items-center gap-2 mb-4">
              <MapPin className="w-4 h-4 text-gray-400 shrink-0" />
              <span className="text-sm text-[#6B7280]">{race.city}, {race.state}</span>
            </div>

            <div className="flex items-center gap-2 mb-5">
              <Tag className="w-3.5 h-3.5 text-gray-400 shrink-0" />
              <RaceDistanceBadges distances={race.distances} />
            </div>
          </div>

          {/* Footer */}
          <div className="flex items-center justify-between pt-4 border-t border-gray-100">
            <span className="flex items-center gap-2 text-xs text-gray-500">
              <Users className="w-3.5 h-3.5" />
              <span className="font-medium text-[#6B7280]">{race.rsvp_count}</span> confirmados
            </span>
            <span className="flex items-center gap-1 text-xs font-semibold text-[#0D1B2A] group-hover:translate-x-0.5 transition-transform">
              Detalhes
              <ArrowRight className="w-3.5 h-3.5" />
            </span>
          </div>
        </div>
      </div>
    </Link>
  );
}
