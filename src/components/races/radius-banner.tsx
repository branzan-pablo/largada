"use client";

import { MapPin, X } from "lucide-react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { RADIUS_OPTIONS } from "@/lib/constants";

interface RadiusBannerProps {
  radius: number;
  onRadiusChange: (radius: number) => void;
  onRemove: () => void;
}

export function RadiusBanner({ radius, onRadiusChange, onRemove }: RadiusBannerProps) {
  return (
    <div className="mt-4 flex items-center gap-2 rounded-lg border border-blue-100 bg-blue-50 px-4 py-2.5 text-sm text-blue-700">
      <MapPin className="h-4 w-4 shrink-0" />
      <span className="flex-1">
        Mostrando corridas até <strong>{radius}km</strong> de você
      </span>
      <Select
        value={String(radius)}
        onValueChange={(v) => onRadiusChange(Number(v))}
      >
        <SelectTrigger className="h-7 w-auto gap-1 border-blue-200 bg-blue-100/50 text-blue-700 text-xs font-medium px-2.5 focus:ring-0 focus:ring-offset-0 hover:bg-blue-100 transition-colors rounded-md">
          <SelectValue placeholder="Alterar" />
        </SelectTrigger>
        <SelectContent>
          {RADIUS_OPTIONS.map((r) => (
            <SelectItem key={r} value={String(r)}>
              {r}km
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
      <button
        onClick={onRemove}
        className="ml-1 rounded-md p-1 text-blue-400 hover:bg-blue-100 hover:text-blue-600 transition-colors"
        aria-label="Remover filtro de raio"
      >
        <X className="h-3.5 w-3.5" />
      </button>
    </div>
  );
}
