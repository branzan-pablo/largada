"use client";

import { forwardRef, useState, type ComponentProps, type ReactNode } from "react";
import { CalendarDays, ChevronDown, MapPin, Medal, Route, Search, X } from "lucide-react";
import { CityAutocomplete } from "@/components/onboarding/city-autocomplete";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { DEFAULT_DISTANCES } from "@/lib/constants";
import { getActiveFilterCount, getDateSummary, getDistanceSummary, getPrizeSummary } from "@/lib/race-filter-controls";
import type { RaceFilters as Filters } from "@/types/race";
import { DateFilterFields, DistanceFilterFields, PrizeFilterFields } from "./race-filter-fields";

interface RaceFiltersProps {
  filters: Filters;
  onFiltersChange: (filters: Filters) => void;
  search: string;
  onSearchChange: (value: string) => void;
  availableDistances?: string[];
}

const FilterTrigger = forwardRef<HTMLButtonElement, ComponentProps<"button"> & { icon: ReactNode; label: string; value: string; active: boolean }>(function FilterTrigger(
  { icon, label, value, active, className, ...props },
  ref,
) {
  return (
    <button ref={ref} type="button" className={`group flex h-[58px] min-w-0 items-center gap-3 rounded-xl px-3 text-left outline-none transition-colors hover:bg-slate-50 focus-visible:ring-2 focus-visible:ring-[#FF4D00] focus-visible:ring-offset-2 data-[state=open]:bg-slate-50 ${className ?? ""}`} {...props}>
      <span className={active ? "text-[#FF4D00]" : "text-slate-400"} aria-hidden="true">{icon}</span>
      <span className="min-w-0 flex-1">
        <span className="block text-[10px] font-black uppercase tracking-[0.15em] text-slate-400">{label}</span>
        <span className="block truncate text-sm font-bold text-[#0D1B2A]">{value}</span>
      </span>
      <ChevronDown className="h-4 w-4 shrink-0 text-slate-400 transition-transform group-data-[state=open]:rotate-180" aria-hidden="true" />
    </button>
  );
});

export function RaceFiltersDesktop({ filters, onFiltersChange, search, onSearchChange, availableDistances }: RaceFiltersProps) {
  const [cityOpen, setCityOpen] = useState(false);
  const distanceOptions = [...new Set([...DEFAULT_DISTANCES, ...(availableDistances ?? [])])].sort((a, b) => parseFloat(a) - parseFloat(b));
  const activeCount = getActiveFilterCount(filters);

  return (
    <div className="relative z-20 hidden lg:block">
      <div className="relative overflow-visible rounded-2xl border border-slate-200 bg-white p-1.5 shadow-[0_12px_35px_-28px_rgba(13,27,42,0.5)]">
        <div className={`absolute inset-x-4 top-0 h-[3px] origin-left rounded-full bg-[#FF4D00] transition-transform duration-300 motion-reduce:transition-none ${activeCount ? "scale-x-100" : "scale-x-0"}`} aria-hidden="true" />
        <div className="grid grid-cols-[minmax(260px,1.65fr)_repeat(4,minmax(135px,0.8fr))] divide-x divide-slate-200">
          <div className="group relative flex h-[58px] min-w-0 items-center px-3">
            <label htmlFor="desktop-race-search" className="sr-only">Buscar corridas</label>
            <Search className="absolute left-4 h-5 w-5 text-slate-400 transition-colors group-focus-within:text-[#FF4D00]" aria-hidden="true" />
            <input id="desktop-race-search" type="search" value={search} onChange={(event) => onSearchChange(event.target.value)} placeholder="Nome, cidade ou organizador" className="h-full w-full bg-transparent pl-9 pr-8 text-sm font-semibold text-[#0D1B2A] outline-none placeholder:font-medium placeholder:text-slate-400" />
            {search && <button type="button" onClick={() => onSearchChange("")} aria-label="Limpar busca" className="absolute right-3 rounded-full p-1 text-slate-400 hover:bg-slate-100 hover:text-slate-900 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#FF4D00]"><X className="h-4 w-4" aria-hidden="true" /></button>}
          </div>

          <Popover open={cityOpen} onOpenChange={setCityOpen}>
            <PopoverTrigger asChild><FilterTrigger icon={<MapPin className="h-5 w-5" />} label="Cidade" value={filters.city ?? "Todas"} active={Boolean(filters.city)} /></PopoverTrigger>
            <PopoverContent className="w-[340px]">
              <p className="mb-3 text-sm font-extrabold text-[#0D1B2A]">Onde você quer correr?</p>
              <CityAutocomplete label="Buscar cidade" initialCity={filters.city} onSelect={(city) => { onFiltersChange({ ...filters, city: city.name }); setCityOpen(false); }} onClear={() => onFiltersChange({ ...filters, city: undefined })} placeholder="Digite ao menos 2 letras" inputClassName="h-11 rounded-xl border-slate-200 bg-slate-50 focus-visible:ring-[#FF4D00]" />
            </PopoverContent>
          </Popover>

          <Popover>
            <PopoverTrigger asChild><FilterTrigger icon={<CalendarDays className="h-5 w-5" />} label="Data" value={getDateSummary(filters)} active={Boolean(filters.dateFrom || filters.dateTo)} /></PopoverTrigger>
            <PopoverContent className="w-[380px]"><DateFilterFields filters={filters} onChange={onFiltersChange} /></PopoverContent>
          </Popover>

          <Popover>
            <PopoverTrigger asChild><FilterTrigger icon={<Route className="h-5 w-5" />} label="Distância" value={getDistanceSummary(filters.distances)} active={Boolean(filters.distances?.length)} /></PopoverTrigger>
            <PopoverContent className="w-[410px]"><DistanceFilterFields filters={filters} onChange={onFiltersChange} options={distanceOptions} /></PopoverContent>
          </Popover>

          <Popover>
            <PopoverTrigger asChild><FilterTrigger icon={<Medal className="h-5 w-5" />} label="Premiação" value={getPrizeSummary(filters)} active={Boolean(filters.prizeType?.length)} /></PopoverTrigger>
            <PopoverContent className="w-[300px]" align="end"><PrizeFilterFields filters={filters} onChange={onFiltersChange} /></PopoverContent>
          </Popover>
        </div>
      </div>
    </div>
  );
}
