import type { RaceFilters } from "@/types/race";

/**
 * Keys persisted to localStorage as "sticky" filters that survive across
 * visits. We keep the list conservative on purpose:
 *  - city, distances, prizeType, radius reflect the runner's profile (where
 *    they live, what distance they run, whether they chase prizes), and are
 *    safe to restore.
 *  - dateFrom / dateTo are temporal ("este mês"), not preferences.
 *  - search is per-query intent.
 *  - semantic is per-query intent.
 *  - lat / lng / page / limit are computed from other state.
 */
const STICKY_KEYS = ["city", "distances", "prizeType", "radius"] as const;

type StickyKey = (typeof STICKY_KEYS)[number];

export const FILTER_DEFAULTS_STORAGE_KEY = "race-filter-defaults";

export interface FilterDefaults {
  city?: string;
  distances?: string[];
  prizeType?: string[];
  radius?: number;
}

/**
 * True when every sticky field is empty/absent. Used to decide whether to
 * clear localStorage instead of persisting an empty object.
 */
export function isFilterDefaultsEmpty(defaults: FilterDefaults): boolean {
  if (defaults.city) return false;
  if (defaults.distances && defaults.distances.length > 0) return false;
  if (defaults.prizeType && defaults.prizeType.length > 0) return false;
  if (defaults.radius != null) return false;
  return true;
}

/**
 * Slice the sticky subset from a RaceFilters object so we never persist
 * temporal or per-query state by accident.
 */
export function pickStickyFilters(filters: RaceFilters): FilterDefaults {
  const out: FilterDefaults = {};
  if (filters.city) out.city = filters.city;
  if (filters.distances && filters.distances.length > 0)
    out.distances = [...filters.distances];
  if (filters.prizeType && filters.prizeType.length > 0)
    out.prizeType = [...filters.prizeType];
  if (filters.radius != null) out.radius = filters.radius;
  return out;
}

/**
 * Sanitize a parsed JSON payload into a FilterDefaults, dropping any field
 * that is not on the sticky allow-list or has the wrong type. Returns null
 * when the payload is unusable so callers fall through to the profile
 * defaults path.
 */
export function sanitizeFilterDefaults(raw: unknown): FilterDefaults | null {
  if (!raw || typeof raw !== "object") return null;
  const record = raw as Record<string, unknown>;
  const out: FilterDefaults = {};

  if (typeof record.city === "string" && record.city.trim().length > 0) {
    out.city = record.city;
  }
  if (Array.isArray(record.distances)) {
    const distances = record.distances.filter(
      (d): d is string => typeof d === "string" && d.length > 0,
    );
    if (distances.length > 0) out.distances = distances;
  }
  if (Array.isArray(record.prizeType)) {
    const prizes = record.prizeType.filter(
      (p): p is string => typeof p === "string" && p.length > 0,
    );
    if (prizes.length > 0) out.prizeType = prizes;
  }
  if (typeof record.radius === "number" && Number.isFinite(record.radius) && record.radius > 0) {
    out.radius = record.radius;
  }

  // Reject the payload outright when no recognized field survived sanitation.
  // Callers expect null to mean "no usable defaults, fall through".
  for (const key of STICKY_KEYS as readonly StickyKey[]) {
    if (out[key] !== undefined) return out;
  }
  return null;
}

/**
 * Read filter defaults from localStorage. Returns null when not available
 * (SSR, no entry, malformed JSON, unusable payload). Safe to call from
 * client components.
 */
export function loadFilterDefaults(): FilterDefaults | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = window.localStorage.getItem(FILTER_DEFAULTS_STORAGE_KEY);
    if (!raw) return null;
    return sanitizeFilterDefaults(JSON.parse(raw));
  } catch {
    return null;
  }
}

/**
 * Persist the sticky slice of `filters` to localStorage, or clear the entry
 * when there is nothing to remember.
 */
export function saveFilterDefaults(filters: RaceFilters): void {
  if (typeof window === "undefined") return;
  const sticky = pickStickyFilters(filters);
  try {
    if (isFilterDefaultsEmpty(sticky)) {
      window.localStorage.removeItem(FILTER_DEFAULTS_STORAGE_KEY);
    } else {
      window.localStorage.setItem(
        FILTER_DEFAULTS_STORAGE_KEY,
        JSON.stringify(sticky),
      );
    }
  } catch {
    // Storage quota or privacy mode — ignore. The feature is best-effort.
  }
}

/**
 * Decide which set of initial filters to apply when the page first mounts.
 * Order of preference:
 *  1. Persisted localStorage defaults (most specific to the user).
 *  2. Profile-derived radius preference (when the user has set notification
 *     radius and we have geo).
 *  3. Empty.
 *
 * Pure for testability: pass in whatever each environment supplies.
 */
export function resolveInitialFilters(
  storedDefaults: FilterDefaults | null,
  profile: {
    notification_radius_km?: number | null;
    latitude?: number | null;
    longitude?: number | null;
  } | null,
): RaceFilters {
  if (storedDefaults) return { ...storedDefaults };
  if (
    profile?.notification_radius_km &&
    profile.latitude &&
    profile.longitude
  ) {
    return { radius: profile.notification_radius_km };
  }
  return {};
}
