"use client";

import { useRef, useState, useEffect, useCallback } from "react";
import { PromotedRaceMiniCard } from "./promoted-race-mini-card";
import { ChevronLeft, ChevronRight, Star, X } from "lucide-react";
import type { Race } from "@/types/race";

const DISMISSED_KEY = "promoted-races-dismissed";

export function PromotedRacesBar({ races }: { races: Race[] }) {
  const scrollRef = useRef<HTMLDivElement>(null);
  const [canScrollLeft, setCanScrollLeft] = useState(false);
  const [canScrollRight, setCanScrollRight] = useState(false);
  const [dismissed, setDismissed] = useState(() => {
    if (typeof window === "undefined") return false;
    return sessionStorage.getItem(DISMISSED_KEY) === "true";
  });

  const updateScrollState = useCallback(() => {
    const el = scrollRef.current;
    if (!el) return;
    setCanScrollLeft(el.scrollLeft > 0);
    setCanScrollRight(el.scrollLeft + el.clientWidth < el.scrollWidth - 1);
  }, []);

  useEffect(() => {
    updateScrollState();
    const el = scrollRef.current;
    if (!el) return;
    el.addEventListener("scroll", updateScrollState, { passive: true });
    const ro = new ResizeObserver(updateScrollState);
    ro.observe(el);
    return () => {
      el.removeEventListener("scroll", updateScrollState);
      ro.disconnect();
    };
  }, [races, updateScrollState]);

  const scroll = (direction: "left" | "right") => {
    const el = scrollRef.current;
    if (!el) return;
    el.scrollBy({ left: direction === "left" ? -300 : 300, behavior: "smooth" });
  };

  const handleDismiss = () => {
    setDismissed(true);
    sessionStorage.setItem(DISMISSED_KEY, "true");
  };

  if (races.length === 0 || dismissed) return null;

  return (
    <div className="sticky top-16 z-30 mb-4 backdrop-blur-md bg-gradient-to-r from-amber-50/80 to-yellow-50/75 border-y border-amber-400/60 shadow-sm">
      <div className="mx-auto max-w-7xl px-4 md:px-8 py-2">
        {/* Label + dismiss */}
        <div className="flex items-center justify-between mb-1.5">
          <div className="flex items-center gap-1.5">
            <Star className="h-5 w-5 fill-yellow-500 text-yellow-500" />
            <span className="text-md font-bold text-yellow-700 uppercase tracking-wide">
              Corridas em Destaque
            </span>
          </div>
          <button
            onClick={handleDismiss}
            className="flex items-center justify-center h-6 w-6 rounded-full text-yellow-600 hover:bg-amber-200/50 transition-colors"
            aria-label="Ocultar corridas em destaque"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        {/* Scroll container */}
        <div className="relative">
          {/* Left arrow (desktop only) */}
          {canScrollLeft && (
            <button
              onClick={() => scroll("left")}
              className="hidden md:flex absolute -left-3 top-1/2 -translate-y-1/2 z-10
                         h-8 w-8 items-center justify-center rounded-full
                         bg-white shadow-md border border-gray-200
                         hover:bg-gray-50 transition-colors"
              aria-label="Rolar para esquerda"
            >
              <ChevronLeft className="h-4 w-4" />
            </button>
          )}

          <div
            ref={scrollRef}
            className="flex items-stretch gap-3 overflow-x-auto scrollbar-none snap-x snap-mandatory pb-1"
          >
            {races.map((race) => (
              <div key={race.id} className="snap-start h-auto">
                <PromotedRaceMiniCard race={race} />
              </div>
            ))}
          </div>

          {/* Right arrow (desktop only) */}
          {canScrollRight && (
            <button
              onClick={() => scroll("right")}
              className="hidden md:flex absolute -right-3 top-1/2 -translate-y-1/2 z-10
                         h-8 w-8 items-center justify-center rounded-full
                         bg-white shadow-md border border-gray-200
                         hover:bg-gray-50 transition-colors"
              aria-label="Rolar para direita"
            >
              <ChevronRight className="h-4 w-4" />
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
