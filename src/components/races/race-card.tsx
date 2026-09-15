import { memo } from "react";
import Link from "next/link";
import { RaceCardImage } from "./race-card-image";
import { RaceDistanceBadges } from "./race-distance-badges";
import { RacePrizeBadge } from "./race-prize-badge";
import { RacePrizeAmountBadge } from "./race-prize-amount-badge";
import { RaceShareButton } from "./race-share-button";
import { MapPin, CalendarDays } from "lucide-react";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { formatTime, parseRaceDate } from "@/lib/date";
import type { RaceSummary } from "@/types/race";

export const RaceCard = memo(function RaceCard({ race, priority = false }: { race: RaceSummary; priority?: boolean }) {
  const raceDate = parseRaceDate(race.date);
  const day = format(raceDate, "dd");
  const month = format(raceDate, "MMM", { locale: ptBR }).toUpperCase();
  const formattedDate = format(raceDate, "dd 'de' MMM, yyyy", { locale: ptBR });
  const baseUrl = process.env.NEXT_PUBLIC_APP_URL || "";
  const shareUrl = `${baseUrl}/corrida/${race.slug}`;

  return (
    <Link href={`/corrida/${race.slug}`} className="group block overflow-hidden rounded-2xl border border-slate-200/90 bg-white p-2.5 shadow-[0_1px_2px_rgba(13,27,42,0.04)] transition-[transform,box-shadow,border-color] duration-300 hover:-translate-y-1 hover:border-[#FF4D00]/30 hover:shadow-[0_18px_40px_-24px_rgba(13,27,42,0.45)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#FF4D00] focus-visible:ring-offset-2">
      {/* Thumbnail */}
      <div className="relative aspect-video w-full overflow-hidden rounded-xl bg-slate-100 ring-1 ring-slate-900/5">
        <RaceCardImage
          imageUrl={race.image_url}
          raceName={race.name}
          day={day}
          month={month}
          priority={priority}
        />

        {/* Share button — top-left overlay */}
        <div className="absolute top-1.5 left-1.5 md:top-2 md:left-2 z-10">
          <RaceShareButton
            variant="icon"
            raceName={race.name}
            city={race.city}
            state={race.state}
            date={race.date}
            startTime={race.start_time}
            distances={race.distances as string[]}
            shareUrl={shareUrl}
            imageUrl={race.image_url}
          />
        </div>

        {/* Date pill — bottom right (like YT duration) */}
        {race.image_url && (
          <div className="absolute bottom-2 right-2 rounded-md bg-black/80 px-1.5 py-0.5 z-10">
            <span className="text-xs font-bold text-white">{day} {month}</span>
          </div>
        )}
      </div>

      {/* Info — below thumbnail, no border */}
      <div className="px-1 pb-1 pt-3">
        <h3 className="mb-1.5 line-clamp-2 text-sm font-extrabold leading-snug tracking-[-0.01em] text-[#0D1B2A] md:text-base">
          {race.name}
        </h3>

        <div className="flex min-w-0 items-center gap-1 text-xs text-[#6B7280] mb-0.5">
          <MapPin className="w-3 h-3 shrink-0" />
          <span className="truncate">{race.city}, {race.state}</span>
        </div>

        <div className="flex min-w-0 items-center gap-1 text-xs text-[#6B7280] mb-0.5 md:mb-1">
          <CalendarDays className="w-3 h-3 shrink-0" />
          <span className="truncate">{formattedDate}{race.start_time ? ` · ${formatTime(race.start_time)}` : ""}</span>
        </div>

        <div className="flex items-center gap-1 md:gap-1.5 flex-wrap">
          <RaceDistanceBadges distances={race.distances} />
          {race.prize_type !== "none" && (
            <RacePrizeBadge prizeType={race.prize_type} />
          )}
          <RacePrizeAmountBadge prize={race.prize_structured} />
        </div>
      </div>
    </Link>
  );
});
