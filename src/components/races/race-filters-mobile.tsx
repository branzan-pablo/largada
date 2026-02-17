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
import { SlidersHorizontal, Search, CalendarDays } from "lucide-react";
import { DISTANCES, REGION_CITIES } from "@/lib/constants";
import { cn } from "@/lib/utils";
import type { RaceFilters as Filters } from "@/types/race";

// Helper functions for date logic (duplicated from desktop for now, could be shared util)
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

interface RaceFiltersMobileProps {
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
        "rounded-md border px-3 py-1.5 text-xs font-semibold transition-all",
        active
          ? "border-white bg-white text-black"
          : "border-zinc-800 bg-zinc-900/50 text-zinc-500 hover:border-zinc-700 hover:text-zinc-300"
      )}
    >
      {label}
    </button>
  );
}

export function RaceFiltersMobile({
  filters,
  onFiltersChange,
  isLoggedIn,
  search,
  onSearchChange,
}: RaceFiltersMobileProps) {
  const [open, setOpen] = useState(false);

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
          <Button variant="outline" size="sm" className="gap-2 bg-zinc-900 border-zinc-800 text-zinc-300 hover:bg-zinc-800 hover:text-white">
            <SlidersHorizontal className="h-4 w-4" />
            Filtros
            {activeCount > 0 && (
              <Badge className="ml-1 h-5 w-5 rounded-full p-0 text-xs bg-emerald-500/10 text-emerald-500 border-emerald-500/20 hover:bg-emerald-500/20">
                {activeCount}
              </Badge>
            )}
          </Button>
        </SheetTrigger>
        <SheetContent side="bottom" className="h-[85vh] flex flex-col px-5 pb-8 bg-zinc-950 border-t-zinc-800 text-zinc-200">
          <SheetHeader className="text-left mb-6 shrink-0">
            <SheetTitle className="text-xl font-semibold text-white">Filtros</SheetTitle>
          </SheetHeader>

          <div className="flex-1 overflow-y-auto space-y-6 pr-2">
            {/* Search */}
            <div className="space-y-3">
              <Label className="text-sm font-medium text-zinc-400">Buscar</Label>
              <div className="relative group">
                <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-zinc-500 group-focus-within:text-zinc-300 transition-colors" />
                <input
                  type="text"
                  placeholder="Buscar por nome, cidade..."
                  value={search}
                  onChange={(e) => onSearchChange(e.target.value)}
                  className="w-full h-10 bg-zinc-900/50 border border-zinc-800 rounded-md text-sm text-zinc-200 pl-9 pr-4 focus:outline-none focus:border-zinc-700 focus:bg-zinc-900 transition-all placeholder:text-zinc-600"
                />
              </div>
            </div>

            {/* City */}
            <div className="space-y-3">
              <Label className="text-sm font-medium text-zinc-400">Cidade</Label>
              <Select
                value={filters.city ?? "all"}
                onValueChange={(v) =>
                  onFiltersChange({
                    ...filters,
                    city: v === "all" ? undefined : v,
                  })
                }
              >
                <SelectTrigger className="w-full bg-zinc-900/50 border-zinc-800 text-zinc-200 focus:ring-zinc-700">
                  <SelectValue placeholder="Todas as cidades" />
                </SelectTrigger>
                <SelectContent className="bg-zinc-900 border-zinc-800 text-zinc-200">
                  <SelectItem value="all" className="focus:bg-zinc-800 focus:text-white">Todas as cidades</SelectItem>
                  {REGION_CITIES.map((c) => (
                    <SelectItem key={c.name} value={c.name} className="focus:bg-zinc-800 focus:text-white">
                      {c.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Date Presets */}
            <div className="space-y-3">
              <Label className="text-sm font-medium text-zinc-400">Data</Label>
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
                <SelectTrigger className="w-full bg-zinc-900/50 border-zinc-800 text-zinc-200 focus:ring-zinc-700">
                  <div className="flex items-center gap-2">
                    <CalendarDays className="h-4 w-4 text-zinc-500 shrink-0" />
                    <SelectValue placeholder="Qualquer data" />
                  </div>
                </SelectTrigger>
                <SelectContent className="bg-zinc-900 border-zinc-800 text-zinc-200">
                  <SelectItem value="any" className="focus:bg-zinc-800 focus:text-white">Qualquer data</SelectItem>
                  <SelectItem value="this_week" className="focus:bg-zinc-800 focus:text-white">Esta semana</SelectItem>
                  <SelectItem value="this_month" className="focus:bg-zinc-800 focus:text-white">Este mês</SelectItem>
                  <SelectItem value="next_month" className="focus:bg-zinc-800 focus:text-white">Próximo mês</SelectItem>
                  <SelectItem value="next_3_months" className="focus:bg-zinc-800 focus:text-white">Próximos 3 meses</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Trophy Toggle */}
            <div className="space-y-3">
              <div className="flex items-center justify-between py-2">
                <Label htmlFor="trophy-mobile" className="text-sm font-medium text-zinc-400">Com troféu</Label>
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
              <Label className="text-sm font-medium text-zinc-400">Distâncias</Label>
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

          <div className="flex gap-3 pt-4 border-t border-zinc-800 mt-4 shrink-0">
            <Button
              variant="outline"
              className="flex-1 bg-transparent border-zinc-800 text-zinc-300 hover:bg-zinc-900 hover:text-white"
              onClick={() => {
                onFiltersChange({});
                onSearchChange("");
                setOpen(false);
              }}
            >
              Limpar
            </Button>
            <Button
              className="flex-1 bg-emerald-600 hover:bg-emerald-700 text-white border-0"
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
