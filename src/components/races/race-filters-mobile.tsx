"use client";

import { useState } from "react";
import { MapPin, SlidersHorizontal } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle, SheetTrigger } from "@/components/ui/sheet";
import { CityAutocomplete } from "@/components/onboarding/city-autocomplete";
import { DEFAULT_DISTANCES } from "@/lib/constants";
import { getActiveFilterCount } from "@/lib/race-filter-controls";
import type { RaceFilters as Filters } from "@/types/race";
import { DateFilterFields, DistanceFilterFields, PrizeFilterFields } from "./race-filter-fields";

interface RaceFiltersMobileProps {
  filters: Filters;
  onFiltersChange: (filters: Filters) => void;
  availableDistances?: string[];
}

export function RaceFiltersMobile({ filters, onFiltersChange, availableDistances }: RaceFiltersMobileProps) {
  const [open, setOpen] = useState(false);
  const [draft, setDraft] = useState<Filters>(filters);
  const activeCount = getActiveFilterCount(filters);
  const distanceOptions = [...new Set([...DEFAULT_DISTANCES, ...(availableDistances ?? [])])].sort((a, b) => parseFloat(a) - parseFloat(b));

  const handleOpenChange = (nextOpen: boolean) => {
    if (nextOpen) setDraft(filters);
    setOpen(nextOpen);
  };

  return (
    <div className="lg:hidden">
      <Sheet open={open} onOpenChange={handleOpenChange}>
        <SheetTrigger asChild>
          <Button variant="outline" className="h-12 shrink-0 gap-2 rounded-xl border-slate-300 bg-white px-3 font-bold text-[#0D1B2A] shadow-sm hover:border-[#FF4D00]/40 hover:bg-[#FFF8F5]">
            <SlidersHorizontal className="h-4 w-4" aria-hidden="true" />
            Filtros
            {activeCount > 0 && <span className="flex h-5 min-w-5 items-center justify-center rounded-full bg-[#FF4D00] px-1 text-[11px] font-black text-white" aria-label={`${activeCount} filtros ativos`}>{activeCount}</span>}
          </Button>
        </SheetTrigger>
        <SheetContent side="bottom" className="flex max-h-[90dvh] flex-col gap-0 rounded-t-[24px] border-t-0 bg-white px-0 pb-0 text-slate-900 shadow-[0_-24px_70px_-30px_rgba(13,27,42,0.5)]">
          <div className="mx-auto mt-2 h-1 w-10 rounded-full bg-slate-200" aria-hidden="true" />
          <SheetHeader className="shrink-0 border-b border-slate-200 px-5 pb-4 pt-3 text-left">
            <SheetTitle className="text-xl font-black tracking-tight text-[#0D1B2A]">Encontre sua próxima prova</SheetTitle>
            <SheetDescription className="text-sm text-slate-500">Combine os filtros e confirme para atualizar a lista.</SheetDescription>
          </SheetHeader>

          <div className="flex-1 space-y-7 overflow-y-auto px-5 py-5">
            <section aria-labelledby="mobile-city-title">
              <h3 id="mobile-city-title" className="mb-3 flex items-center gap-2 text-xs font-black uppercase tracking-[0.14em] text-slate-500"><MapPin className="h-4 w-4" aria-hidden="true" /> Cidade</h3>
              <CityAutocomplete key={draft.city ?? "all-cities"} label="Buscar cidade" initialCity={draft.city} onSelect={(city) => setDraft({ ...draft, city: city.name })} onClear={() => setDraft({ ...draft, city: undefined })} placeholder="Digite ao menos 2 letras" inputClassName="h-12 rounded-xl border-slate-200 bg-slate-50 focus-visible:ring-[#FF4D00]" />
            </section>

            <section aria-labelledby="mobile-date-title">
              <h3 id="mobile-date-title" className="mb-3 text-xs font-black uppercase tracking-[0.14em] text-slate-500">Quando</h3>
              <DateFilterFields filters={draft} onChange={setDraft} />
            </section>

            <section aria-labelledby="mobile-distance-title">
              <h3 id="mobile-distance-title" className="mb-3 text-xs font-black uppercase tracking-[0.14em] text-slate-500">Distância</h3>
              <DistanceFilterFields filters={draft} onChange={setDraft} options={distanceOptions} />
            </section>

            <section aria-labelledby="mobile-prize-title">
              <h3 id="mobile-prize-title" className="mb-3 text-xs font-black uppercase tracking-[0.14em] text-slate-500">Premiação</h3>
              <PrizeFilterFields filters={draft} onChange={setDraft} />
            </section>
          </div>

          <div className="grid shrink-0 grid-cols-[0.9fr_1.35fr] gap-2 border-t border-slate-200 bg-white/95 px-4 pb-[max(0.9rem,env(safe-area-inset-bottom))] pt-3 backdrop-blur">
            <Button type="button" variant="outline" className="h-12 rounded-xl border-slate-300 font-bold text-slate-700" onClick={() => setDraft({})}>Limpar filtros</Button>
            <Button type="button" className="h-12 rounded-xl bg-[#FF4D00] font-black text-white shadow-[0_8px_22px_-10px_rgba(255,77,0,0.9)] hover:bg-[#E64500]" onClick={() => { onFiltersChange(draft); setOpen(false); }}>Ver resultados</Button>
          </div>
        </SheetContent>
      </Sheet>
    </div>
  );
}
