"use client";

import Link from "next/link";
import { MapPin, X } from "lucide-react";

interface RadiusBannerProps {
  radius: number;
  onRemove: () => void;
}

export function RadiusBanner({ radius, onRemove }: RadiusBannerProps) {
  return (
    <div className="mt-4 flex items-center gap-2 rounded-lg border border-blue-100 bg-blue-50 px-4 py-2.5 text-sm text-blue-700">
      <MapPin className="h-4 w-4 shrink-0" />
      <span className="flex-1">
        Mostrando corridas até <strong>{radius}km</strong> de você.{" "}
        <Link href="/perfil" className="underline underline-offset-2 hover:text-blue-800 transition-colors">
          Alterar no perfil
        </Link>
      </span>
      <button
        onClick={onRemove}
        className="-mr-1 flex h-9 w-9 shrink-0 items-center justify-center rounded-full text-blue-400 transition-colors hover:bg-blue-100 hover:text-blue-600"
        aria-label="Remover filtro de raio"
      >
        <X className="h-4 w-4" />
      </button>
    </div>
  );
}
