"use client";

import { useState, useRef, useCallback, useEffect, useId } from "react";
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
  label?: string;
}

const DEBOUNCE_MS = 300;
const MIN_QUERY_LEN = 2;

export function CityAutocomplete({
  onSelect,
  onClear,
  initialCity,
  placeholder = "Digite sua cidade...",
  inputClassName,
  label = "Cidade",
}: CityAutocompleteProps) {
  const [query, setQuery] = useState(initialCity ?? "");
  const [results, setResults] = useState<City[]>([]);
  const [isOpen, setIsOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [selectedId, setSelectedId] = useState<string | null>(initialCity ? "initial" : null);
  const [activeIndex, setActiveIndex] = useState(-1);
  const inputId = useId();
  const listboxId = `${inputId}-listbox`;

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
      setActiveIndex(-1);
      return;
    }

    // Serve from cache immediately — no network, no loading state.
    const cached = cacheRef.current.get(q);
    if (cached) {
      setResults(cached);
      setIsOpen(cached.length > 0);
      setActiveIndex(-1);
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
      setActiveIndex(-1);
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
      setActiveIndex(-1);
      return;
    }

    timerRef.current = setTimeout(() => search(value), DEBOUNCE_MS);
  }

  function handleSelect(city: City) {
    setQuery(`${city.name} - ${city.state_code}`);
    setSelectedId(city.id);
    setResults([]);
    setIsOpen(false);
    setActiveIndex(-1);
    onSelect(city);
  }

  function handleKeyDown(event: React.KeyboardEvent<HTMLInputElement>) {
    if (event.key === "Escape") {
      setIsOpen(false);
      setActiveIndex(-1);
      return;
    }
    if (!results.length || !["ArrowDown", "ArrowUp", "Enter"].includes(event.key)) return;
    if (event.key === "Enter") {
      if (isOpen && activeIndex >= 0) {
        event.preventDefault();
        handleSelect(results[activeIndex]);
      }
      return;
    }
    event.preventDefault();
    setIsOpen(true);
    setActiveIndex((current) => {
      if (event.key === "ArrowDown") return current >= results.length - 1 ? 0 : current + 1;
      return current <= 0 ? results.length - 1 : current - 1;
    });
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
        <label htmlFor={inputId} className="sr-only">{label}</label>
        <MapPin className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" aria-hidden="true" />
        <Input
          id={inputId}
          role="combobox"
          aria-autocomplete="list"
          aria-expanded={isOpen}
          aria-controls={listboxId}
          aria-activedescendant={activeIndex >= 0 ? `${listboxId}-option-${activeIndex}` : undefined}
          autoComplete="off"
          value={query}
          onChange={handleChange}
          onKeyDown={handleKeyDown}
          onFocus={() => {
            if (results.length > 0 && !selectedId) setIsOpen(true);
          }}
          placeholder={placeholder}
          className={cn("pl-9", inputClassName)}
        />
        {isLoading && (
          <><Loader2 className="absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 animate-spin text-gray-400 motion-reduce:animate-none" aria-hidden="true" /><span className="sr-only" role="status">Buscando cidades</span></>
        )}
      </div>

      {isOpen && results.length > 0 && (
        <ul id={listboxId} role="listbox" aria-label="Cidades encontradas" className="absolute z-50 mt-1 w-full rounded-xl border border-slate-200 bg-white py-1 shadow-xl">
          {results.map((city, index) => (
            <li
              key={city.id}
              id={`${listboxId}-option-${index}`}
              role="option"
              aria-selected={activeIndex === index}
              onMouseDown={(event) => { event.preventDefault(); handleSelect(city); }}
              onMouseEnter={() => setActiveIndex(index)}
              className={cn(
                "flex cursor-pointer items-center justify-between px-3 py-2.5 text-sm",
                activeIndex === index ? "bg-[#FFF1EB] text-[#A93400]" : "hover:bg-slate-50",
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
