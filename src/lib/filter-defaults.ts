import type { RaceFilters } from "@/types/race";

const STORAGE_KEY = "race-filter-defaults";

export interface FilterDefaults {
  city?: string;
  dateFrom?: string;
  dateTo?: string;
  distances?: string[];
  prizeType?: string[];
}

function normalize(value: unknown): FilterDefaults | null {
  if (!value || typeof value !== "object" || Array.isArray(value)) return null;
  const record = value as Record<string, unknown>;
  const result: FilterDefaults = {};
  if (typeof record.city === "string" && record.city.trim()) result.city = record.city.trim();
  if (typeof record.dateFrom === "string" && /^\d{4}-\d{2}-\d{2}$/.test(record.dateFrom)) result.dateFrom = record.dateFrom;
  if (typeof record.dateTo === "string" && /^\d{4}-\d{2}-\d{2}$/.test(record.dateTo)) result.dateTo = record.dateTo;
  if (Array.isArray(record.distances)) {
    const distances = record.distances.filter((item): item is string => typeof item === "string");
    if (distances.length) result.distances = distances;
  }
  if (Array.isArray(record.prizeType)) {
    const prizeType = record.prizeType.filter((item): item is string => typeof item === "string");
    if (prizeType.length) result.prizeType = prizeType;
  }
  return Object.keys(result).length ? result : null;
}

export function loadFilterDefaults(): FilterDefaults | null {
  try {
    return normalize(JSON.parse(localStorage.getItem(STORAGE_KEY) ?? "null"));
  } catch {
    return null;
  }
}

export function saveFilterDefaults(filters: RaceFilters): void {
  try {
    const defaults = normalize({
      city: filters.city,
      dateFrom: filters.dateFrom,
      dateTo: filters.dateTo,
      distances: filters.distances,
      prizeType: filters.prizeType,
    });
    if (defaults) localStorage.setItem(STORAGE_KEY, JSON.stringify(defaults));
    else localStorage.removeItem(STORAGE_KEY);
  } catch {
    // Storage can be unavailable in private browsing modes.
  }
}
