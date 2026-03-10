"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import Image from "next/image";
import Link from "next/link";
import { RaceDistanceBadges } from "./race-distance-badges";
import { RacePrizeBadge } from "./race-prize-badge";
import { ChevronLeft, ChevronRight, MapPin, Users, CalendarDays, Star } from "lucide-react";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import type { Race } from "@/types/race";
import { parseRaceDate } from "@/lib/date";

const MAX_SLIDES = 10;
const AUTO_ROTATE_MS = 5000;

export function PromotedHeroCarousel({ races }: { races: Race[] }) {
  const slides = races.slice(0, MAX_SLIDES);
  const [current, setCurrent] = useState(0);
  const [paused, setPaused] = useState(false);
  const touchStartX = useRef(0);
  const touchDeltaX = useRef(0);

  const total = slides.length;

  // Auto-rotate
  useEffect(() => {
    if (total <= 1 || paused) return;
    const timer = setInterval(() => {
      setCurrent((prev) => (prev + 1) % total);
    }, AUTO_ROTATE_MS);
    return () => clearInterval(timer);
  }, [total, paused]);

  const goTo = useCallback(
    (index: number) => {
      setCurrent(((index % total) + total) % total);
    },
    [total]
  );

  // Touch handlers for mobile swipe
  const handleTouchStart = (e: React.TouchEvent) => {
    setPaused(true);
    touchStartX.current = e.touches[0].clientX;
    touchDeltaX.current = 0;
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    touchDeltaX.current = e.touches[0].clientX - touchStartX.current;
  };

  const handleTouchEnd = () => {
    if (Math.abs(touchDeltaX.current) > 50) {
      if (touchDeltaX.current < 0) goTo(current + 1);
      else goTo(current - 1);
    }
    setPaused(false);
  };

  if (slides.length === 0) return null;

  return (
    <div
      className="relative mb-6 overflow-hidden rounded-2xl"
      onMouseEnter={() => setPaused(true)}
      onMouseLeave={() => setPaused(false)}
      onTouchStart={handleTouchStart}
      onTouchMove={handleTouchMove}
      onTouchEnd={handleTouchEnd}
    >
      {/* Slides */}
      <div
        className="flex transition-transform duration-500 ease-in-out"
        style={{ transform: `translateX(-${current * 100}%)` }}
      >
        {slides.map((race) => (
          <HeroSlide key={race.id} race={race} />
        ))}
      </div>

      {/* Desktop arrows (>md, only if multiple slides) */}
      {total > 1 && (
        <>
          <button
            onClick={() => goTo(current - 1)}
            className="hidden md:flex absolute left-3 top-1/2 -translate-y-1/2 z-10
                       h-10 w-10 items-center justify-center rounded-full
                       bg-black/40 text-white hover:bg-black/60 transition-colors"
            aria-label="Slide anterior"
          >
            <ChevronLeft className="h-5 w-5" />
          </button>
          <button
            onClick={() => goTo(current + 1)}
            className="hidden md:flex absolute right-3 top-1/2 -translate-y-1/2 z-10
                       h-10 w-10 items-center justify-center rounded-full
                       bg-black/40 text-white hover:bg-black/60 transition-colors"
            aria-label="Próximo slide"
          >
            <ChevronRight className="h-5 w-5" />
          </button>
        </>
      )}

      {/* Dots indicator */}
      {total > 1 && (
        <div className="absolute bottom-3 left-1/2 -translate-x-1/2 z-10 flex gap-1.5">
          {slides.map((_, i) => (
            <button
              key={i}
              onClick={() => goTo(i)}
              className={`h-2 rounded-full transition-all ${i === current
                ? "w-6 bg-white"
                : "w-2 bg-white/50 hover:bg-white/75"
                }`}
              aria-label={`Ir para slide ${i + 1}`}
            />
          ))}
        </div>
      )}
    </div>
  );
}

function HeroSlide({ race }: { race: Race }) {
  const raceDate = parseRaceDate(race.date);
  const formattedDate = format(raceDate, "dd 'de' MMM, yyyy", { locale: ptBR });

  return (
    <Link
      href={`/corrida/${race.slug}`}
      className="relative block w-full shrink-0 aspect-video md:aspect-21/9"
    >
      {/* Background image */}
      {race.image_url ? (
        <Image
          src={race.image_url}
          alt={race.name}
          fill
          className="object-cover"
          sizes="100vw"
          priority
        />
      ) : (
        <div className="absolute inset-0 bg-linear-to-br from-gray-700 to-gray-900" />
      )}

      {/* Dark gradient overlay */}
      <div className="absolute inset-0 bg-linear-to-t from-black/80 via-black/30 to-transparent" />

      {/* "Patrocinado" label — flush top right corner */}
      <div className="absolute top-0 right-0 z-10 flex items-center gap-1.5 bg-linear-to-r from-[#FF4D00] to-[#E04400] text-white text-[10px] sm:text-xs font-extrabold uppercase px-3 py-1.5 rounded-bl-xl shadow-lg shadow-[#FF4D00]/40">
        <Star className="w-3.5 h-3.5 sm:w-4 sm:h-4 fill-white" />
        Destaque
      </div>

      {/* Content overlay — bottom */}
      <div className="absolute bottom-0 left-0 right-0 z-10 p-4 md:p-6">
        <h2 className="text-xl md:text-2xl font-bold text-white line-clamp-2 mb-2">
          {race.name}
        </h2>

        <div className="flex flex-col gap-1 text-sm text-white mb-3">
          <span className="flex items-center gap-1">
            <MapPin className="w-3.5 h-3.5 shrink-0" />
            {race.city}, {race.state}
          </span>
          <span className="flex items-center gap-1">
            <CalendarDays className="w-3.5 h-3.5 shrink-0" />
            {formattedDate}
          </span>
          {race.rsvp_count > 0 && (
            <span className="flex items-center gap-1">
              <Users className="w-3.5 h-3.5 shrink-0" />
              {race.rsvp_count === 1 ? "1 Pessoa confirmou" : `${race.rsvp_count} Pessoas confirmaram`}
            </span>
          )}
        </div>

        <div className="flex items-center gap-1.5 flex-wrap">
          <RaceDistanceBadges distances={race.distances} variant="dark" />
          {race.prize_type !== "none" && (
            <RacePrizeBadge prizeType={race.prize_type} />
          )}
        </div>
      </div>
    </Link>
  );
}
