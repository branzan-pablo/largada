"use client";

import { useState } from "react";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { ToggleChip } from "@/components/ui/toggle-chip";
import { CityAutocomplete } from "@/components/onboarding/city-autocomplete";
import { SlidersHorizontal, Search, CalendarDays } from "lucide-react";
import { DISTANCES } from "@/lib/constants";
import type { RaceFilters as Filters } from "@/types/race";
import { getDateRange, getDatePreset } from "@/lib/filter-utils";

interface RaceFiltersMobileProps {
  filters: Filters;
  onFiltersChange: (filters: Filters) => void;
  search: string;
  onSearchChange: (value: string) => void;
}

export function RaceFiltersMobile({
  filters,
  onFiltersChange,
  search,
  onSearchChange,
}: RaceFiltersMobileProps) {
  const [open, setOpen] = useState(false);
  const [cityKey, setCityKey] = useState(0);

  const activeCount = [
    filters.city,
    filters.dateFrom || filters.dateTo,
    filters.distances?.length,
    filters.prizeType?.length,
    search,
  ].filter(Boolean).length;

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
    <div className="md:hidden">
      <Sheet open={open} onOpenChange={setOpen}>
        <SheetTrigger asChild>
          <Button variant="outline" size="sm" className="gap-2 bg-white border-gray-200 text-gray-700 hover:bg-gray-50 hover:text-[#0D1B2A]">
            <SlidersHorizontal className="h-4 w-4" />
            Filtros
            {activeCount > 0 && (
              <Badge className="ml-1 h-5 w-5 rounded-full p-0 text-xs bg-[#FF4D00]/10 text-[#FF4D00] border-[#FF4D00]/20 hover:bg-[#FF4D00]/20">
                {activeCount}
              </Badge>
            )}
          </Button>
        </SheetTrigger>
        <SheetContent side="bottom" className="h-[85vh] flex flex-col px-5 pb-8 bg-white border-t-gray-200 text-gray-800">
          <SheetHeader className="text-left mb-6 shrink-0">
            <SheetTitle className="text-xl font-semibold text-[#0D1B2A]">Filtros</SheetTitle>
          </SheetHeader>

          <div className="flex-1 overflow-y-auto space-y-6 pr-2">
            {/* Search */}
            <div className="space-y-3">
              <Label className="text-sm font-medium text-[#6B7280]">Buscar</Label>
              <div className="relative group">
                <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400 group-focus-within:text-gray-600 transition-colors" />
                <input
                  type="text"
                  placeholder="Buscar por nome, cidade..."
                  value={search}
                  onChange={(e) => onSearchChange(e.target.value)}
                  className="w-full h-10 bg-gray-50 border border-gray-200 rounded-md text-sm text-gray-800 pl-9 pr-4 focus:outline-none focus:border-gray-300 focus:bg-white transition-all placeholder:text-gray-400"
                />
              </div>
            </div>

            {/* City */}
            <div className="space-y-3">
              <Label className="text-sm font-medium text-[#6B7280]">Cidade</Label>
              <CityAutocomplete
                key={cityKey}
                initialCity={filters.city}
                onSelect={(c) => onFiltersChange({ ...filters, city: c.name })}
                onClear={() => onFiltersChange({ ...filters, city: undefined })}
                placeholder="Todas as cidades"
                inputClassName="border-gray-200 bg-gray-50 text-gray-800 placeholder:text-gray-400 focus-visible:ring-gray-300"
              />
            </div>

            {/* Date Presets */}
            <div className="space-y-3">
              <Label className="text-sm font-medium text-[#6B7280]">Data</Label>
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
                <SelectTrigger className="w-full bg-gray-50 border-gray-200 text-gray-800 focus:ring-gray-300">
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
            </div>

            {/* Trophy Toggle */}
            <div className="space-y-3">
              <div className="flex items-center justify-between py-2">
                <Label htmlFor="trophy-mobile" className="text-sm font-medium text-[#6B7280]">Com troféu</Label>
                <Switch
                  id="trophy-mobile"
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
              </div>
            </div>

            {/* Distances */}
            <div className="space-y-3">
              <Label className="text-sm font-medium text-[#6B7280]">Distâncias</Label>
              <div className="flex flex-wrap gap-2">
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
            </div>
          </div>

          <div className="flex gap-3 pt-4 border-t border-gray-200 mt-4 shrink-0">
            <Button
              variant="outline"
              className="flex-1 bg-transparent border-gray-200 text-gray-700 hover:bg-gray-50 hover:text-[#0D1B2A]"
              onClick={() => {
                onFiltersChange({});
                onSearchChange("");
                setCityKey((k) => k + 1);
                setOpen(false);
              }}
            >
              Limpar
            </Button>
            <Button
              className="flex-1 bg-[#FF4D00] hover:bg-[#E04400] text-white border-0"
              onClick={() => setOpen(false)}
            >
              Ver resultados
            </Button>
          </div>
        </SheetContent>
      </Sheet>
    </div>
  );
}
