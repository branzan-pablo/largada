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
import { SlidersHorizontal, CalendarDays } from "lucide-react";
import { DEFAULT_DISTANCES } from "@/lib/constants";
import type { RaceFilters as Filters } from "@/types/race";
import { getDateRange, getDatePreset } from "@/lib/filter-utils";

interface RaceFiltersMobileProps {
  filters: Filters;
  onFiltersChange: (filters: Filters) => void;
  search: string;
  onSearchChange: (value: string) => void;
  availableDistances?: string[];
}

export function RaceFiltersMobile({
  filters,
  onFiltersChange,
  onSearchChange,
  availableDistances,
}: RaceFiltersMobileProps) {
  const distanceOptions = [
    ...DEFAULT_DISTANCES,
    ...(availableDistances ?? []).filter(
      (d) => !(DEFAULT_DISTANCES as readonly string[]).includes(d)
    ),
  ].sort((a, b) => parseFloat(a) - parseFloat(b));
  const [open, setOpen] = useState(false);
  const [cityKey, setCityKey] = useState(0);

  const activeCount = [
    filters.city,
    filters.dateFrom || filters.dateTo,
    filters.distances?.length,
    filters.prizeType?.length,
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
        <SheetContent side="bottom" className="h-auto max-h-[80vh] flex flex-col px-4 pb-5 bg-white border-t-gray-200 text-gray-800">
          <SheetHeader className="text-left mb-3 shrink-0">
            <SheetTitle className="text-sm font-semibold text-[#0D1B2A]">Filtros</SheetTitle>
          </SheetHeader>

          <div className="flex-1 overflow-y-auto space-y-3 pr-1">
            {/* City */}
            <div className="flex items-center gap-3">
              <Label className="w-14 shrink-0 text-xs font-medium text-[#6B7280]">Cidade</Label>
              <div className="flex-1">
                <CityAutocomplete
                  key={cityKey}
                  initialCity={filters.city}
                  onSelect={(c) => onFiltersChange({ ...filters, city: c.name })}
                  onClear={() => onFiltersChange({ ...filters, city: undefined })}
                  placeholder="Todas as cidades"
                  inputClassName="border-gray-200 bg-gray-50 text-gray-800 placeholder:text-gray-400 focus-visible:ring-gray-300"
                />
              </div>
            </div>

            {/* Date Presets */}
            <div className="flex items-center gap-3">
              <Label className="w-14 shrink-0 text-xs font-medium text-[#6B7280]">Data</Label>
              <div className="flex-1">
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
            </div>

            {/* Trophy Toggle */}
            <div className="flex items-center justify-between">
              <Label htmlFor="trophy-mobile" className="text-xs font-medium text-[#6B7280]">Com troféu</Label>
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

            {/* Distances */}
            <div className="space-y-1.5">
              <Label className="text-xs font-medium text-[#6B7280]">Distâncias</Label>
              <div className="flex flex-wrap gap-1.5">
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
            </div>
          </div>

          <div className="flex gap-2 pt-3 border-t border-gray-200 mt-3 shrink-0">
            <Button
              variant="outline"
              className="flex-1 bg-transparent border-gray-200 text-gray-700 hover:bg-gray-50 hover:text-[#0D1B2A]"
              onClick={() => {
                onFiltersChange({ radius: filters.radius });
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
