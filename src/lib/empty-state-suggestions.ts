/**
 * Empty-state suggestion engine. Pure helpers used by the
 * /api/races/empty-state-suggestions endpoint to turn raw counterfactual
 * counts into ranked, user-friendly suggestions for the listing's empty
 * state. Keeping the logic pure makes it testable in isolation.
 */

export type SuggestionKind =
  | "expand_radius"
  | "drop_radius"
  | "drop_distance"
  | "swap_distance"
  | "drop_prize_type"
  | "drop_city"
  | "extend_date_range"
  | "clear_search";

export interface SuggestionApply {
  radius?: number | null;
  distances?: string[] | null;
  prizeType?: string[] | null;
  city?: string | null;
  dateFrom?: string | null;
  dateTo?: string | null;
  search?: string | null;
}

export interface Suggestion {
  id: string;
  kind: SuggestionKind;
  label: string;
  count: number;
  apply: SuggestionApply;
  priority: number;
}

/**
 * Pick the next reasonable radius to suggest when the current one returned
 * zero races. Returns null when the user is already at or above the cap.
 *
 * The ladder follows the slider values used in the filter UI so the suggested
 * radius matches a value the user can already see / pick later.
 */
export function nextRadiusStep(currentKm: number | undefined): number | null {
  const ladder = [25, 50, 100, 150, 250, 500];
  if (currentKm == null) return ladder[1];
  for (const step of ladder) {
    if (step > currentKm) return step;
  }
  return null;
}

/**
 * Map a distance token to its display label (e.g. "5k" -> "5K", "21k" ->
 * "21K"). Falls back to upper-casing when the token is unknown so custom
 * distances like "8k" still render acceptably.
 */
export function formatDistance(token: string): string {
  const norm = token.trim().toLowerCase();
  if (norm.endsWith("k")) return norm.toUpperCase();
  return norm.toUpperCase();
}

function pluralizeRaces(n: number): string {
  return n === 1 ? "1 corrida" : `${n} corridas`;
}

/**
 * Build the human-readable label for a suggestion given the kind, the current
 * filter context, and the counterfactual count. Always PT-BR. Never includes
 * markup; the front-end can wrap any chunk for emphasis if needed.
 */
export function buildSuggestionLabel(
  kind: SuggestionKind,
  count: number,
  context: {
    currentRadius?: number;
    targetRadius?: number;
    currentDistances?: string[];
    alternativeDistance?: string;
    currentCity?: string;
  },
): string {
  switch (kind) {
    case "expand_radius":
      if (context.targetRadius == null) return "";
      return `Expandir o raio para ${context.targetRadius}km mostraria ${pluralizeRaces(count)}.`;
    case "drop_radius":
      return `Sem o filtro de distância da sua cidade: ${pluralizeRaces(count)} próximas.`;
    case "drop_distance":
      return `Sem o filtro de distância: ${pluralizeRaces(count)} disponíveis.`;
    case "swap_distance":
      if (!context.alternativeDistance) return "";
      return `${formatDistance(context.alternativeDistance)} tem ${pluralizeRaces(count)} no mesmo período.`;
    case "drop_prize_type":
      return `Sem o filtro de premiação: ${pluralizeRaces(count)} disponíveis.`;
    case "drop_city":
      if (context.currentCity) {
        return `Sem o filtro de cidade (${context.currentCity}): ${pluralizeRaces(count)} disponíveis.`;
      }
      return `Sem o filtro de cidade: ${pluralizeRaces(count)} disponíveis.`;
    case "extend_date_range":
      return `Ampliando o intervalo de datas: ${pluralizeRaces(count)} no calendário.`;
    case "clear_search":
      return `Sem a busca por texto: ${pluralizeRaces(count)} disponíveis.`;
  }
}

/**
 * Filter and rank a list of candidate suggestions:
 *  - drops any with count <= 0
 *  - drops duplicates by id
 *  - sorts by priority (asc) then by count (desc)
 *  - caps at maxItems
 */
export function rankSuggestions(
  candidates: Suggestion[],
  maxItems = 3,
): Suggestion[] {
  const seen = new Set<string>();
  const filtered: Suggestion[] = [];
  for (const s of candidates) {
    if (s.count <= 0) continue;
    if (seen.has(s.id)) continue;
    seen.add(s.id);
    filtered.push(s);
  }
  filtered.sort((a, b) => {
    if (a.priority !== b.priority) return a.priority - b.priority;
    return b.count - a.count;
  });
  return filtered.slice(0, maxItems);
}
