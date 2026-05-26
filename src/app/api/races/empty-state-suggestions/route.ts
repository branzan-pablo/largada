import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { todayInBrazil } from "@/lib/date";
import { haversineDistance } from "@/lib/geo";
import {
  buildSuggestionLabel,
  nextRadiusStep,
  rankSuggestions,
  type Suggestion,
} from "@/lib/empty-state-suggestions";

interface FilterSet {
  city?: string;
  dateFrom?: string;
  dateTo?: string;
  distances?: string[];
  prizeType?: string[];
  search?: string;
  lat?: number;
  lng?: number;
  radius?: number;
}

type RaceRow = {
  id: string;
  distances: string[];
  latitude: number | null;
  longitude: number | null;
  is_promoted: boolean;
  cities?: { latitude: number | null; longitude: number | null } | null;
};

const MAX_BASE_ROWS = 500;

/**
 * Counts how many races match a given filter set, mirroring the same logic
 * /api/races uses (server-side filters in SQL plus a JS-side radius pass).
 * Anonymous-safe because the races table has a public read RLS policy.
 */
async function countWithFilters(
  filters: FilterSet,
  today: string,
): Promise<number> {
  const supabase = await createClient();

  let query = supabase
    .from("races")
    .select("id, distances, latitude, longitude, is_promoted, cities(latitude, longitude)")
    .eq("status", "confirmed")
    .gte("date", today)
    .or(`registration_deadline.gte.${today},is_promoted.eq.true`);

  if (filters.city) query = query.eq("city", filters.city);
  if (filters.dateFrom) query = query.gte("date", filters.dateFrom);
  if (filters.dateTo) query = query.lte("date", filters.dateTo);

  if (filters.prizeType && filters.prizeType.length > 0) {
    const types = [...filters.prizeType];
    if (types.includes("money") && !types.includes("both")) types.push("both");
    if (types.includes("trophy") && !types.includes("both")) types.push("both");
    query = query.in("prize_type", types);
  }

  if (filters.distances && filters.distances.length > 0) {
    query = query.overlaps("distances", filters.distances);
  }

  if (filters.search) {
    const sanitized = filters.search.replace(/[%_\\]/g, "\\$&");
    query = query.or(
      `name.ilike.%${sanitized}%,city.ilike.%${sanitized}%,organizer.ilike.%${sanitized}%`,
    );
  }

  query = query.limit(MAX_BASE_ROWS);

  const { data, error } = await query;
  if (error || !data) return 0;

  const rows = data as unknown as RaceRow[];

  if (
    filters.lat != null &&
    filters.lng != null &&
    filters.radius != null
  ) {
    const userLat = filters.lat;
    const userLng = filters.lng;
    const maxRadius = filters.radius;
    return rows.filter((race) => {
      if (race.is_promoted) return true;
      const raceLat = race.latitude || race.cities?.latitude || 0;
      const raceLng = race.longitude || race.cities?.longitude || 0;
      if (raceLat === 0 && raceLng === 0) return true;
      return haversineDistance(userLat, userLng, raceLat, raceLng) <= maxRadius;
    }).length;
  }

  return rows.length;
}

function parseDistances(raw: string | null): string[] | undefined {
  if (!raw) return undefined;
  const parts = raw
    .split(",")
    .map((p) => p.trim().toLowerCase())
    .filter(Boolean);
  return parts.length > 0 ? parts : undefined;
}

function parsePrizeTypes(raw: string | null): string[] | undefined {
  if (!raw) return undefined;
  const parts = raw
    .split(",")
    .map((p) => p.trim().toLowerCase())
    .filter(Boolean);
  return parts.length > 0 ? parts : undefined;
}

function parseNumber(raw: string | null): number | undefined {
  if (!raw) return undefined;
  const n = parseFloat(raw);
  return Number.isFinite(n) ? n : undefined;
}

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const today = todayInBrazil();

  const currentFilters: FilterSet = {
    city: searchParams.get("city") || undefined,
    dateFrom: searchParams.get("dateFrom") || undefined,
    dateTo: searchParams.get("dateTo") || undefined,
    distances: parseDistances(searchParams.get("distances")),
    prizeType: parsePrizeTypes(searchParams.get("prizeType")),
    search: searchParams.get("search") || undefined,
    lat: parseNumber(searchParams.get("lat")),
    lng: parseNumber(searchParams.get("lng")),
    radius: parseNumber(searchParams.get("radius")),
  };

  const candidates: Suggestion[] = [];
  const queries: Promise<void>[] = [];

  // 1. Expand radius (or drop it) when there's a geo filter active.
  if (currentFilters.radius != null && currentFilters.lat != null && currentFilters.lng != null) {
    const target = nextRadiusStep(currentFilters.radius);
    if (target != null) {
      queries.push(
        countWithFilters({ ...currentFilters, radius: target }, today).then((count) => {
          candidates.push({
            id: `expand_radius_${target}`,
            kind: "expand_radius",
            count,
            apply: { radius: target },
            priority: 10,
            label: buildSuggestionLabel("expand_radius", count, {
              currentRadius: currentFilters.radius,
              targetRadius: target,
            }),
          });
        }),
      );
    }
    queries.push(
      countWithFilters({ ...currentFilters, radius: undefined }, today).then((count) => {
        candidates.push({
          id: "drop_radius",
          kind: "drop_radius",
          count,
          apply: { radius: null },
          priority: 20,
          label: buildSuggestionLabel("drop_radius", count, {}),
        });
      }),
    );
  }

  // 2. Drop the distance filter.
  if (currentFilters.distances && currentFilters.distances.length > 0) {
    queries.push(
      countWithFilters({ ...currentFilters, distances: undefined }, today).then((count) => {
        candidates.push({
          id: "drop_distance",
          kind: "drop_distance",
          count,
          apply: { distances: null },
          priority: 30,
          label: buildSuggestionLabel("drop_distance", count, {
            currentDistances: currentFilters.distances,
          }),
        });
      }),
    );
  }

  // 3. Drop the prize-type filter.
  if (currentFilters.prizeType && currentFilters.prizeType.length > 0) {
    queries.push(
      countWithFilters({ ...currentFilters, prizeType: undefined }, today).then((count) => {
        candidates.push({
          id: "drop_prize_type",
          kind: "drop_prize_type",
          count,
          apply: { prizeType: null },
          priority: 40,
          label: buildSuggestionLabel("drop_prize_type", count, {}),
        });
      }),
    );
  }

  // 4. Drop the city filter.
  if (currentFilters.city) {
    queries.push(
      countWithFilters({ ...currentFilters, city: undefined }, today).then((count) => {
        candidates.push({
          id: "drop_city",
          kind: "drop_city",
          count,
          apply: { city: null },
          priority: 50,
          label: buildSuggestionLabel("drop_city", count, {
            currentCity: currentFilters.city,
          }),
        });
      }),
    );
  }

  // 5. Clear the free-text search.
  if (currentFilters.search) {
    queries.push(
      countWithFilters({ ...currentFilters, search: undefined }, today).then((count) => {
        candidates.push({
          id: "clear_search",
          kind: "clear_search",
          count,
          apply: { search: null },
          priority: 60,
          label: buildSuggestionLabel("clear_search", count, {}),
        });
      }),
    );
  }

  await Promise.all(queries);
  const suggestions = rankSuggestions(candidates, 3);

  const response = NextResponse.json({ suggestions });
  response.headers.set("Cache-Control", "private, max-age=30");
  return response;
}
