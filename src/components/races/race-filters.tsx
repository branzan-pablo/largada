"use client";

import { useState } from "react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { ToggleChip } from "@/components/ui/toggle-chip";
import { DEFAULT_DISTANCES } from "@/lib/constants";
import { CityAutocomplete } from "@/components/onboarding/city-autocomplete";
import { X, CalendarDays, Search } from "lucide-react";
import type { RaceFilters as Filters } from "@/types/race";
import { Switch } from "@/components/ui/switch";
import { getDateRange, getDatePreset } from "@/lib/filter-utils";

interface RaceFiltersProps {
  filters: Filters;
  onFiltersChange: (filters: Filters) => void;
  search: string;
  onSearchChange: (value: string) => void;
  availableDistances?: string[];
}

export function RaceFiltersDesktop({
  filters,
  onFiltersChange,
  search,
  onSearchChange,
  availableDistances,
}: RaceFiltersProps) {
  const distanceOptions = [
    ...DEFAULT_DISTANCES,
    ...(availableDistances ?? []).filter(
      (d) => !(DEFAULT_DISTANCES as readonly string[]).includes(d)
    ),
  ].sort((a, b) => parseFloat(a) - parseFloat(b));
  const [cityKey, setCityKey] = useState(0);

  const hasActiveFilters =
    filters.city ||
    filters.dateFrom ||
    filters.dateTo ||
    (filters.distances && filters.distances.length > 0) ||
    (filters.prizeType && filters.prizeType.length > 0) ||
    search;

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
    <div className="hidden md:block">
      <div className="rounded-2xl border border-gray-200 bg-white p-4 space-y-4 relative z-10">
        {/* Top Row: Search + Selects + Toggle */}
        <div className="flex items-center gap-3">
          {/* Search */}
          <div className="relative flex-[2] group">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400 group-focus-within:text-gray-600 transition-colors" />
            <input
              type="text"
              placeholder="Buscar por nome, cidade..."
              value={search}
              onChange={(e) => onSearchChange(e.target.value)}
              className="w-full h-10 bg-gray-50 border border-gray-200 rounded-lg text-sm text-gray-800 pl-9 pr-4 focus:outline-none focus:border-gray-300 focus:bg-white transition-all placeholder:text-gray-400"
            />
          </div>

          {/* City */}
          <div className="w-[300px]">
            <CityAutocomplete
              key={cityKey}
              initialCity={filters.city}
              onSelect={(c) => onFiltersChange({ ...filters, city: c.name })}
              onClear={() => onFiltersChange({ ...filters, city: undefined })}
              placeholder="Todas as cidades"
              inputClassName="h-10 border-gray-200 bg-gray-50 text-gray-800 placeholder:text-gray-400 hover:border-gray-300 focus-visible:ring-0 focus-visible:ring-offset-0"
            />
          </div>

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
            <SelectTrigger className="h-10 w-[200px] bg-gray-50 border-gray-200 text-sm text-gray-800 px-3 focus:ring-0 focus:ring-offset-0 hover:bg-white hover:border-gray-300 transition-all rounded-lg">
              <div className="flex items-center gap-2">
                <CalendarDays className="h-4 w-4 text-gray-400 shrink-0" />
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

          {/* Divider */}
          <div className="h-8 w-px bg-gray-200 mx-1 shrink-0" />

          {/* Trophy toggle */}
          <div className="flex items-center gap-3 px-1 shrink-0">
            <Switch
              id="trophy-filter"
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
            <label htmlFor="trophy-filter" className="text-sm font-medium text-[#6B7280] whitespace-nowrap cursor-pointer select-none">
              Com troféu
            </label>
          </div>
        </div>

        {/* Horizontal Separator */}
        <div className="h-px bg-gray-200 w-full" />

        {/* Bottom Row: Distances + Clear */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <span className="text-[11px] uppercase tracking-wider text-gray-500 font-bold">
              DISTÂNCIA
            </span>
            <ToggleChip
              label="Todos"
              active={!filters.distances || filters.distances.length === 0}
              onClick={() => onFiltersChange({ ...filters, distances: undefined })}
            />
            {distanceOptions.map((d) => (
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
              onClick={() => {
                onFiltersChange({ radius: filters.radius });
                onSearchChange("");
                setCityKey((k) => k + 1);
              }}
              className="flex items-center gap-1.5 text-xs font-medium text-gray-500 hover:text-gray-700 transition-colors"
            >
              <X className="h-3 w-3" />
              Limpar filtros
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
