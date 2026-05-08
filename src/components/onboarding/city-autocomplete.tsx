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
  /** Extra classes merged into the inner <Input> — use to match surrounding context. */
  inputClassName?: string;
}

const DEBOUNCE_MS = 300;
const MIN_QUERY_LEN = 2;

export function CityAutocomplete({
  onSelect,
  onClear,
  initialCity,
  placeholder = "Digite sua cidade...",
  inputClassName,
}: CityAutocompleteProps) {
  const [query, setQuery] = useState(initialCity ?? "");
  const [results, setResults] = useState<City[]>([]);
  const [isOpen, setIsOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [selectedId, setSelectedId] = useState<string | null>(null);

  const timerRef = useRef<ReturnType<typeof setTimeout>>(undefined);
  // Tracks the latest search invocation — stale responses are discarded.
  const versionRef = useRef(0);
  // Holds the AbortController of the in-flight request.
  const abortRef = useRef<AbortController | null>(null);
  // Session-level cache: avoids re-fetching identical queries.
  const cacheRef = useRef<Map<string, City[]>>(new Map());
  const wrapperRef = useRef<HTMLDivElement>(null);

  const search = useCallback(async (q: string) => {
    if (q.length < MIN_QUERY_LEN) {
      setResults([]);
      setIsOpen(false);
      return;
    }

    // Serve from cache immediately — no network, no loading state.
    const cached = cacheRef.current.get(q);
    if (cached) {
      setResults(cached);
      setIsOpen(cached.length > 0);
      return;
    }

    // Cancel the previous in-flight request before starting a new one.
    abortRef.current?.abort();
    abortRef.current = new AbortController();

    // Stamp this invocation so older responses can be discarded.
    const version = ++versionRef.current;

    setIsLoading(true);
    try {
      const res = await fetch(
        `/api/cities/search?q=${encodeURIComponent(q)}&limit=8`,
        { signal: abortRef.current.signal }
      );
      const data = await res.json();
      const cities: City[] = Array.isArray(data) ? data : [];

      // Discard if a newer search has already been dispatched.
      if (version !== versionRef.current) return;

      cacheRef.current.set(q, cities);
      setResults(cities);
      setIsOpen(cities.length > 0);
    } catch (err) {
      // AbortError is expected — a newer request was started, ignore it.
      if ((err as Error).name === "AbortError") return;
      if (version === versionRef.current) setResults([]);
    } finally {
      // Only clear the spinner for the request that is still current.
      if (version === versionRef.current) setIsLoading(false);
    }
  }, []);

  function handleChange(e: React.ChangeEvent<HTMLInputElement>) {
    const value = e.target.value;
    setQuery(value);

    if (selectedId) {
      setSelectedId(null);
      onClear?.();
    }

    clearTimeout(timerRef.current);

    if (value.length < MIN_QUERY_LEN) {
      // Cancel in-flight request and reset UI immediately.
      abortRef.current?.abort();
      ++versionRef.current; // Discard any pending response.
      setResults([]);
      setIsOpen(false);
      setIsLoading(false);
      return;
    }

    timerRef.current = setTimeout(() => search(value), DEBOUNCE_MS);
  }

  function handleSelect(city: City) {
    setQuery(`${city.name} - ${city.state_code}`);
    setSelectedId(city.id);
    setResults([]);
    setIsOpen(false);
    onSelect(city);
  }

  // Close dropdown on outside click.
  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (wrapperRef.current && !wrapperRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // Cancel pending timer and in-flight request on unmount.
  useEffect(() => {
    return () => {
      clearTimeout(timerRef.current);
      abortRef.current?.abort();
    };
  }, []);

  return (
    <div ref={wrapperRef} className="relative">
      <div className="relative">
        <MapPin className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
        <Input
          value={query}
          onChange={handleChange}
          onFocus={() => {
            if (results.length > 0 && !selectedId) setIsOpen(true);
          }}
          placeholder={placeholder}
          className={cn("pl-9", inputClassName)}
        />
        {isLoading && (
          <Loader2 className="absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 animate-spin text-gray-400" />
        )}
      </div>

      {isOpen && results.length > 0 && (
        <ul className="absolute z-50 mt-1 w-full rounded-md border border-gray-200 bg-white py-1 shadow-lg">
          {results.map((city) => (
            <li
              key={city.id}
              onClick={() => handleSelect(city)}
              className={cn(
                "flex cursor-pointer items-center justify-between px-3 py-2 text-sm hover:bg-gray-50",
                selectedId === city.id && "bg-gray-50"
              )}
            >
              <span>{city.name}</span>
              <span className="rounded bg-gray-100 px-1.5 py-0.5 text-xs text-gray-500">
                {city.state_code}
              </span>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
