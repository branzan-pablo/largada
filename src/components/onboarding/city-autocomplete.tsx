"use client";

import { useState, useRef, useCallback, useEffect } from "react";
import { Input } from "@/components/ui/input";
import { MapPin, Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";

interface City {
  id: string;
  name: string;
  state_code: string;
  slug: string;
  latitude: number;
  longitude: number;
}

interface CityAutocompleteProps {
  onSelect: (city: City) => void;
  onClear?: () => void;
  initialCity?: string | null;
  placeholder?: string;
}

export function CityAutocomplete({
  onSelect,
  onClear,
  initialCity,
  placeholder = "Digite sua cidade...",
}: CityAutocompleteProps) {
  const [query, setQuery] = useState(initialCity ?? "");
  const [results, setResults] = useState<City[]>([]);
  const [isOpen, setIsOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const timerRef = useRef<ReturnType<typeof setTimeout>>(undefined);
  const wrapperRef = useRef<HTMLDivElement>(null);

  const search = useCallback(async (q: string) => {
    if (q.length < 2) {
      setResults([]);
      setIsOpen(false);
      return;
    }

    setIsLoading(true);
    try {
      const res = await fetch(
        `/api/cities/search?q=${encodeURIComponent(q)}&limit=8`
      );
      const data = await res.json();
      setResults(Array.isArray(data) ? data : []);
      setIsOpen(true);
    } catch {
      setResults([]);
    } finally {
      setIsLoading(false);
    }
  }, []);

  function handleChange(e: React.ChangeEvent<HTMLInputElement>) {
    const value = e.target.value;
    setQuery(value);
    if (selectedId) {
      setSelectedId(null);
      onClear?.();
    }

    if (timerRef.current) clearTimeout(timerRef.current);
    timerRef.current = setTimeout(() => search(value), 300);
  }

  function handleSelect(city: City) {
    setQuery(`${city.name} — ${city.state_code}`);
    setSelectedId(city.id);
    setResults([]);
    setIsOpen(false);
    onSelect(city);
  }

  // Close dropdown on outside click
  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (wrapperRef.current && !wrapperRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  return (
    <div ref={wrapperRef} className="relative">
      <div className="relative">
        <MapPin className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-zinc-500" />
        <Input
          value={query}
          onChange={handleChange}
          onFocus={() => {
            if (results.length > 0 && !selectedId) setIsOpen(true);
          }}
          placeholder={placeholder}
          className="pl-9"
        />
        {isLoading && (
          <Loader2 className="absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 animate-spin text-zinc-500" />
        )}
      </div>

      {isOpen && results.length > 0 && (
        <ul className="absolute z-50 mt-1 w-full rounded-md border border-zinc-800 bg-zinc-950 py-1 shadow-lg">
          {results.map((city) => (
            <li
              key={city.id}
              onClick={() => handleSelect(city)}
              className={cn(
                "flex cursor-pointer items-center justify-between px-3 py-2 text-sm hover:bg-zinc-900",
                selectedId === city.id && "bg-zinc-900"
              )}
            >
              <span>{city.name}</span>
              <span className="rounded bg-zinc-800 px-1.5 py-0.5 text-xs text-zinc-400">
                {city.state_code}
              </span>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
