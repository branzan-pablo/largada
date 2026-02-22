"use client";

import { ToggleChip } from "@/components/ui/toggle-chip";
import { RADIUS_OPTIONS } from "@/lib/constants";

interface RadiusSelectorProps {
  value: number;
  onChange: (radius: number) => void;
  cityName?: string;
}

export function RadiusSelector({
  value,
  onChange,
  cityName,
}: RadiusSelectorProps) {
  return (
    <div className="space-y-3">
      <div className="flex flex-wrap gap-2">
        {RADIUS_OPTIONS.map((km) => (
          <ToggleChip
            key={km}
            label={`${km}km`}
            active={value === km}
            onClick={() => onChange(km)}
          />
        ))}
      </div>
      {cityName && (
        <p className="text-sm text-[#6B7280]">
          Corridas em até <span className="font-medium text-[#0D1B2A]">{value}km</span> de{" "}
          {cityName}
        </p>
      )}
    </div>
  );
}
