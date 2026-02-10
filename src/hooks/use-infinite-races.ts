"use client";

import { useState, useCallback, useEffect, useRef, useMemo } from "react";
import type { Race, RaceFilters } from "@/types/race";
import { ITEMS_PER_PAGE } from "@/lib/constants";

interface UseInfiniteRacesResult {
  races: Race[];
  isLoading: boolean;
  isLoadingMore: boolean;
  hasMore: boolean;
  loadMore: () => void;
  sentinelRef: (node: HTMLDivElement | null) => void;
}

function buildUrl(filters: RaceFilters, search: string, pageNum: number) {
  const params = new URLSearchParams();
  params.set("page", String(pageNum));
  params.set("limit", String(ITEMS_PER_PAGE));

  if (filters.city) params.set("city", filters.city);
  if (filters.dateFrom) params.set("dateFrom", filters.dateFrom);
  if (filters.dateTo) params.set("dateTo", filters.dateTo);
  if (filters.distances?.length)
    params.set("distances", filters.distances.join(","));
  if (filters.prizeType?.length)
    params.set("prizeType", filters.prizeType.join(","));
  if (search) params.set("search", search);
  if (filters.lat) params.set("lat", String(filters.lat));
  if (filters.lng) params.set("lng", String(filters.lng));
  if (filters.radius) params.set("radius", String(filters.radius));

  return `/api/races?${params.toString()}`;
}

export function useInfiniteRaces(
  filters: RaceFilters,
  debouncedSearch: string
): UseInfiniteRacesResult {
  const [races, setRaces] = useState<Race[]>([]);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);
  const [isLoading, setIsLoading] = useState(true);
  const [isLoadingMore, setIsLoadingMore] = useState(false);
  const observerRef = useRef<IntersectionObserver | null>(null);

  // Stable serialized key that only changes when filter values actually change
  const filterKey = useMemo(
    () =>
      JSON.stringify({
        city: filters.city,
        dateFrom: filters.dateFrom,
        dateTo: filters.dateTo,
        distances: filters.distances,
        prizeType: filters.prizeType,
        lat: filters.lat,
        lng: filters.lng,
        radius: filters.radius,
        search: debouncedSearch,
      }),
    [filters.city, filters.dateFrom, filters.dateTo, filters.distances, filters.prizeType, filters.lat, filters.lng, filters.radius, debouncedSearch]
  );

  // Keep a ref to filters so the effect closure always reads the latest
  const filtersRef = useRef(filters);
  const searchRef = useRef(debouncedSearch);
  filtersRef.current = filters;
  searchRef.current = debouncedSearch;

  // Reset and fetch on filter change
  useEffect(() => {
    let cancelled = false;

    setPage(1);
    setHasMore(true);
    setIsLoading(true);

    const fetchInitial = async () => {
      try {
        const res = await fetch(buildUrl(filtersRef.current, searchRef.current, 1));
        const json = await res.json();
        if (!cancelled) {
          setRaces(json.data ?? []);
          setHasMore(json.hasMore ?? false);
        }
      } catch {
        if (!cancelled) setRaces([]);
      } finally {
        if (!cancelled) setIsLoading(false);
      }
    };

    fetchInitial();

    return () => {
      cancelled = true;
    };
  }, [filterKey]);

  const loadMore = useCallback(async () => {
    if (isLoadingMore || !hasMore) return;
    setIsLoadingMore(true);

    const nextPage = page + 1;
    try {
      const res = await fetch(buildUrl(filtersRef.current, searchRef.current, nextPage));
      const json = await res.json();
      setRaces((prev) => [...prev, ...(json.data ?? [])]);
      setHasMore(json.hasMore ?? false);
      setPage(nextPage);
    } catch {
      // ignore
    } finally {
      setIsLoadingMore(false);
    }
  }, [page, hasMore, isLoadingMore]);

  const sentinelRef = useCallback(
    (node: HTMLDivElement | null) => {
      if (observerRef.current) observerRef.current.disconnect();
      if (!node) return;

      observerRef.current = new IntersectionObserver(
        (entries) => {
          if (entries[0].isIntersecting && hasMore && !isLoadingMore) {
            loadMore();
          }
        },
        { rootMargin: "200px" }
      );

      observerRef.current.observe(node);
    },
    [hasMore, isLoadingMore, loadMore]
  );

  return { races, isLoading, isLoadingMore, hasMore, loadMore, sentinelRef };
}
