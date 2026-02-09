"use client";

import { useState, useCallback, useEffect, useRef } from "react";
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

  const buildUrl = useCallback(
    (pageNum: number) => {
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
      if (debouncedSearch) params.set("search", debouncedSearch);
      if (filters.lat) params.set("lat", String(filters.lat));
      if (filters.lng) params.set("lng", String(filters.lng));
      if (filters.radius) params.set("radius", String(filters.radius));

      return `/api/races?${params.toString()}`;
    },
    [filters, debouncedSearch]
  );

  // Reset on filter change
  useEffect(() => {
    setPage(1);
    setHasMore(true);
    setIsLoading(true);

    const fetchInitial = async () => {
      try {
        const res = await fetch(buildUrl(1));
        const json = await res.json();
        setRaces(json.data ?? []);
        setHasMore(json.hasMore ?? false);
      } catch {
        setRaces([]);
      } finally {
        setIsLoading(false);
      }
    };

    fetchInitial();
  }, [buildUrl]);

  const loadMore = useCallback(async () => {
    if (isLoadingMore || !hasMore) return;
    setIsLoadingMore(true);

    const nextPage = page + 1;
    try {
      const res = await fetch(buildUrl(nextPage));
      const json = await res.json();
      setRaces((prev) => [...prev, ...(json.data ?? [])]);
      setHasMore(json.hasMore ?? false);
      setPage(nextPage);
    } catch {
      // ignore
    } finally {
      setIsLoadingMore(false);
    }
  }, [page, hasMore, isLoadingMore, buildUrl]);

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
