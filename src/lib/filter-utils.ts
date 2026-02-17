import type { RaceFilters } from "@/types/race";

export function getDateRange(value: string): { dateFrom?: string; dateTo?: string } {
  const today = new Date();
  const fmt = (d: Date) => d.toISOString().split("T")[0];

  switch (value) {
    case "this_week": {
      const end = new Date(today);
      end.setDate(today.getDate() + (7 - today.getDay()));
      return { dateFrom: fmt(today), dateTo: fmt(end) };
    }
    case "this_month": {
      const end = new Date(today.getFullYear(), today.getMonth() + 1, 0);
      return { dateFrom: fmt(today), dateTo: fmt(end) };
    }
    case "next_month": {
      const start = new Date(today.getFullYear(), today.getMonth() + 1, 1);
      const end = new Date(today.getFullYear(), today.getMonth() + 2, 0);
      return { dateFrom: fmt(start), dateTo: fmt(end) };
    }
    case "next_3_months": {
      const end = new Date(today);
      end.setMonth(today.getMonth() + 3);
      return { dateFrom: fmt(today), dateTo: fmt(end) };
    }
    default:
      return {};
  }
}

export function getDatePreset(filters: RaceFilters): string {
  if (!filters.dateFrom) return "any";
  for (const preset of ["this_week", "this_month", "next_month", "next_3_months"]) {
    const range = getDateRange(preset);
    if (range.dateFrom === filters.dateFrom && range.dateTo === filters.dateTo) return preset;
  }
  return "any";
}
