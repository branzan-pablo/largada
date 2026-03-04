import Image from "next/image";
import Link from "next/link";
import { RaceDistanceBadges } from "./race-distance-badges";
import { RacePrizeBadge } from "./race-prize-badge";
import { MapPin, Users, Star, CalendarDays } from "lucide-react";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { formatTime } from "@/lib/date";
import type { Race } from "@/types/race";

export function RaceCard({ race }: { race: Race }) {
  // DATE field ("2026-03-15") — append T00:00:00 to interpret as local midnight
  const raceDate = new Date(race.date + "T00:00:00");
  const day = format(raceDate, "dd");
  const month = format(raceDate, "MMM", { locale: ptBR }).toUpperCase();
  const formattedDate = format(raceDate, "dd 'de' MMM, yyyy", { locale: ptBR });

  return (
    <Link href={`/corrida/${race.slug}`} className={`block group hover:bg-[#FF4D00]/10 rounded-xl p-2 overflow-hidden ${race.is_promoted ? "border-2 border-amber-400 shadow-lg shadow-amber-100 bg-gradient-to-b from-amber-50/40 to-transparent" : ""}`}>
      {/* Thumbnail */}
      <div className="relative aspect-[4/3] w-full overflow-hidden rounded-xl bg-gray-100">
        {race.image_url ? (
          <>
            {/* Blurred background layer */}
            <Image
              src={race.image_url}
              alt=""
              fill
              className="object-cover scale-110 blur-xl brightness-75"
              sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
              aria-hidden
            />
            {/* Sharp foreground — full image visible */}
            <Image
              src={race.image_url}
              alt={race.name}
              fill
              className="object-contain transition-transform duration-300 group-hover:scale-[1.03] relative"
              sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
            />
          </>
        ) : (
          <div className="absolute inset-0 flex flex-col items-center justify-center bg-gradient-to-br from-gray-100 to-gray-200">
            <span className="text-3xl font-black text-[#0D1B2A]">{day}</span>
            <span className="text-xs font-bold text-gray-500 uppercase">{month}</span>
          </div>
        )}

        {/* Promoted badge pill — top right */}
        {race.is_promoted && (
          <div className="absolute top-2 right-2 z-10 flex items-center gap-1 bg-amber-500 text-white text-xs uppercase font-semibold px-2.5 py-1 rounded-full shadow-md">
            <Star className="w-3.5 h-3.5 fill-white" />
            Destaque
          </div>
        )}

        {/* Date pill — bottom right (like YT duration) */}
        {race.image_url && (
          <div className="absolute bottom-2 right-2 rounded-md bg-black/80 px-1.5 py-0.5 z-10">
            <span className="text-[16px] font-bold text-white">{day} {month}</span>
          </div>
        )}
      </div>

      {/* Info — below thumbnail, no border */}
      <div className="pt-3 pb-1">
        <h3 className="text-lg font-bold text-[#0D1B2A] line-clamp-2 leading-snug mb-1.5">
          {race.name}
        </h3>

        <div className="flex items-center gap-1 text-sm text-[#6B7280] mb-1">
          <MapPin className="w-3.5 h-3.5 shrink-0" />
          <span>{race.city}, {race.state}</span>
        </div>

        <div className="flex items-center gap-1 text-sm text-[#6B7280] mb-2">
          <CalendarDays className="w-3.5 h-3.5 shrink-0" />
          <span>{formattedDate}{race.start_time ? ` · ${formatTime(race.start_time)}` : ""}</span>
        </div>

        <div className="flex items-center gap-1 text-sm text-[#6B7280] mb-2">
          {race.rsvp_count > 0 && (
            <>
              <Users className="w-3.5 h-3.5 shrink-0" />
              <div className="flex items-center gap-1 text-sm text-[#6B7280]">
                <span>{race.rsvp_count === 1 ? "1 Pessoa confirmou" : `${race.rsvp_count} Pessoas confirmaram`}</span>
              </div>
            </>
          )}
        </div>

        <div className="flex items-center gap-1.5 flex-wrap">
          <RaceDistanceBadges distances={race.distances} />
          {race.prize_type !== "none" && (
            <RacePrizeBadge prizeType={race.prize_type} />
          )}
        </div>
      </div>
    </Link>
  );
}
