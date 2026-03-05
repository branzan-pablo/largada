"use client";

import { useState } from "react";
import { Input } from "@/components/ui/input";
import { ToggleChip } from "@/components/ui/toggle-chip";
import { RADIUS_OPTIONS } from "@/lib/constants";

const PRESETS = RADIUS_OPTIONS as readonly number[];

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
  const isPreset = PRESETS.includes(value);
  const [customActive, setCustomActive] = useState(!isPreset);
  const [customValue, setCustomValue] = useState(!isPreset ? String(value) : "");

  const isCustom = customActive || !isPreset;

  function handleCustomChange(raw: string) {
    setCustomValue(raw);
    const num = parseInt(raw, 10);
    if (!isNaN(num) && num >= 10 && num <= 500) {
      onChange(num);
    }
  }

  return (
    <div className="space-y-3">
      <div className="flex flex-wrap gap-2">
        {RADIUS_OPTIONS.map((km) => (
          <ToggleChip
            key={km}
            label={`${km}km`}
            active={!isCustom && value === km}
            onClick={() => {
              setCustomActive(false);
              setCustomValue("");
              onChange(km);
            }}
          />
        ))}
        <ToggleChip
          label="Raio personalizado"
          active={isCustom}
          onClick={() => {
            setCustomActive(true);
            setCustomValue(String(value));
          }}
        />
      </div>
      {isCustom && (
        <div className="flex items-center gap-2">
          <Input
            type="number"
            min={10}
            max={500}
            value={customValue}
            onChange={(e) => handleCustomChange(e.target.value)}
            placeholder="Ex: 75"
            className="w-24"
          />
          <span className="text-sm text-[#6B7280]">km</span>
        </div>
      )}
      {cityName && (
        <p className="text-sm text-[#6B7280]">
          Corridas em até <span className="font-medium text-[#0D1B2A]">{value}km</span> de{" "}
          {cityName}
        </p>
      )}
    </div>
  );
}
