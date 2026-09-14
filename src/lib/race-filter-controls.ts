import type { RaceFilters } from "@/types/race";
import { getDatePreset } from "@/lib/filter-utils";

export type PrizeMode = "any" | "trophy" | "money" | "both";

const DATE_LABELS: Record<string, string> = {
  any: "Qualquer data",
  this_week: "Esta semana",
  this_month: "Este mês",
  next_month: "Próximo mês",
  next_3_months: "Próximos 3 meses",
};

function formatShortDate(value?: string) {
  if (!value) return "";
  const [year, month, day] = value.split("-");
  return year && month && day ? `${day}/${month}/${year}` : value;
}

export function getDateSummary(filters: RaceFilters) {
  const preset = getDatePreset(filters);
  if (preset !== "custom") return DATE_LABELS[preset] ?? DATE_LABELS.any;
  if (filters.dateFrom && filters.dateTo) {
    return `${formatShortDate(filters.dateFrom)}–${formatShortDate(filters.dateTo)}`;
  }
  return filters.dateFrom
    ? `A partir de ${formatShortDate(filters.dateFrom)}`
    : `Até ${formatShortDate(filters.dateTo)}`;
}

export function getDistanceSummary(distances?: string[]) {
  if (!distances?.length) return "Todas";
  const [first, ...rest] = distances;
  return `${first.toUpperCase()}${rest.length ? ` +${rest.length}` : ""}`;
}

export function getPrizeMode(filters: RaceFilters): PrizeMode {
  const types = filters.prizeType ?? [];
  if (types.includes("both") || (types.includes("money") && types.includes("trophy"))) return "both";
  if (types.includes("trophy")) return "trophy";
  if (types.includes("money")) return "money";
  return "any";
}

export function withPrizeMode(filters: RaceFilters, mode: PrizeMode): RaceFilters {
  return {
    ...filters,
    prizeType: mode === "any" ? undefined : [mode],
  };
}

export function getPrizeSummary(filters: RaceFilters) {
  return {
    any: "Qualquer",
    trophy: "Com troféu",
    money: "Com prêmio em dinheiro",
    both: "Troféu e dinheiro",
  }[getPrizeMode(filters)];
}

export function getActiveFilterCount(filters: RaceFilters) {
  return [
    Boolean(filters.city),
    Boolean(filters.dateFrom || filters.dateTo),
    Boolean(filters.distances?.length),
    Boolean(filters.prizeType?.length),
  ].filter(Boolean).length;
}

export function toggleDistance(filters: RaceFilters, distance: string): RaceFilters {
  const current = filters.distances ?? [];
  const distances = current.includes(distance)
    ? current.filter((item) => item !== distance)
    : [...current, distance];
  return { ...filters, distances: distances.length ? distances : undefined };
}
