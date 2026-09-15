"use client";

import { useState, useEffect, useRef, useCallback, useDeferredValue } from "react";
import { useDebounce } from "@/hooks/use-debounce";
import { useInfiniteRaces, type InitialRaceData } from "@/hooks/use-infinite-races";
import { loadFilterDefaults, saveFilterDefaults } from "@/lib/filter-defaults";
import { RaceCard } from "./race-card";
import { RaceFiltersDesktop } from "./race-filters";
import { RaceFiltersMobile } from "./race-filters-mobile";
import { ActiveFilterChips } from "./active-filter-chips";
import { Skeleton } from "@/components/ui/skeleton";
import { Trophy, ChevronDown, Search, X } from "lucide-react";
import type { RaceFilters } from "@/types/race";

export function RaceList({ initialData }: { initialData?: InitialRaceData }) {
  const [search, setSearch] = useState("");
  const [filters, setFilters] = useState<RaceFilters>({});
  const [hasInitializedFilters, setHasInitializedFilters] = useState(false);

  useEffect(() => {
    if (hasInitializedFilters) return;
    const stored = loadFilterDefaults();
    if (stored) {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setFilters(stored);
    }
    setHasInitializedFilters(true);
  }, [hasInitializedFilters]);

  // Persist the sticky slice of filters whenever the user changes them.
  // Gated by hasInitializedFilters so the empty initial state never wipes a
  // previously stored preference during the brief window before init runs.
  useEffect(() => {
    if (!hasInitializedFilters) return;
    saveFilterDefaults(filters);
  }, [
    hasInitializedFilters,
    filters.city,
    filters.dateFrom,
    filters.dateTo,
    filters.distances,
    filters.prizeType,
    filters,
  ]);
  const [availableDistances, setAvailableDistances] = useState<string[]>([]);

  useEffect(() => {
    fetch("/api/races/distances")
      .then(async (response) => {
        if (!response.ok) return [];
        const data: unknown = await response.json();
        return Array.isArray(data)
          ? data.filter((distance): distance is string => typeof distance === "string")
          : [];
      })
      .then(setAvailableDistances)
      .catch(() => {
        /* silently fall back to defaults in filter components */
      });
  }, []);
  const debouncedSearch = useDebounce(search, 150);
  const deferredSearch = useDeferredValue(debouncedSearch);

  const { races, totalCount, isLoading, isLoadingMore, hasMore, restoredFromCache, loadMore, sentinelRef } =
    useInfiniteRaces(filters, deferredSearch, initialData);

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

  return (
    <>
      <section className="relative mb-5 overflow-hidden rounded-[1.5rem] bg-[#0D1B2A] px-5 py-5 text-white shadow-[0_22px_55px_-35px_rgba(13,27,42,0.85)] md:mb-8 md:rounded-[1.75rem] md:px-9 md:py-9">
        <div className="pointer-events-none absolute inset-y-0 right-0 hidden w-[42%] opacity-20 md:block" aria-hidden="true">
          <div className="absolute -right-10 top-1/2 h-px w-full -rotate-12 bg-white" />
          <div className="absolute -right-6 top-[60%] h-px w-full -rotate-12 bg-white" />
          <div className="absolute -right-2 top-[70%] h-px w-full -rotate-12 bg-[#FF4D00]" />
        </div>
        <div className="relative flex flex-col justify-between gap-6 md:flex-row md:items-end">
          <div>
            <p className="mb-2.5 flex items-center gap-2 text-[0.64rem] font-bold uppercase tracking-[0.2em] text-[#FF7A40] md:mb-3 md:text-[0.68rem] md:tracking-[0.22em]">
              <span className="h-0.5 w-8 bg-[#FF4D00]" aria-hidden="true" />
              Próximas largadas
            </p>
            <h1 className="max-w-2xl text-[1.75rem] font-extrabold leading-[1.05] tracking-[-0.035em] text-white min-[360px]:text-3xl md:text-5xl">
              Calendário de corridas
            </h1>
            <p className="mt-2.5 max-w-xl text-sm leading-relaxed text-slate-300 md:mt-3 md:text-base">
              Encontre sua próxima prova por cidade, data, distância e premiação.
            </p>
          </div>

          {!isLoading && races.length > 0 && (
            <div className="flex w-fit items-center gap-2 rounded-full border border-white/15 bg-white/10 px-3.5 py-2 backdrop-blur-sm" role="status" aria-live="polite">
            <span className="relative flex h-2 w-2">
              <span className="motion-safe:animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-500 opacity-75" />
              <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500" />
            </span>
            <span className="text-xs font-semibold text-white">
              {totalCount !== null ? totalCount : hasMore ? `${races.length}+` : races.length} provas abertas
            </span>
          </div>
          )}
        </div>
        <div className="absolute inset-x-0 bottom-0 h-1 bg-[#FF4D00]" aria-hidden="true" />
      </section>

      {/* Mobile: search bar + filter button (same row) */}
      <div className="mb-1 flex items-center gap-2 lg:hidden">
        <div className="relative group flex-1">
          <Search className="pointer-events-none absolute left-3.5 top-1/2 h-5 w-5 -translate-y-1/2 text-slate-400 transition-colors group-focus-within:text-[#FF4D00]" aria-hidden="true" />
          <label htmlFor="mobile-race-search" className="sr-only">Buscar corridas</label>
          <input
            id="mobile-race-search"
            type="search"
            placeholder="Nome ou cidade"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="h-12 w-full rounded-xl border border-slate-300 bg-white pl-10 pr-9 text-sm font-semibold text-[#0D1B2A] shadow-sm outline-none transition-colors placeholder:font-medium placeholder:text-slate-400 focus:border-[#FF4D00] focus:ring-2 focus:ring-[#FF4D00]/20"
          />
          {search && (
            <button
              onClick={() => setSearch("")}
              type="button"
              className="absolute right-2.5 top-1/2 -translate-y-1/2 rounded-full p-1 text-slate-400 transition-colors hover:bg-slate-100 hover:text-slate-900 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#FF4D00]"
              aria-label="Limpar busca"
            >
              <X className="h-3.5 w-3.5" />
            </button>
          )}
        </div>
        <RaceFiltersMobile
          filters={filters}
          onFiltersChange={setFilters}
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

      <ActiveFilterChips filters={filters} onChange={setFilters} onClear={() => setFilters({})} />

      {/* Race grid */}
      <div className="mt-5">
        {isLoading ? (
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {Array.from({ length: 6 }).map((_, i) => (
              <RaceCardSkeleton key={i} />
            ))}
          </div>
        ) : races.length === 0 ? (
          <div className="flex flex-col items-center justify-center rounded-2xl border border-slate-200 bg-white px-5 py-10 text-center md:py-14">
            <Trophy className="mb-3 h-10 w-10 text-slate-300 md:h-12 md:w-12" />
            <h3 className="text-lg font-semibold text-[#0D1B2A]">
              Nenhuma corrida encontrada com esses filtros.
            </h3>
            <p className="mt-1 text-sm text-[#6B7280]">
              Remova um filtro ou tente uma busca mais ampla.
            </p>
          </div>
        ) : (
          <>
            <div className="mb-3 flex items-center justify-between">
              <h2 className="text-xs font-bold uppercase tracking-[0.16em] text-slate-500">
                Provas encontradas
              </h2>
              <span className="text-xs tabular-nums text-slate-500">
                Exibindo {races.length}{totalCount !== null ? ` de ${totalCount}` : ""}
              </span>
            </div>
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {races.map((race, i) => (
                <RaceCard key={race.id} race={race} priority={i < 2} />
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
    <div className="rounded-2xl border border-slate-200 bg-white p-2.5 shadow-sm">
      <Skeleton className="aspect-video w-full rounded-xl bg-gray-200" />
      <div className="space-y-2 px-1 pb-2 pt-3">
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
