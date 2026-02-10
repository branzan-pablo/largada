"use client";

import { useState } from "react";
import { useAuth } from "@/contexts/auth-context";
import { useDebounce } from "@/hooks/use-debounce";
import { useInfiniteRaces } from "@/hooks/use-infinite-races";
import { RaceCard } from "./race-card";
import { RaceSearch } from "./race-search";
import { RaceFiltersDesktop } from "./race-filters";
import { RaceFiltersMobile } from "./race-filters-mobile";
import { Skeleton } from "@/components/ui/skeleton";
import { Trophy } from "lucide-react";
import type { RaceFilters } from "@/types/race";

export function RaceList() {
  const { user, profile } = useAuth();
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

  const { races, isLoading, isLoadingMore, hasMore, sentinelRef } =
    useInfiniteRaces(enrichedFilters, debouncedSearch);

  return (
    <div className="mx-auto max-w-screen-xl px-4 py-6">
      <div className="mb-6 space-y-4">
        <h1 className="text-2xl font-bold md:text-3xl">Corridas</h1>
        <div className="flex items-start gap-3">
          <div className="flex-1">
            <RaceSearch value={search} onChange={setSearch} />
          </div>
          <RaceFiltersMobile
            filters={filters}
            onFiltersChange={setFilters}
            isLoggedIn={!!user}
          />
        </div>
      </div>

      <div className="flex gap-6">
        {/* Desktop filters sidebar */}
        <aside className="hidden w-64 shrink-0 md:block">
          <RaceFiltersDesktop
            filters={filters}
            onFiltersChange={setFilters}
            isLoggedIn={!!user}
          />
        </aside>

        {/* Race grid */}
        <div className="flex-1">
          {isLoading ? (
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {Array.from({ length: 6 }).map((_, i) => (
                <RaceCardSkeleton key={i} />
              ))}
            </div>
          ) : races.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-16 text-center">
              <Trophy className="mb-4 h-12 w-12 text-muted-foreground/50" />
              <h3 className="text-lg font-semibold">
                Nenhuma corrida encontrada
              </h3>
              <p className="mt-1 text-sm text-muted-foreground">
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

              {/* Infinite scroll sentinel */}
              {hasMore && (
                <div ref={sentinelRef} className="py-8">
                  {isLoadingMore && (
                    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                      {Array.from({ length: 3 }).map((_, i) => (
                        <RaceCardSkeleton key={i} />
                      ))}
                    </div>
                  )}
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
}

function RaceCardSkeleton() {
  return (
    <div className="rounded-lg border p-4 space-y-3">
      <Skeleton className="h-5 w-3/4" />
      <div className="flex gap-3">
        <Skeleton className="h-4 w-24" />
        <Skeleton className="h-4 w-20" />
      </div>
      <div className="flex gap-1">
        <Skeleton className="h-5 w-10 rounded-full" />
        <Skeleton className="h-5 w-10 rounded-full" />
      </div>
      <div className="flex justify-between">
        <Skeleton className="h-5 w-16 rounded-full" />
        <Skeleton className="h-4 w-8" />
      </div>
    </div>
  );
}
