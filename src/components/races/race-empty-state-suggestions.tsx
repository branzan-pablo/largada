"use client";

import { useEffect, useState } from "react";
import { Lightbulb, Loader2 } from "lucide-react";
import type { RaceFilters } from "@/types/race";

interface SuggestionApply {
  radius?: number | null;
  distances?: string[] | null;
  prizeType?: string[] | null;
  city?: string | null;
  dateFrom?: string | null;
  dateTo?: string | null;
  search?: string | null;
}

interface Suggestion {
  id: string;
  kind: string;
  label: string;
  count: number;
  apply: SuggestionApply;
  priority: number;
}

interface RaceEmptyStateSuggestionsProps {
  filters: RaceFilters;
  search: string;
  onApplyFilters: (next: RaceFilters) => void;
  onApplySearch: (next: string) => void;
}

/**
 * Build the querystring for /api/races/empty-state-suggestions from the same
 * filter shape the listing uses, so suggestions are computed against exactly
 * what the user currently sees.
 */
function buildSuggestionsUrl(filters: RaceFilters, search: string): string {
  const params = new URLSearchParams();
  if (filters.city) params.set("city", filters.city);
  if (filters.dateFrom) params.set("dateFrom", filters.dateFrom);
  if (filters.dateTo) params.set("dateTo", filters.dateTo);
  if (filters.distances?.length)
    params.set("distances", filters.distances.join(","));
  if (filters.prizeType?.length)
    params.set("prizeType", filters.prizeType.join(","));
  if (search) params.set("search", search);
  if (filters.lat != null) params.set("lat", String(filters.lat));
  if (filters.lng != null) params.set("lng", String(filters.lng));
  if (filters.radius != null) params.set("radius", String(filters.radius));
  return `/api/races/empty-state-suggestions?${params.toString()}`;
}

function hasAnyFilter(filters: RaceFilters, search: string): boolean {
  if (search.trim() !== "") return true;
  if (filters.city) return true;
  if (filters.dateFrom) return true;
  if (filters.dateTo) return true;
  if (filters.distances?.length) return true;
  if (filters.prizeType?.length) return true;
  if (filters.radius != null) return true;
  return false;
}

/**
 * Apply a suggestion's mutation to the current filter + search state, using
 * `null` semantics to mean "remove this constraint" (kept separate from
 * `undefined` because the server side maps null explicitly).
 */
function applySuggestion(
  filters: RaceFilters,
  search: string,
  apply: SuggestionApply,
): { filters: RaceFilters; search: string } {
  const next: RaceFilters = { ...filters };
  if (apply.radius !== undefined)
    next.radius = apply.radius == null ? undefined : apply.radius;
  if (apply.distances !== undefined)
    next.distances = apply.distances == null ? undefined : apply.distances;
  if (apply.prizeType !== undefined)
    next.prizeType = apply.prizeType == null ? undefined : apply.prizeType;
  if (apply.city !== undefined)
    next.city = apply.city == null ? undefined : apply.city;
  if (apply.dateFrom !== undefined)
    next.dateFrom = apply.dateFrom == null ? undefined : apply.dateFrom;
  if (apply.dateTo !== undefined)
    next.dateTo = apply.dateTo == null ? undefined : apply.dateTo;
  const nextSearch =
    apply.search !== undefined ? (apply.search == null ? "" : apply.search) : search;
  return { filters: next, search: nextSearch };
}

/**
 * Renders contextual suggestions when the listing has zero results, based on
 * the user's current filters. Skips itself silently when no filters are
 * active (nothing to suggest) so the parent can fall back to the regular
 * "submit a suggestion" copy.
 */
export function RaceEmptyStateSuggestions({
  filters,
  search,
  onApplyFilters,
  onApplySearch,
}: RaceEmptyStateSuggestionsProps) {
  const [suggestions, setSuggestions] = useState<Suggestion[] | null>(null);
  const [loading, setLoading] = useState(false);

  const filtersActive = hasAnyFilter(filters, search);

  useEffect(() => {
    if (!filtersActive) {
      // Reset stale async results when the query no longer needs suggestions.
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setSuggestions(null);
      return;
    }
    let cancelled = false;
    setLoading(true);
    fetch(buildSuggestionsUrl(filters, search))
      .then((r) => (r.ok ? r.json() : { suggestions: [] }))
      .then((json: { suggestions?: Suggestion[] }) => {
        if (!cancelled) setSuggestions(json.suggestions ?? []);
      })
      .catch(() => {
        if (!cancelled) setSuggestions([]);
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [
    filtersActive,
    filters.city,
    filters.dateFrom,
    filters.dateTo,
    filters.radius,
    filters.lat,
    filters.lng,
    filters.distances,
    filters.prizeType,
    search,
  ]);

  if (!filtersActive) return null;

  if (loading && suggestions === null) {
    return (
      <div className="mt-4 flex items-center gap-2 text-sm text-[#6B7280]">
        <Loader2 className="h-3.5 w-3.5 animate-spin" />
        Procurando sugestões...
      </div>
    );
  }

  if (!suggestions || suggestions.length === 0) return null;

  return (
    <div className="mt-5 w-full max-w-md space-y-2">
      <div className="flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wide text-[#6B7280]">
        <Lightbulb className="h-3.5 w-3.5" />
        Sugestões
      </div>
      <ul className="space-y-2">
        {suggestions.map((s) => (
          <li key={s.id}>
            <button
              type="button"
              onClick={() => {
                const next = applySuggestion(filters, search, s.apply);
                onApplyFilters(next.filters);
                onApplySearch(next.search);
              }}
              className="w-full rounded-lg border border-[#FF4D00]/30 bg-white px-3 py-2 text-left text-sm text-[#0D1B2A] transition hover:border-[#FF4D00] hover:bg-[#FF4D00]/5"
            >
              {s.label}
            </button>
          </li>
        ))}
      </ul>
    </div>
  );
}
