"use client";

import { useState } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { MapPinOff, Plus, Star } from "lucide-react";
import { formatDateShort } from "@/lib/date";
import { RACE_STATUSES, RACE_ORIGINS } from "@/lib/constants";

interface RaceRow {
  id: string;
  name: string;
  city: string;
  state: string;
  date: string;
  status: string;
  origin: string;
  rsvp_count: number;
  is_promoted: boolean;
  clicks: number;
  latitude: number;
  longitude: number;
}

const STATUS_FILTERS = [
  { value: "all", label: "Todas" },
  { value: "pending_review", label: "Pendentes" },
  { value: "confirmed", label: "Confirmadas" },
  { value: "cancelled", label: "Canceladas" },
] as const;

const ORIGIN_FILTERS = [
  { value: "all", label: "Todas" },
  { value: "admin", label: "Admin" },
  { value: "scraper", label: "Scraper" },
  { value: "approved_suggestion", label: "Sugestão" },
] as const;

export function AdminRacesTable({ races }: { races: RaceRow[] }) {
  const [statusFilter, setStatusFilter] = useState("all");
  const [originFilter, setOriginFilter] = useState("all");
  const [coordsFilter, setCoordsFilter] = useState(false);
  // const [approvingId, setApprovingId] = useState<string | null>(null);

  const filtered = races.filter((r) => {
    if (statusFilter !== "all" && r.status !== statusFilter) return false;
    if (originFilter !== "all" && r.origin !== originFilter) return false;
    if (coordsFilter && !(r.latitude === 0 && r.longitude === 0)) return false;
    return true;
  });

  return (
    <>
      <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:flex-wrap sm:items-center sm:justify-between">
        <div className="flex flex-col gap-2 sm:flex-row sm:flex-wrap sm:items-center sm:gap-3">
          {/* Status filter */}
          <div className="flex items-center gap-2 min-w-0">
            <span className="shrink-0 text-xs font-medium text-muted-foreground">Status:</span>
            <div className="flex gap-1 overflow-x-auto rounded-lg bg-muted p-1">
              {STATUS_FILTERS.map((f) => (
                <button
                  key={f.value}
                  onClick={() => setStatusFilter(f.value)}
                  className={`shrink-0 rounded-md px-3 py-1 text-xs font-medium transition-colors ${statusFilter === f.value
                    ? "bg-background text-foreground shadow-sm"
                    : "text-muted-foreground hover:text-foreground"
                    }`}
                >
                  {f.label}
                </button>
              ))}
            </div>
          </div>
          {/* Origin filter */}
          <div className="flex items-center gap-2 min-w-0">
            <span className="shrink-0 text-xs font-medium text-muted-foreground">Origem:</span>
            <div className="flex gap-1 overflow-x-auto rounded-lg bg-muted p-1">
              {ORIGIN_FILTERS.map((f) => (
                <button
                  key={f.value}
                  onClick={() => setOriginFilter(f.value)}
                  className={`shrink-0 rounded-md px-3 py-1 text-xs font-medium transition-colors ${originFilter === f.value
                    ? "bg-background text-foreground shadow-sm"
                    : "text-muted-foreground hover:text-foreground"
                    }`}
                >
                  {f.label}
                </button>
              ))}
            </div>
          </div>
          {/* Missing coords filter */}
          <button
            onClick={() => setCoordsFilter((v) => !v)}
            className={`flex items-center gap-1 rounded-md px-3 py-1 text-xs font-medium transition-colors ${coordsFilter
              ? "bg-amber-100 text-amber-800"
              : "text-muted-foreground hover:text-foreground"
              }`}
          >
            <MapPinOff className="h-3.5 w-3.5" />
            Sem Coordenadas
          </button>
        </div>

        <Button asChild size="sm" className="self-end sm:self-auto">
          <Link href="/admin/corridas/nova">
            <Plus className="mr-2 h-4 w-4" />
            Nova Corrida
          </Link>
        </Button>
      </div>

      <div className="rounded-md border overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b bg-muted/50">
              <th className="px-3 sm:px-4 py-3 text-left font-medium">Nome</th>
              <th className="hidden px-4 py-3 text-left font-medium sm:table-cell">Cidade</th>
              <th className="hidden px-4 py-3 text-left font-medium md:table-cell">Data</th>
              <th className="px-3 sm:px-4 py-3 text-left font-medium">Status</th>
              <th className="hidden px-4 py-3 text-left font-medium lg:table-cell">Origem</th>
              <th className="hidden px-4 py-3 text-right font-medium sm:table-cell">RSVPs</th>
              <th className="hidden px-4 py-3 text-right font-medium md:table-cell">Cliques</th>
              <th className="px-3 sm:px-4 py-3 text-right font-medium">Ação</th>
            </tr>
          </thead>
          <tbody>
            {filtered.map((race) => (
              <tr key={race.id} className="border-b">
                <td className="px-3 sm:px-4 py-3 font-medium">
                  <div className="flex items-start gap-1.5">
                    {race.is_promoted && (
                      <Star className="w-3.5 h-3.5 mt-0.5 fill-yellow-500 text-yellow-500 shrink-0" />
                    )}
                    <div className="min-w-0">
                      <span className="line-clamp-2">{race.name}</span>
                      <span className="block text-xs text-muted-foreground sm:hidden">{race.city} — {race.state}</span>
                    </div>
                  </div>
                </td>
                <td className="hidden px-4 py-3 sm:table-cell">
                  <span className="flex items-center gap-1">
                    {`${race.city} — ${race.state}`}
                    {race.latitude === 0 && race.longitude === 0 && (
                      <span title="Sem coordenadas — defina a cidade para esta corrida">
                        <MapPinOff className="h-3.5 w-3.5 text-amber-500 shrink-0" />
                      </span>
                    )}
                  </span>
                </td>
                <td className="hidden px-4 py-3 md:table-cell">
                  {formatDateShort(race.date)}
                </td>
                <td className="px-3 sm:px-4 py-3">
                  <StatusBadge status={race.status} />
                </td>
                <td className="hidden px-4 py-3 lg:table-cell">
                  <span className="text-xs text-muted-foreground">
                    {RACE_ORIGINS[race.origin as keyof typeof RACE_ORIGINS] ?? race.origin}
                  </span>
                </td>
                <td className="hidden px-4 py-3 text-right sm:table-cell">
                  {race.rsvp_count}
                </td>
                <td className="hidden px-4 py-3 text-right md:table-cell">
                  {race.clicks}
                </td>
                <td className="px-3 sm:px-4 py-3 text-right">
                  <Button variant="ghost" size="sm" asChild>
                    <Link href={`/admin/corridas/${race.id}/editar`}>
                      Editar
                    </Link>
                  </Button>
                </td>
              </tr>
            ))}
            {filtered.length === 0 && (
              <tr>
                <td colSpan={8} className="px-4 py-8 text-center text-muted-foreground">
                  Nenhuma corrida encontrada.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </>
  );
}

function StatusBadge({ status }: { status: string }) {
  const variants: Record<string, string> = {
    confirmed: "bg-green-50 text-green-700 border-green-200",
    postponed: "bg-yellow-50 text-yellow-700 border-yellow-200",
    cancelled: "bg-red-50 text-red-700 border-red-200",
    pending_review: "bg-amber-50 text-amber-700 border-amber-200",
  };

  return (
    <Badge variant="outline" className={variants[status] ?? ""}>
      {RACE_STATUSES[status as keyof typeof RACE_STATUSES] ?? status}
    </Badge>
  );
}
