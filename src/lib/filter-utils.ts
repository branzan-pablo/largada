import { todayInBrazil } from "@/lib/date";
import type { RaceFilters } from "@/types/race";

function fmtLocal(d: Date): string {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const dd = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${dd}`;
}

export function getDateRange(value: string): { dateFrom?: string; dateTo?: string } {
  const todayStr = todayInBrazil();
  // Parse as local date to do arithmetic
  const today = new Date(todayStr + "T00:00:00");

  switch (value) {
    case "this_week": {
      const end = new Date(today);
      end.setDate(today.getDate() + (7 - today.getDay()));
      return { dateFrom: todayStr, dateTo: fmtLocal(end) };
    }
    case "this_month": {
      const end = new Date(today.getFullYear(), today.getMonth() + 1, 0);
      return { dateFrom: todayStr, dateTo: fmtLocal(end) };
    }
    case "next_month": {
      const start = new Date(today.getFullYear(), today.getMonth() + 1, 1);
      const end = new Date(today.getFullYear(), today.getMonth() + 2, 0);
      return { dateFrom: fmtLocal(start), dateTo: fmtLocal(end) };
    }
    case "next_3_months": {
      const end = new Date(today);
      end.setMonth(today.getMonth() + 3);
      return { dateFrom: todayStr, dateTo: fmtLocal(end) };
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
