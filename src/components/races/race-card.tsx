import { memo } from "react";
import Image from "next/image";
import Link from "next/link";
import { RaceDistanceBadges } from "./race-distance-badges";
import { RacePrizeBadge } from "./race-prize-badge";
import { RacePrizeAmountBadge } from "./race-prize-amount-badge";
import { RaceMatchReasonChip } from "./race-match-reason-chip";
import { RaceShareButton } from "./race-share-button";
import { MapPin, Users, Star, CalendarDays } from "lucide-react";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { formatTime, parseRaceDate } from "@/lib/date";
import type { Race } from "@/types/race";

export const RaceCard = memo(function RaceCard({ race, priority = false }: { race: Race; priority?: boolean }) {
  const raceDate = parseRaceDate(race.date);
  const day = format(raceDate, "dd");
  const month = format(raceDate, "MMM", { locale: ptBR }).toUpperCase();
  const formattedDate = format(raceDate, "dd 'de' MMM, yyyy", { locale: ptBR });
  const baseUrl = process.env.NEXT_PUBLIC_APP_URL || "";
  const shareUrl = `${baseUrl}/corrida/${race.slug}`;

  return (
    <Link href={`/corrida/${race.slug}`} className={`block group hover:bg-[#FF4D00]/10 rounded-xl p-2 overflow-hidden transition-colors ${race.is_promoted ? "ring-2 ring-[#FF4D00] shadow-lg shadow-[#FF4D00]/20 bg-linear-to-b from-[#FF4D00]/5 to-transparent" : ""}`}>
      {/* Thumbnail */}
      <div className="relative aspect-video w-full overflow-hidden rounded-xl bg-gray-100">
        {race.image_url ? (
          <>
            {/* Blurred background layer */}
            <Image
              src={race.image_url}
              alt=""
              fill
              className="object-cover scale-110 blur-xl brightness-75"
              sizes="(max-width: 640px) calc(100vw - 2rem), (max-width: 1024px) calc(50vw - 2rem), calc(33vw - 2rem)"
              aria-hidden
              unoptimized
            />
            {/* Sharp foreground — full image visible */}
            <Image
              src={race.image_url}
              alt={race.name}
              fill
              className="object-contain md:transition-transform md:duration-300 md:group-hover:scale-[1.03] relative"
              sizes="(max-width: 640px) calc(100vw - 2rem), (max-width: 1024px) calc(50vw - 2rem), calc(33vw - 2rem)"
              priority={priority}
              unoptimized
            />
          </>
        ) : (
          <div className="absolute inset-0 flex flex-col items-center justify-center bg-linear-to-br from-[#FF4D00]/10 via-gray-100 to-gray-200">
            <span className="text-4xl font-black leading-none text-[#0D1B2A]">{day}</span>
            <span className="mt-0.5 text-xs font-bold uppercase tracking-wider text-[#FF4D00]">{month}</span>
          </div>
        )}

        {/* Promoted badge — flush top right corner */}
        {race.is_promoted && (
          <div className="absolute top-0 right-0 z-10 flex items-center gap-1 sm:gap-1.5 bg-linear-to-r from-[#FF4D00] to-[#E04400] text-white text-[10px] sm:text-xs uppercase font-extrabold px-2 py-1 sm:px-3 sm:py-1.5 rounded-tr-xl rounded-bl-xl shadow-lg shadow-[#FF4D00]/40">
            <Star className="w-3 h-3 sm:w-4 sm:h-4 fill-white" />
            Destaque
          </div>
        )}

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
      <div className="pt-1.5 pb-0.5 md:pt-2 md:pb-1">
        {race.match_reason ? (
          <div className="mb-0.5 md:mb-1">
            <RaceMatchReasonChip reason={race.match_reason} />
          </div>
        ) : null}
        <h3 className="text-sm md:text-base font-bold text-[#0D1B2A] line-clamp-2 leading-snug mb-0.5 md:mb-1">
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

        {race.rsvp_count > 0 && (
          <div className="flex min-w-0 items-center gap-1 text-xs text-[#6B7280] mb-1 md:mb-1.5">
            <Users className="w-3 h-3 shrink-0" />
            <span className="truncate">{race.rsvp_count === 1 ? "1 pessoa confirmou" : `${race.rsvp_count} pessoas confirmaram`}</span>
          </div>
        )}

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
