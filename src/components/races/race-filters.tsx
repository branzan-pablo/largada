"use client";

import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Slider } from "@/components/ui/slider";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { DISTANCES, REGION_CITIES } from "@/lib/constants";
import { X } from "lucide-react";
import { cn } from "@/lib/utils";
import type { RaceFilters as Filters } from "@/types/race";

interface RaceFiltersProps {
  filters: Filters;
  onFiltersChange: (filters: Filters) => void;
  isLoggedIn: boolean;
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
          ? "border-primary bg-primary text-primary-foreground"
          : "border-border bg-background text-muted-foreground hover:border-primary/50 hover:text-foreground"
      )}
    >
      {label}
    </button>
  );
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
      <div className="flex items-center gap-3 rounded-lg border bg-muted/30 px-4 py-3">
        {/* City */}
        <Select
          value={filters.city ?? "all"}
          onValueChange={(v) =>
            onFiltersChange({ ...filters, city: v === "all" ? undefined : v })
          }
        >
          <SelectTrigger className="h-8 w-40 bg-background text-sm">
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

        {/* Separator */}
        <div className="h-6 w-px bg-border" />

        {/* Date From */}
        <div className="flex items-center gap-1.5">
          <Label className="text-xs text-muted-foreground whitespace-nowrap">De</Label>
          <input
            type="date"
            className="flex h-8 w-34 rounded-md border border-input bg-background px-2 text-xs"
            value={filters.dateFrom ?? ""}
            onChange={(e) =>
              onFiltersChange({
                ...filters,
                dateFrom: e.target.value || undefined,
              })
            }
          />
        </div>

        <div className="flex items-center gap-1.5">
          <Label className="text-xs text-muted-foreground whitespace-nowrap">Até</Label>
          <input
            type="date"
            className="flex h-8 w-34 rounded-md border border-input bg-background px-2 text-xs"
            value={filters.dateTo ?? ""}
            onChange={(e) =>
              onFiltersChange({
                ...filters,
                dateTo: e.target.value || undefined,
              })
            }
          />
        </div>

        {/* Separator */}
        <div className="h-6 w-px bg-border" />

        {/* Distances as toggle chips */}
        <div className="flex items-center gap-1.5">
          {DISTANCES.map((d) => (
            <ToggleChip
              key={d}
              label={d.toUpperCase()}
              active={filters.distances?.includes(d) ?? false}
              onClick={() => toggleDistance(d)}
            />
          ))}
        </div>

        {/* Separator */}
        <div className="h-6 w-px bg-border" />

        {/* Prize Type as toggle chips */}
        <div className="flex items-center gap-1.5">
          <ToggleChip
            label="Dinheiro"
            active={filters.prizeType?.includes("money") ?? false}
            onClick={() => togglePrize("money")}
          />
          <ToggleChip
            label="Troféu"
            active={filters.prizeType?.includes("trophy") ?? false}
            onClick={() => togglePrize("trophy")}
          />
        </div>

        {/* Radius */}
        {isLoggedIn && (
          <>
            <div className="h-6 w-px bg-border" />
            <div className="flex items-center gap-2">
              <Label className="text-xs text-muted-foreground whitespace-nowrap">
                Raio: {filters.radius ? `${filters.radius}km` : "—"}
              </Label>
              <div className="w-24">
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
                />
              </div>
            </div>
          </>
        )}

        {/* Spacer + Clear */}
        {hasActiveFilters && (
          <>
            <div className="flex-1" />
            <Button
              variant="ghost"
              size="sm"
              onClick={() => onFiltersChange({})}
              className="h-7 px-2 text-xs text-muted-foreground"
            >
              <X className="mr-1 h-3 w-3" />
              Limpar
            </Button>
          </>
        )}
      </div>
    </div>
  );
}
