"use client";

import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { Slider } from "@/components/ui/slider";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { DISTANCES, REGION_CITIES, RADIUS_OPTIONS } from "@/lib/constants";
import { X } from "lucide-react";
import type { RaceFilters as Filters } from "@/types/race";

interface RaceFiltersProps {
  filters: Filters;
  onFiltersChange: (filters: Filters) => void;
  isLoggedIn: boolean;
}

export function RaceFiltersDesktop({
  filters,
  onFiltersChange,
  isLoggedIn,
}: RaceFiltersProps) {
  const hasActiveFilters =
    filters.city ||
    filters.dateFrom ||
    filters.dateTo ||
    (filters.distances && filters.distances.length > 0) ||
    (filters.prizeType && filters.prizeType.length > 0) ||
    filters.radius;

  const clearFilters = () => {
    onFiltersChange({});
  };

  return (
    <div className="hidden space-y-4 rounded-lg border p-4 md:block">
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-semibold">Filtros</h3>
        {hasActiveFilters && (
          <Button
            variant="ghost"
            size="sm"
            onClick={clearFilters}
            className="h-auto p-0 text-xs text-muted-foreground"
          >
            <X className="mr-1 h-3 w-3" />
            Limpar
          </Button>
        )}
      </div>

      {/* City */}
      <div className="space-y-2">
        <Label className="text-xs">Cidade</Label>
        <Select
          value={filters.city ?? "all"}
          onValueChange={(v) =>
            onFiltersChange({ ...filters, city: v === "all" ? undefined : v })
          }
        >
          <SelectTrigger className="h-9 text-sm">
            <SelectValue placeholder="Todas" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Todas</SelectItem>
            {REGION_CITIES.map((c) => (
              <SelectItem key={c.name} value={c.name}>
                {c.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* Date Range */}
      <div className="grid grid-cols-2 gap-2">
        <div className="space-y-1">
          <Label className="text-xs">De</Label>
          <input
            type="date"
            className="flex h-9 w-full rounded-md border border-input bg-background px-2 text-sm"
            value={filters.dateFrom ?? ""}
            onChange={(e) =>
              onFiltersChange({
                ...filters,
                dateFrom: e.target.value || undefined,
              })
            }
          />
        </div>
        <div className="space-y-1">
          <Label className="text-xs">Até</Label>
          <input
            type="date"
            className="flex h-9 w-full rounded-md border border-input bg-background px-2 text-sm"
            value={filters.dateTo ?? ""}
            onChange={(e) =>
              onFiltersChange({
                ...filters,
                dateTo: e.target.value || undefined,
              })
            }
          />
        </div>
      </div>

      {/* Distances */}
      <div className="space-y-2">
        <Label className="text-xs">Distâncias</Label>
        <div className="flex flex-wrap gap-3">
          {DISTANCES.map((d) => (
            <label key={d} className="flex items-center gap-1.5 text-sm">
              <Checkbox
                checked={filters.distances?.includes(d) ?? false}
                onCheckedChange={(checked) => {
                  const current = filters.distances ?? [];
                  const next = checked
                    ? [...current, d]
                    : current.filter((x) => x !== d);
                  onFiltersChange({
                    ...filters,
                    distances: next.length > 0 ? next : undefined,
                  });
                }}
              />
              {d.toUpperCase()}
            </label>
          ))}
        </div>
      </div>

      {/* Prize Type */}
      <div className="space-y-2">
        <Label className="text-xs">Premiação</Label>
        <div className="flex flex-wrap gap-3">
          {(["money", "trophy"] as const).map((type) => (
            <label key={type} className="flex items-center gap-1.5 text-sm">
              <Checkbox
                checked={filters.prizeType?.includes(type) ?? false}
                onCheckedChange={(checked) => {
                  const current = filters.prizeType ?? [];
                  const next = checked
                    ? [...current, type]
                    : current.filter((x) => x !== type);
                  onFiltersChange({
                    ...filters,
                    prizeType: next.length > 0 ? next : undefined,
                  });
                }}
              />
              {type === "money" ? "Dinheiro" : "Troféu"}
            </label>
          ))}
        </div>
      </div>

      {/* Radius */}
      {isLoggedIn && (
        <div className="space-y-2">
          <Label className="text-xs">
            Raio: {filters.radius ?? "—"} km
          </Label>
          <Slider
            value={[filters.radius ?? 0]}
            onValueChange={([v]) =>
              onFiltersChange({
                ...filters,
                radius: v === 0 ? undefined : v,
              })
            }
            max={100}
            step={10}
            className="py-2"
          />
          <div className="flex justify-between text-xs text-muted-foreground">
            <span>Sem limite</span>
            <span>100 km</span>
          </div>
        </div>
      )}
    </div>
  );
}
