"use client";

import { useState } from "react";
import { useAuth } from "@/contexts/auth-context";
import { useDebounce } from "@/hooks/use-debounce";
import { useInfiniteRaces } from "@/hooks/use-infinite-races";
import { RaceCard } from "./race-card";
import { RaceFiltersDesktop } from "./race-filters";
import { RaceFiltersMobile } from "./race-filters-mobile";
import { Skeleton } from "@/components/ui/skeleton";
import { Trophy, ChevronDown, Search } from "lucide-react";
import type { RaceFilters } from "@/types/race";

export function RaceList() {
  const { profile } = useAuth();
  const [search, setSearch] = useState("");
  const [filters, setFilters] = useState<RaceFilters>({});
  const debouncedSearch = useDebounce(search, 300);

  // If radius filter is active and user has coordinates, pass them
  const enrichedFilters: RaceFilters = {
    ...filters,
    ...(filters.radius && profile?.latitude && profile?.longitude
      ? { lat: profile.latitude, lng: profile.longitude }
      : {}),
  };

  const { races, isLoading, isLoadingMore, hasMore, loadMore, sentinelRef } =
    useInfiniteRaces(enrichedFilters, debouncedSearch);

  return (
    <div className="mx-auto max-w-7xl px-4 py-8 md:py-12">
      {/* Page Header */}
      <div className="mb-10 flex flex-col md:flex-row md:items-end justify-between gap-6">
        <div className="space-y-2">
          <h1 className="text-3xl md:text-4xl font-semibold text-white tracking-tight">
            Calendário de Corridas
          </h1>
          <p className="text-zinc-500 max-w-xl text-lg">
            Encontre e inscreva-se nas principais provas de rua da região. Filtre por
            distância, cidade ou premiação.
          </p>
        </div>

        {!isLoading && races.length > 0 && (
          <div className="flex items-center gap-2 px-3 py-1.5 rounded-full border border-zinc-800 bg-zinc-900/50 shrink-0 self-start md:self-center">
            <span className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-500 opacity-75" />
              <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500" />
            </span>
            <span className="text-xs font-medium text-zinc-400">
              {races.length} provas abertas
            </span>
          </div>
        )}
      </div>

      {/* Mobile: search + filter button */}
      <div className="mb-4 flex items-start gap-3 md:hidden">
        <div className="relative flex-1 group">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-zinc-500 group-focus-within:text-zinc-300" />
          <input
            type="text"
            placeholder="Buscar por nome, cidade..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full bg-zinc-900/50 border border-zinc-800 text-sm text-white rounded-lg pl-10 pr-4 py-2.5 focus:outline-none focus:border-zinc-600 placeholder:text-zinc-600 transition-colors"
          />
        </div>
        <RaceFiltersMobile
          filters={filters}
          onFiltersChange={setFilters}
          search={search}
          onSearchChange={setSearch}
        />
      </div>

      {/* Desktop filters */}
      <RaceFiltersDesktop
        filters={filters}
        onFiltersChange={setFilters}
        search={search}
        onSearchChange={setSearch}
      />

      {/* Race grid */}
      <div className="mt-6">
        {isLoading ? (
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {Array.from({ length: 6 }).map((_, i) => (
              <RaceCardSkeleton key={i} />
            ))}
          </div>
        ) : races.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16 text-center rounded-lg border border-zinc-800 bg-zinc-900/50">
            <Trophy className="mb-4 h-12 w-12 text-zinc-700" />
            <h3 className="text-lg font-semibold text-white">
              Nenhuma corrida encontrada
            </h3>
            <p className="mt-1 text-sm text-zinc-500">
              Tente ajustar os filtros ou a busca.
            </p>
          </div>
        ) : (
          <>
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {races.map((race) => (
                <RaceCard key={race.id} race={race} />
              ))}
            </div>

            {/* Load more button + infinite scroll sentinel */}
            {hasMore && (
              <div ref={sentinelRef} className="flex justify-center pt-10 pb-4">
                <button
                  onClick={loadMore}
                  disabled={isLoadingMore}
                  className="flex items-center gap-2 px-6 py-3 rounded-full bg-zinc-800/80 border border-zinc-700 text-sm font-medium text-zinc-200 hover:bg-zinc-700 hover:text-white transition-colors disabled:opacity-50"
                >
                  {isLoadingMore ? (
                    <>
                      <div className="h-4 w-4 animate-spin rounded-full border-2 border-zinc-400 border-t-transparent" />
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
    </div>
  );
}

function RaceCardSkeleton() {
  return (
    <div className="rounded-xl border border-zinc-800 bg-zinc-900/30 p-5 space-y-3">
      <div className="flex gap-2">
        <Skeleton className="h-6 w-16 rounded-md bg-zinc-800" />
        <Skeleton className="h-6 w-16 rounded-md bg-zinc-800" />
      </div>
      <Skeleton className="h-5 w-3/4 bg-zinc-800" />
      <Skeleton className="h-4 w-1/2 bg-zinc-800" />
      <div className="flex gap-1.5">
        <Skeleton className="h-5 w-10 rounded-md bg-zinc-800" />
        <Skeleton className="h-5 w-10 rounded-md bg-zinc-800" />
      </div>
      <div className="flex justify-between pt-3 border-t border-zinc-800/50">
        <Skeleton className="h-4 w-24 bg-zinc-800" />
        <Skeleton className="h-4 w-16 bg-zinc-800" />
      </div>
    </div>
  );
}
