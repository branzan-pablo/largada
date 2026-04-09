"use client";

import { useState, useEffect, useRef, useCallback, useMemo, useDeferredValue } from "react";
import { useAuth } from "@/contexts/auth-context";
import { useDebounce } from "@/hooks/use-debounce";
import { useInfiniteRaces, type InitialRaceData } from "@/hooks/use-infinite-races";
import { RaceCard } from "./race-card";
import { RaceFiltersDesktop } from "./race-filters";
import { RaceFiltersMobile } from "./race-filters-mobile";
import { RadiusBanner } from "./radius-banner";
import { Skeleton } from "@/components/ui/skeleton";
import { Trophy, ChevronDown, Search, X } from "lucide-react";
import type { Race, RaceFilters } from "@/types/race";

const PROMOTED_INSERT_INTERVAL = 7;

function buildMergedGrid(races: Race[], promotedRaces: Race[]): Race[] {
  if (promotedRaces.length === 0) return races;

  const result: Race[] = [];
  const promotedIds = new Set(promotedRaces.map((r) => r.id));
  let promotedIdx = 0;
  let regularCount = 0;

  for (const race of races) {
    // Insert a promoted card every PROMOTED_INSERT_INTERVAL regular cards
    if (
      regularCount > 0 &&
      regularCount % PROMOTED_INSERT_INTERVAL === 0 &&
      promotedIdx < promotedRaces.length
    ) {
      const promoted = promotedRaces[promotedIdx];
      // Only insert if not already the same race we're about to add
      if (promoted.id !== race.id) {
        result.push(promoted);
        promotedIdx++;
      }
    }

    result.push(race);
    if (!promotedIds.has(race.id)) {
      regularCount++;
    }
  }

  return result;
}

export function RaceList({ initialData }: { initialData?: InitialRaceData }) {
  const { profile } = useAuth();
  const [search, setSearch] = useState("");
  const [filters, setFilters] = useState<RaceFilters>({});
  const [hasInitializedFilters, setHasInitializedFilters] = useState(false);

  if (profile && !hasInitializedFilters) {
    setHasInitializedFilters(true);
    if (
      profile.notification_radius_km &&
      profile.latitude &&
      profile.longitude
    ) {
      setFilters({ radius: profile.notification_radius_km });
    }
  }
  const [availableDistances, setAvailableDistances] = useState<string[]>([]);

  useEffect(() => {
    fetch("/api/races/distances")
      .then((r) => r.json())
      .then((data: string[]) => setAvailableDistances(data))
      .catch(() => {
        /* silently fall back to defaults in filter components */
      });
  }, []);
  const debouncedSearch = useDebounce(search, 150);
  const deferredSearch = useDeferredValue(debouncedSearch);

  // If radius filter is active and user has coordinates, pass them
  const enrichedFilters: RaceFilters = {
    ...filters,
    ...(filters.radius && profile?.latitude && profile?.longitude
      ? { lat: profile.latitude, lng: profile.longitude }
      : {}),
  };

  const { races, totalCount, isLoading, isLoadingMore, hasMore, restoredFromCache, loadMore, sentinelRef } =
    useInfiniteRaces(enrichedFilters, deferredSearch, initialData);

  // Save scroll position on scroll (throttled)
  const scrollTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const handleScroll = useCallback(() => {
    if (scrollTimeoutRef.current) return;
    scrollTimeoutRef.current = setTimeout(() => {
      scrollTimeoutRef.current = null;
      try {
        sessionStorage.setItem("race-list-scroll", String(window.scrollY));
      } catch { /* ignore */ }
    }, 200);
  }, []);

  useEffect(() => {
    window.addEventListener("scroll", handleScroll, { passive: true });
    return () => {
      window.removeEventListener("scroll", handleScroll);
      if (scrollTimeoutRef.current) clearTimeout(scrollTimeoutRef.current);
    };
  }, [handleScroll]);

  // Restore scroll position after cache restore
  useEffect(() => {
    if (!restoredFromCache || races.length === 0) return;
    const saved = sessionStorage.getItem("race-list-scroll");
    if (!saved) return;
    const scrollY = Number(saved);
    if (Number.isNaN(scrollY) || scrollY === 0) return;
    requestAnimationFrame(() => {
      window.scrollTo(0, scrollY);
    });
  }, [restoredFromCache, races.length]);

  const promotedRaces = useMemo(
    () => races.filter((r) => r.is_promoted),
    [races],
  );

  const mergedRaces = useMemo(
    () => buildMergedGrid(races, promotedRaces),
    [races, promotedRaces],
  );

  // Stable unique keys — promoted races may appear twice (top + inserted repeat)
  const mergedKeys = useMemo(() => {
    const seen = new Set<string>();
    return mergedRaces.map((race) => {
      if (seen.has(race.id)) return `${race.id}-repeat`;
      seen.add(race.id);
      return race.id;
    });
  }, [mergedRaces]);

  return (
    <>
      {/* Page Header */}
      <div className="mb-8 flex flex-col md:flex-row md:items-end justify-between gap-6">
        <div className="space-y-2">
          <h1 className="text-3xl md:text-4xl font-bold text-[#0D1B2A] tracking-tight">
            Calendário de Corridas
          </h1>
          <p className="text-[#6B7280] text-sm md:text-base">
            Filtre por cidade, distância e premiação. Marque &quot;Vou
            Nessa&quot; e veja quem da sua rede vai correr.
          </p>
        </div>

        {!isLoading && races.length > 0 && (
          <div className="flex items-center gap-2 px-3 py-1.5 rounded-full border border-gray-200 bg-gray-50 shrink-0 self-start md:self-center">
            <span className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-500 opacity-75" />
              <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500" />
            </span>
            <span className="text-xs font-medium text-[#6B7280]">
              {totalCount !== null ? totalCount : hasMore ? `${races.length}+` : races.length} provas abertas
            </span>
          </div>
        )}
      </div>

      {/* Mobile: search bar + filter button (same row) */}
      <div className="mb-4 md:hidden flex items-center gap-2">
        <div className="relative group flex-1">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400 group-focus-within:text-[#FF4D00] transition-colors pointer-events-none" />
          <input
            type="text"
            placeholder="Nome, cidade ou organizador..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full h-10 bg-gray-50 border border-gray-200 rounded-md text-sm text-gray-800 pl-9 pr-8 focus:outline-none focus:border-gray-300 focus:bg-white transition-all placeholder:text-gray-400"
          />
          {search && (
            <button
              onClick={() => setSearch("")}
              className="absolute right-2.5 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 transition-colors"
              aria-label="Limpar busca"
            >
              <X className="h-3.5 w-3.5" />
            </button>
          )}
        </div>
        <RaceFiltersMobile
          filters={filters}
          onFiltersChange={setFilters}
          search={search}
          onSearchChange={setSearch}
          availableDistances={availableDistances}
        />
      </div>

      {/* Desktop filters */}
      <RaceFiltersDesktop
        filters={filters}
        onFiltersChange={setFilters}
        search={search}
        onSearchChange={setSearch}
        availableDistances={availableDistances}
      />

      {/* Radius banner */}
      {filters.radius && (
        <RadiusBanner
          radius={filters.radius}
          onRemove={() => setFilters({ ...filters, radius: undefined })}
        />
      )}

      {/* Race grid */}
      <div className="mt-3">
        {isLoading ? (
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {Array.from({ length: 6 }).map((_, i) => (
              <RaceCardSkeleton key={i} />
            ))}
          </div>
        ) : races.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16 text-center rounded-lg border border-gray-200 bg-gray-50">
            <Trophy className="mb-4 h-12 w-12 text-gray-300" />
            <h3 className="text-lg font-semibold text-[#0D1B2A]">
              Nenhuma corrida encontrada com esses filtros.
            </h3>
            <p className="mt-1 text-sm text-[#6B7280]">
              Tente ampliar o raio de distância ou remover alguns filtros.
            </p>
            <p className="mt-3 text-sm text-[#6B7280]">
              Conhece uma corrida que deveria aparecer aqui?{" "}
              <a
                href="/sugerir"
                className="text-[#FF4D00] hover:text-[#E04400] underline underline-offset-2 transition-colors"
              >
                Sugerir corrida
              </a>
            </p>
          </div>
        ) : (
          <>
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {mergedRaces.map((race, i) => (
                <RaceCard key={mergedKeys[i]} race={race} priority={i < 2} />
              ))}
            </div>

            {/* Load more button + infinite scroll sentinel */}
            {hasMore && (
              <div ref={sentinelRef} className="flex justify-center pt-10 pb-4">
                <button
                  onClick={loadMore}
                  disabled={isLoadingMore}
                  className="flex items-center gap-2 px-6 py-3 rounded-full bg-gray-100 border border-gray-200 text-sm font-medium text-gray-700 hover:bg-gray-200 hover:text-[#0D1B2A] transition-colors disabled:opacity-50"
                >
                  {isLoadingMore ? (
                    <>
                      <div className="h-4 w-4 animate-spin rounded-full border-2 border-gray-400 border-t-transparent" />
                      Carregando...
                    </>
                  ) : (
                    <>
                      Carregar mais corridas
                      <ChevronDown className="h-4 w-4" />
                    </>
                  )}
                </button>
              </div>
            )}
          </>
        )}
      </div>
    </>
  );
}

function RaceCardSkeleton() {
  return (
    <div className="p-2">
      <Skeleton className="aspect-4/3 w-full rounded-xl bg-gray-200" />
      <div className="pt-3 pb-1 space-y-2">
        <Skeleton className="h-5 w-full bg-gray-200 rounded" />
        <Skeleton className="h-4 w-3/4 bg-gray-200 rounded" />
        <Skeleton className="h-4 w-2/3 bg-gray-200 rounded" />
        <Skeleton className="h-4 w-1/2 bg-gray-200 rounded" />
        <div className="flex gap-1.5 pt-1">
          <Skeleton className="h-5 w-10 rounded-md bg-gray-200" />
          <Skeleton className="h-5 w-10 rounded-md bg-gray-200" />
        </div>
      </div>
    </div>
  );
}
