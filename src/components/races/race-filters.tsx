"use client";

import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { DISTANCES, REGION_CITIES } from "@/lib/constants";
import { X, CalendarDays, Search } from "lucide-react";
import { cn } from "@/lib/utils";
import type { RaceFilters as Filters } from "@/types/race";
import { Switch } from "@/components/ui/switch";

function getDateRange(value: string): { dateFrom?: string; dateTo?: string } {
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

function getDatePreset(filters: Filters): string {
  if (!filters.dateFrom) return "any";
  for (const preset of ["this_week", "this_month", "next_month", "next_3_months"]) {
    const range = getDateRange(preset);
    if (range.dateFrom === filters.dateFrom && range.dateTo === filters.dateTo) return preset;
  }
  return "any";
}

interface RaceFiltersProps {
  filters: Filters;
  onFiltersChange: (filters: Filters) => void;
  isLoggedIn: boolean;
  search: string;
  onSearchChange: (value: string) => void;
}

function ToggleChip({
  label,
  active,
  onClick,
}: {
  label: string;
  active: boolean;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        "rounded-full border px-3 py-1 text-xs font-medium transition-colors",
        active
          ? "border-white bg-white text-black"
          : "border-zinc-700 bg-transparent text-zinc-400 hover:border-zinc-500 hover:text-zinc-200"
      )}
    >
      {label}
    </button>
  );
}

export function RaceFiltersDesktop({
  filters,
  onFiltersChange,
  search,
  onSearchChange,
}: RaceFiltersProps) {
  const hasActiveFilters =
    filters.city ||
    filters.dateFrom ||
    filters.dateTo ||
    (filters.distances && filters.distances.length > 0) ||
    (filters.prizeType && filters.prizeType.length > 0) ||
    filters.radius;

  const toggleDistance = (d: string) => {
    const current = filters.distances ?? [];
    const next = current.includes(d)
      ? current.filter((x) => x !== d)
      : [...current, d];
    onFiltersChange({
      ...filters,
      distances: next.length > 0 ? next : undefined,
    });
  };

  const togglePrize = (type: "money" | "trophy") => {
    const current = filters.prizeType ?? [];
    const next = current.includes(type)
      ? current.filter((x) => x !== type)
      : [...current, type];
    onFiltersChange({
      ...filters,
      prizeType: next.length > 0 ? next : undefined,
    });
  };

  return (
    <div className="hidden md:block space-y-3">
      {/* Main filter row */}
      <div className="flex items-center rounded-xl border border-zinc-800 bg-zinc-900/30 h-14">
        {/* Search */}
        <div className="relative flex-1 min-w-0 group">
          <Search className="absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-zinc-500 group-focus-within:text-zinc-300" />
          <input
            type="text"
            placeholder="Buscar por nome, cidade..."
            value={search}
            onChange={(e) => onSearchChange(e.target.value)}
            className="w-full h-full bg-transparent border-none text-sm text-white pl-11 pr-4 focus:outline-none placeholder:text-zinc-500"
          />
        </div>

        <div className="h-7 w-px bg-zinc-800 shrink-0" />

        {/* City */}
        <Select
          value={filters.city ?? "all"}
          onValueChange={(v) =>
            onFiltersChange({ ...filters, city: v === "all" ? undefined : v })
          }
        >
          <SelectTrigger className="h-full w-52 bg-transparent border-none rounded-none text-sm text-zinc-300 px-4 focus:ring-0 focus:ring-offset-0">
            <SelectValue placeholder="Todas as cidades" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Todas as cidades</SelectItem>
            {REGION_CITIES.map((c) => (
              <SelectItem key={c.name} value={c.name}>
                {c.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        <div className="h-7 w-px bg-zinc-800 shrink-0" />

        {/* Date */}
        <Select
          value={getDatePreset(filters)}
          onValueChange={(v) => {
            const range = getDateRange(v);
            onFiltersChange({
              ...filters,
              dateFrom: range.dateFrom,
              dateTo: range.dateTo,
            });
          }}
        >
          <SelectTrigger className="h-full w-52 bg-transparent border-none rounded-none text-sm text-zinc-300 px-4 focus:ring-0 focus:ring-offset-0">
            <div className="flex items-center gap-2">
              <CalendarDays className="h-4 w-4 text-zinc-500 shrink-0" />
              <SelectValue placeholder="Qualquer data" />
            </div>
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="any">Qualquer data</SelectItem>
            <SelectItem value="this_week">Esta semana</SelectItem>
            <SelectItem value="this_month">Este mês</SelectItem>
            <SelectItem value="next_month">Próximo mês</SelectItem>
            <SelectItem value="next_3_months">Próximos 3 meses</SelectItem>
          </SelectContent>
        </Select>

        <div className="h-7 w-px bg-zinc-800 shrink-0" />

        {/* Trophy toggle */}
        <div className="flex items-center gap-2.5 px-5 shrink-0">
          <Switch
            checked={filters.prizeType?.includes("trophy") ?? false}
            onCheckedChange={(checked) => {
              if (checked) {
                togglePrize("trophy");
              } else {
                onFiltersChange({
                  ...filters,
                  prizeType: filters.prizeType?.filter((x) => x !== "trophy"),
                });
              }
            }}
          />
          <span className="text-sm text-zinc-400 whitespace-nowrap">Com troféu</span>
        </div>
      </div>

      {/* Distance chips row */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <span className="text-[11px] uppercase tracking-wider text-zinc-600 font-semibold mr-1">Distância</span>
          <ToggleChip
            label="Todos"
            active={!filters.distances || filters.distances.length === 0}
            onClick={() => onFiltersChange({ ...filters, distances: undefined })}
          />
          {DISTANCES.map((d) => (
            <ToggleChip
              key={d}
              label={d.toUpperCase()}
              active={filters.distances?.includes(d) ?? false}
              onClick={() => toggleDistance(d)}
            />
          ))}
        </div>

        {hasActiveFilters && (
          <button
            onClick={() => onFiltersChange({})}
            className="flex items-center gap-1 text-xs text-zinc-500 hover:text-zinc-300 transition-colors"
          >
            <X className="h-3 w-3" />
            Limpar filtros
          </button>
        )}
      </div>
    </div>
  );
}
