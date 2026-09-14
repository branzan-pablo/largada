"use client";

import { X } from "lucide-react";
import { getDateSummary, getPrizeSummary } from "@/lib/race-filter-controls";
import type { RaceFilters } from "@/types/race";

export function ActiveFilterChips({
  filters,
  onChange,
  onClear,
}: {
  filters: RaceFilters;
  onChange: (filters: RaceFilters) => void;
  onClear: () => void;
}) {
  const chips = [
    ...(filters.city
      ? [{ key: "city", label: filters.city, remove: () => onChange({ ...filters, city: undefined }) }]
      : []),
    ...(filters.dateFrom || filters.dateTo
      ? [{ key: "date", label: getDateSummary(filters), remove: () => onChange({ ...filters, dateFrom: undefined, dateTo: undefined }) }]
      : []),
    ...(filters.distances ?? []).map((distance) => ({
      key: `distance-${distance}`,
      label: distance.toUpperCase(),
      remove: () => onChange({
        ...filters,
        distances: filters.distances?.filter((item) => item !== distance).length
          ? filters.distances.filter((item) => item !== distance)
          : undefined,
      }),
    })),
    ...(filters.prizeType?.length
      ? [{ key: "prize", label: getPrizeSummary(filters), remove: () => onChange({ ...filters, prizeType: undefined }) }]
      : []),
  ];

  if (!chips.length) return null;

  return (
    <div className="flex items-center gap-2 overflow-x-auto py-3 scrollbar-none" aria-label="Filtros ativos">
      <span className="hidden shrink-0 text-[10px] font-black uppercase tracking-[0.18em] text-[#FF4D00] sm:inline">
        Na pista
      </span>
      {chips.map((chip) => (
        <button
          key={chip.key}
          type="button"
          onClick={chip.remove}
          aria-label={`Remover filtro ${chip.label}`}
          className="group flex h-8 shrink-0 items-center gap-1.5 rounded-full border border-[#FF4D00]/25 bg-[#FFF5F0] px-3 text-xs font-bold text-[#A93400] outline-none transition-colors hover:border-[#FF4D00]/50 hover:bg-[#FFE8DE] focus-visible:ring-2 focus-visible:ring-[#FF4D00] focus-visible:ring-offset-2"
        >
          {chip.label}
          <X className="h-3.5 w-3.5" aria-hidden="true" />
        </button>
      ))}
      <button
        type="button"
        onClick={onClear}
        className="shrink-0 px-1 text-xs font-semibold text-slate-500 underline-offset-4 hover:text-slate-900 hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#FF4D00]"
      >
        Limpar tudo
      </button>
    </div>
  );
}
