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
import { Checkbox } from "@/components/ui/checkbox";
import { Slider } from "@/components/ui/slider";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { SlidersHorizontal } from "lucide-react";
import { DISTANCES, REGION_CITIES } from "@/lib/constants";
import type { RaceFilters as Filters } from "@/types/race";

interface RaceFiltersMobileProps {
  filters: Filters;
  onFiltersChange: (filters: Filters) => void;
  isLoggedIn: boolean;
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
        <SheetContent side="bottom" className="h-[85vh] overflow-y-auto">
          <SheetHeader>
            <SheetTitle>Filtros</SheetTitle>
          </SheetHeader>
          <div className="mt-6 space-y-6">
            {/* City */}
            <div className="space-y-2">
              <Label>Cidade</Label>
              <Select
                value={filters.city ?? "all"}
                onValueChange={(v) =>
                  onFiltersChange({
                    ...filters,
                    city: v === "all" ? undefined : v,
                  })
                }
              >
                <SelectTrigger>
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
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-2">
                <Label>De</Label>
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
                <Label>Até</Label>
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
            <div className="space-y-3">
              <Label>Distâncias</Label>
              <div className="flex flex-wrap gap-4">
                {DISTANCES.map((d) => (
                  <label key={d} className="flex items-center gap-2 text-sm">
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

            {/* Prize */}
            <div className="space-y-3">
              <Label>Premiação</Label>
              <div className="flex gap-4">
                {(["money", "trophy"] as const).map((type) => (
                  <label
                    key={type}
                    className="flex items-center gap-2 text-sm"
                  >
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
              <div className="space-y-3">
                <Label>Raio: {filters.radius ?? "Sem limite"} km</Label>
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

            <div className="flex gap-3 pt-4">
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
