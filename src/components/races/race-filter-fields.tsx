"use client";

import { CalendarDays, CircleDollarSign, Trophy } from "lucide-react";
import { cn } from "@/lib/utils";
import { getDateRange, getDatePreset } from "@/lib/filter-utils";
import {
  getPrizeMode,
  toggleDistance,
  withPrizeMode,
  type PrizeMode,
} from "@/lib/race-filter-controls";
import type { RaceFilters } from "@/types/race";

const DATE_PRESETS = [
  ["any", "Qualquer data"],
  ["this_week", "Esta semana"],
  ["this_month", "Este mês"],
  ["next_month", "Próximo mês"],
  ["next_3_months", "Próximos 3 meses"],
] as const;

const PRIZE_OPTIONS: Array<{ value: PrizeMode; label: string; icon?: typeof Trophy }> = [
  { value: "any", label: "Qualquer premiação" },
  { value: "trophy", label: "Com troféu", icon: Trophy },
  { value: "money", label: "Prêmio em dinheiro", icon: CircleDollarSign },
  { value: "both", label: "Troféu e dinheiro", icon: Trophy },
];

const optionClass =
  "min-h-11 rounded-xl border px-3 text-left text-sm font-semibold transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#FF4D00] focus-visible:ring-offset-2";

export function DateFilterFields({
  filters,
  onChange,
}: {
  filters: RaceFilters;
  onChange: (filters: RaceFilters) => void;
}) {
  const preset = getDatePreset(filters);
  const selectPreset = (value: string) => {
    const range = getDateRange(value);
    onChange({ ...filters, dateFrom: range.dateFrom, dateTo: range.dateTo });
  };

  return (
    <fieldset className="space-y-4">
      <legend className="sr-only">Período da corrida</legend>
      <div className="grid grid-cols-2 gap-2">
        {DATE_PRESETS.map(([value, label]) => (
          <button
            key={value}
            type="button"
            aria-pressed={preset === value}
            onClick={() => selectPreset(value)}
            className={cn(
              optionClass,
              value === "any" && "col-span-2",
              preset === value
                ? "border-[#0D1B2A] bg-[#0D1B2A] text-white"
                : "border-slate-200 bg-slate-50 text-slate-700 hover:border-slate-300 hover:bg-white",
            )}
          >
            {label}
          </button>
        ))}
      </div>
      <div className="border-t border-slate-200 pt-4">
        <div className="mb-3 flex items-center gap-2 text-xs font-bold uppercase tracking-[0.14em] text-slate-500">
          <CalendarDays className="h-4 w-4" aria-hidden="true" />
          Período exato
        </div>
        <div className="grid grid-cols-2 gap-3">
          <label className="space-y-1.5 text-xs font-semibold text-slate-600">
            De
            <input
              type="date"
              value={filters.dateFrom ?? ""}
              max={filters.dateTo}
              onChange={(event) => onChange({ ...filters, dateFrom: event.target.value || undefined })}
              className="h-11 w-full rounded-xl border border-slate-200 bg-white px-3 text-sm text-slate-900 outline-none focus-visible:ring-2 focus-visible:ring-[#FF4D00]"
            />
          </label>
          <label className="space-y-1.5 text-xs font-semibold text-slate-600">
            Até
            <input
              type="date"
              value={filters.dateTo ?? ""}
              min={filters.dateFrom}
              onChange={(event) => onChange({ ...filters, dateTo: event.target.value || undefined })}
              className="h-11 w-full rounded-xl border border-slate-200 bg-white px-3 text-sm text-slate-900 outline-none focus-visible:ring-2 focus-visible:ring-[#FF4D00]"
            />
          </label>
        </div>
      </div>
    </fieldset>
  );
}

export function DistanceFilterFields({
  filters,
  onChange,
  options,
}: {
  filters: RaceFilters;
  onChange: (filters: RaceFilters) => void;
  options: string[];
}) {
  return (
    <fieldset>
      <legend className="mb-3 text-xs font-bold uppercase tracking-[0.14em] text-slate-500">
        Selecione uma ou mais
      </legend>
      <div className="grid grid-cols-4 gap-2">
        <button
          type="button"
          aria-pressed={!filters.distances?.length}
          onClick={() => onChange({ ...filters, distances: undefined })}
          className={cn(
            optionClass,
            "col-span-2 text-center",
            !filters.distances?.length
              ? "border-[#0D1B2A] bg-[#0D1B2A] text-white"
              : "border-slate-200 bg-slate-50 text-slate-700 hover:bg-white",
          )}
        >
          Todas
        </button>
        {options.map((distance) => {
          const active = filters.distances?.includes(distance) ?? false;
          return (
            <button
              key={distance}
              type="button"
              aria-pressed={active}
              onClick={() => onChange(toggleDistance(filters, distance))}
              className={cn(
                optionClass,
                "text-center tabular-nums",
                active
                  ? "border-[#FF4D00] bg-[#FFF1EB] text-[#C63C00]"
                  : "border-slate-200 bg-slate-50 text-slate-700 hover:border-slate-300 hover:bg-white",
              )}
            >
              {distance.toUpperCase()}
            </button>
          );
        })}
      </div>
    </fieldset>
  );
}

export function PrizeFilterFields({
  filters,
  onChange,
}: {
  filters: RaceFilters;
  onChange: (filters: RaceFilters) => void;
}) {
  const mode = getPrizeMode(filters);
  return (
    <fieldset className="grid gap-2">
      <legend className="sr-only">Tipo de premiação</legend>
      {PRIZE_OPTIONS.map(({ value, label, icon: Icon }) => (
        <button
          key={value}
          type="button"
          aria-pressed={mode === value}
          onClick={() => onChange(withPrizeMode(filters, value))}
          className={cn(
            optionClass,
            "flex items-center gap-2",
            mode === value
              ? "border-[#0D1B2A] bg-[#0D1B2A] text-white"
              : "border-slate-200 bg-slate-50 text-slate-700 hover:border-slate-300 hover:bg-white",
          )}
        >
          {Icon && <Icon className="h-4 w-4" aria-hidden="true" />}
          {label}
        </button>
      ))}
    </fieldset>
  );
}
