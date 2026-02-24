"use client";

import { useState } from "react";
import { useAuth } from "@/contexts/auth-context";
import { useDebounce } from "@/hooks/use-debounce";
import { useInfiniteRaces } from "@/hooks/use-infinite-races";
import { RaceCard } from "./race-card";
import { RaceFiltersDesktop } from "./race-filters";
import { RaceFiltersMobile } from "./race-filters-mobile";
import { Skeleton } from "@/components/ui/skeleton";
import { Trophy, ChevronDown } from "lucide-react";
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
      <div className="mb-8 flex flex-col md:flex-row md:items-end justify-between gap-6">
        <div className="space-y-2">
          <h1 className="text-3xl md:text-4xl font-semibold text-[#0D1B2A] tracking-tight">
            Calendário de Corridas
          </h1>
          <p className="text-[#6B7280] text-lg">
            Filtre por cidade, distância e premiação. Marque &quot;Vou Nessa&quot; e veja quem da sua rede vai correr.
          </p>
        </div>

        {!isLoading && races.length > 0 && (
          <div className="flex items-center gap-2 px-3 py-1.5 rounded-full border border-gray-200 bg-gray-50 shrink-0 self-start md:self-center">
            <span className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-500 opacity-75" />
              <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500" />
            </span>
            <span className="text-xs font-medium text-[#6B7280]">
              {races.length} provas abertas
            </span>
          </div>
        )}
      </div>

      {/* Mobile: search + filter button */}
      <div className="mb-4 flex justify-end gap-3 md:hidden">
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
              <a href="/sugerir" className="text-[#FF4D00] hover:text-[#E04400] underline underline-offset-2 transition-colors">
                Sugerir corrida
              </a>
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
    </div>
  );
}

function RaceCardSkeleton() {
  return (
    <div>
      <Skeleton className="aspect-[16/9] w-full rounded-xl bg-gray-200" />
      <div className="pt-3 space-y-2">
        <Skeleton className="h-4 w-full bg-gray-200 rounded" />
        <Skeleton className="h-4 w-3/4 bg-gray-200 rounded" />
        <Skeleton className="h-3 w-1/2 bg-gray-200 rounded" />
        <div className="flex gap-1.5 pt-1">
          <Skeleton className="h-5 w-10 rounded-md bg-gray-200" />
          <Skeleton className="h-5 w-10 rounded-md bg-gray-200" />
        </div>
      </div>
    </div>
  );
}
