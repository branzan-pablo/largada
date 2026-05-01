"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { BarChart3, Check, MapPin, MapPinOff, Pencil, Plus, Star, Trash2 } from "lucide-react";
import { formatDateShort } from "@/lib/date";
import { RACE_STATUSES, RACE_ORIGINS } from "@/lib/constants";
import { isWithinRegion } from "@/lib/geo";
import { toast } from "sonner";

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
  views: number;
  clicks: number;
  latitude: number;
  longitude: number;
}

function formatCtr(views: number, clicks: number): string {
  if (views === 0) return "—";
  return `${((clicks / views) * 100).toFixed(1)}%`;
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

function hasCoords(race: RaceRow) {
  return !(race.latitude === 0 && race.longitude === 0);
}

function isOutsideRegion(race: RaceRow) {
  return hasCoords(race) && !isWithinRegion(race.latitude, race.longitude);
}

export function AdminRacesTable({ races }: { races: RaceRow[] }) {
  const router = useRouter();
  const [statusFilter, setStatusFilter] = useState("all");
  const [originFilter, setOriginFilter] = useState("all");
  const [coordsFilter, setCoordsFilter] = useState(false);
  const [outsideFilter, setOutsideFilter] = useState(false);
  const [loadingId, setLoadingId] = useState<string | null>(null);
  const [removedIds, setRemovedIds] = useState<Set<string>>(new Set());
  const [localUpdates, setLocalUpdates] = useState<Record<string, Partial<RaceRow>>>({});

  const filtered = races.filter((r) => {
    if (removedIds.has(r.id)) return false;
    if (statusFilter !== "all" && r.status !== statusFilter) return false;
    if (originFilter !== "all" && r.origin !== originFilter) return false;
    if (coordsFilter && hasCoords(r)) return false;
    if (outsideFilter && !isOutsideRegion(r)) return false;
    return true;
  });

  async function handleReview(raceId: string, action: "approve" | "reject") {
    setLoadingId(raceId);
    try {
      const res = await fetch(`/api/races/${raceId}/review`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action }),
      });
      if (!res.ok) {
        const data = await res.json();
        toast.error(data.error ?? "Erro ao atualizar corrida");
        return;
      }
      setLocalUpdates((prev) => ({ ...prev, [raceId]: { status: "confirmed" } }));
      toast.success("Corrida aprovada com sucesso");
      router.refresh();
    } finally {
      setLoadingId(null);
    }
  }

  async function handleDelete(raceId: string, raceName: string) {
    if (!window.confirm(`Excluir "${raceName}"? Esta ação não pode ser desfeita.`)) return;
    setLoadingId(raceId);
    try {
      const res = await fetch(`/api/races/${raceId}`, { method: "DELETE" });
      if (!res.ok) {
        const data = await res.json();
        toast.error(data.error ?? "Erro ao excluir corrida");
        return;
      }
      setRemovedIds((prev) => new Set(prev).add(raceId));
      toast.success("Corrida excluída com sucesso");
      router.refresh();
    } finally {
      setLoadingId(null);
    }
  }

  return (
    <>
      <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:flex-wrap sm:items-center sm:justify-between">
        <div className="flex flex-col gap-2 sm:flex-row sm:flex-wrap sm:items-center sm:gap-3">
          {/* Status filter */}
          <div className="flex items-center gap-2 min-w-0">
            <span className="shrink-0 text-xs font-medium text-muted-foreground">Status:</span>
            <div className="flex flex-wrap gap-1 rounded-lg bg-muted p-1">
              {STATUS_FILTERS.map((f) => (
                <button
                  key={f.value}
                  onClick={() => setStatusFilter(f.value)}
                  className={`shrink-0 rounded-full px-3 py-1 text-xs font-medium transition-colors ${statusFilter === f.value
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
            <div className="flex flex-wrap gap-1 rounded-lg bg-muted p-1">
              {ORIGIN_FILTERS.map((f) => (
                <button
                  key={f.value}
                  onClick={() => setOriginFilter(f.value)}
                  className={`shrink-0 rounded-full px-3 py-1 text-xs font-medium transition-colors ${originFilter === f.value
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
            className={`flex items-center gap-1 rounded-full px-3 py-1 text-xs font-medium transition-colors ${coordsFilter
              ? "bg-amber-100 text-amber-800"
              : "text-muted-foreground hover:text-foreground"
              }`}
          >
            <MapPinOff className="h-3.5 w-3.5" />
            Sem Coordenadas
          </button>
          {/* Outside region filter */}
          <button
            onClick={() => setOutsideFilter((v) => !v)}
            className={`flex items-center gap-1 rounded-full px-3 py-1 text-xs font-medium transition-colors ${outsideFilter
              ? "bg-red-100 text-red-800"
              : "text-muted-foreground hover:text-foreground"
              }`}
          >
            <MapPin className="h-3.5 w-3.5" />
            Fora da Região
          </button>
        </div>

        <div className="flex items-center gap-3 self-end sm:self-auto">
          <span className="text-xs text-muted-foreground">
            {statusFilter !== "all" || originFilter !== "all" || coordsFilter || outsideFilter || removedIds.size > 0
              ? `${filtered.length} de ${races.length} corridas`
              : `${filtered.length} corridas`}
          </span>
          <Button asChild size="sm">
          <Link href="/admin/corridas/nova">
            <Plus className="mr-2 h-4 w-4" />
            Nova Corrida
          </Link>
        </Button>
        </div>
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
              <th className="hidden px-4 py-3 text-right font-medium md:table-cell">Views</th>
              <th className="hidden px-4 py-3 text-right font-medium md:table-cell">Cliques</th>
              <th className="hidden px-4 py-3 text-right font-medium lg:table-cell">CTR</th>
              <th className="px-3 sm:px-4 py-3 text-right font-medium">Ação</th>
            </tr>
          </thead>
          <tbody>
            {filtered.map((raw) => {
              const race = { ...raw, ...localUpdates[raw.id] };
              return (
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
                    {!hasCoords(race) && (
                      <span title="Sem coordenadas — defina a cidade para esta corrida">
                        <MapPinOff className="h-3.5 w-3.5 text-amber-500 shrink-0" />
                      </span>
                    )}
                    {isOutsideRegion(race) && (
                      <span title="Fora da região (>200km)">
                        <MapPinOff className="h-3.5 w-3.5 text-red-500 shrink-0" />
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
                  {race.views}
                </td>
                <td className="hidden px-4 py-3 text-right md:table-cell">
                  {race.clicks}
                </td>
                <td className="hidden px-4 py-3 text-right lg:table-cell text-xs text-muted-foreground">
                  {formatCtr(race.views, race.clicks)}
                </td>
                <td className="px-3 sm:px-4 py-3 text-right">
                  <div className="flex items-center justify-end gap-1">
                    {race.status === "pending_review" && (
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-7 w-7 text-green-600 hover:text-green-700 hover:bg-green-50"
                        title="Aprovar"
                        disabled={loadingId === race.id}
                        onClick={() => handleReview(race.id, "approve")}
                      >
                        <Check className="h-4 w-4" />
                      </Button>
                    )}
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-7 w-7"
                      title="Analytics"
                      asChild
                    >
                      <Link href={`/perfil/minhas-corridas/${race.id}/analytics`}>
                        <BarChart3 className="h-4 w-4" />
                      </Link>
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-7 w-7"
                      title="Editar"
                      asChild
                    >
                      <Link href={`/admin/corridas/${race.id}/editar`}>
                        <Pencil className="h-4 w-4" />
                      </Link>
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-7 w-7 text-red-600 hover:text-red-700 hover:bg-red-50"
                      title="Excluir"
                      disabled={loadingId === race.id}
                      onClick={() => handleDelete(race.id, race.name)}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </td>
              </tr>
              );
            })}
            {filtered.length === 0 && (
              <tr>
                <td colSpan={10} className="px-4 py-8 text-center text-muted-foreground">
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
