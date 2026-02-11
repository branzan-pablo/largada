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
import { Slider } from "@/components/ui/slider";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { SlidersHorizontal } from "lucide-react";
import { DISTANCES, REGION_CITIES } from "@/lib/constants";
import { cn } from "@/lib/utils";
import type { RaceFilters as Filters } from "@/types/race";

interface RaceFiltersMobileProps {
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
        "rounded-full border px-3.5 py-1.5 text-sm font-medium transition-colors",
        active
          ? "border-primary bg-primary text-primary-foreground"
          : "border-border bg-background text-muted-foreground"
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
}: RaceFiltersMobileProps) {
  const [open, setOpen] = useState(false);

  const activeCount = [
    filters.city,
    filters.dateFrom || filters.dateTo,
    filters.distances?.length,
    filters.prizeType?.length,
    filters.radius,
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
          <Button variant="outline" size="sm" className="gap-2">
            <SlidersHorizontal className="h-4 w-4" />
            Filtros
            {activeCount > 0 && (
              <Badge className="ml-1 h-5 w-5 rounded-full p-0 text-xs">
                {activeCount}
              </Badge>
            )}
          </Button>
        </SheetTrigger>
        <SheetContent side="bottom" className="h-auto max-h-[85vh] overflow-y-auto px-5 pb-8">
          <SheetHeader>
            <SheetTitle>Filtros</SheetTitle>
          </SheetHeader>
          <div className="mt-5 space-y-5">
            {/* City */}
            <div className="space-y-2">
              <Label className="text-sm font-medium">Cidade</Label>
              <Select
                value={filters.city ?? "all"}
                onValueChange={(v) =>
                  onFiltersChange({
                    ...filters,
                    city: v === "all" ? undefined : v,
                  })
                }
              >
                <SelectTrigger className="w-full">
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
            </div>

            {/* Date Range */}
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-2">
                <Label className="text-sm font-medium">De</Label>
                <input
                  type="date"
                  className="flex h-10 w-full rounded-md border border-input bg-background px-3 text-sm"
                  value={filters.dateFrom ?? ""}
                  onChange={(e) =>
                    onFiltersChange({
                      ...filters,
                      dateFrom: e.target.value || undefined,
                    })
                  }
                />
              </div>
              <div className="space-y-2">
                <Label className="text-sm font-medium">Até</Label>
                <input
                  type="date"
                  className="flex h-10 w-full rounded-md border border-input bg-background px-3 text-sm"
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
              <Label className="text-sm font-medium">Distâncias</Label>
              <div className="flex flex-wrap gap-2">
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

            {/* Prize */}
            <div className="space-y-2">
              <Label className="text-sm font-medium">Premiação</Label>
              <div className="flex flex-wrap gap-2">
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
            </div>

            {/* Radius */}
            {isLoggedIn && (
              <div className="space-y-2">
                <Label className="text-sm font-medium">
                  Raio: {filters.radius ? `${filters.radius} km` : "Sem limite"}
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
                />
              </div>
            )}

            <div className="flex gap-3 pt-2">
              <Button className="flex-1" onClick={() => setOpen(false)}>
                Ver resultados
              </Button>
              <Button
                variant="outline"
                onClick={() => {
                  onFiltersChange({});
                  setOpen(false);
                }}
              >
                Limpar
              </Button>
            </div>
          </div>
        </SheetContent>
      </Sheet>
    </div>
  );
}
