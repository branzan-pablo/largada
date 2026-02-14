"use client";

import { Search } from "lucide-react";

interface RaceSearchProps {
  value: string;
  onChange: (value: string) => void;
}

export function RaceSearch({ value, onChange }: RaceSearchProps) {
  return (
    <div className="relative group">
      <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-zinc-500 group-focus-within:text-zinc-300" />
      <input
        type="text"
        placeholder="Buscar por nome, cidade..."
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="w-full bg-zinc-900/50 border border-zinc-800 text-sm text-white rounded-lg pl-10 pr-4 py-2.5 focus:outline-none focus:border-zinc-600 placeholder:text-zinc-600 transition-colors"
      />
    </div>
  );
}
