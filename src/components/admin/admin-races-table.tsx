"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Plus, Star } from "lucide-react";
import { formatDateShort } from "@/lib/date";
import { RACE_STATUSES, RACE_ORIGINS } from "@/lib/constants";
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
  clicks: number;
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
  const router = useRouter();
  const [statusFilter, setStatusFilter] = useState("all");
  const [originFilter, setOriginFilter] = useState("all");
  const [approvingId, setApprovingId] = useState<string | null>(null);

  const filtered = races.filter((r) => {
    if (statusFilter !== "all" && r.status !== statusFilter) return false;
    if (originFilter !== "all" && r.origin !== originFilter) return false;
    return true;
  });

  async function handleApprove(raceId: string) {
    setApprovingId(raceId);
    try {
      const res = await fetch(`/api/races/${raceId}/review`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "approve" }),
      });
      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error || "Erro ao aprovar");
      }
      toast.success("Corrida aprovada!");
      router.refresh();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Erro ao aprovar");
    } finally {
      setApprovingId(null);
    }
  }

  return (
    <>
      <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
        <div className="flex flex-wrap items-center gap-3">
          {/* Status filter */}
          <div className="flex items-center gap-2">
            <span className="text-xs font-medium text-muted-foreground">Status:</span>
            <div className="flex gap-1 rounded-lg bg-muted p-1">
              {STATUS_FILTERS.map((f) => (
                <button
                  key={f.value}
                  onClick={() => setStatusFilter(f.value)}
                  className={`rounded-md px-3 py-1 text-xs font-medium transition-colors ${
                    statusFilter === f.value
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
          <div className="flex items-center gap-2">
            <span className="text-xs font-medium text-muted-foreground">Origem:</span>
            <div className="flex gap-1 rounded-lg bg-muted p-1">
              {ORIGIN_FILTERS.map((f) => (
                <button
                  key={f.value}
                  onClick={() => setOriginFilter(f.value)}
                  className={`rounded-md px-3 py-1 text-xs font-medium transition-colors ${
                    originFilter === f.value
                      ? "bg-background text-foreground shadow-sm"
                      : "text-muted-foreground hover:text-foreground"
                  }`}
                >
                  {f.label}
                </button>
              ))}
            </div>
          </div>
        </div>

        <Button asChild size="sm">
          <Link href="/admin/corridas/nova">
            <Plus className="mr-2 h-4 w-4" />
            Nova Corrida
          </Link>
        </Button>
      </div>

      <div className="rounded-md border">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b bg-muted/50">
              <th className="px-4 py-3 text-left font-medium">Nome</th>
              <th className="hidden px-4 py-3 text-left font-medium sm:table-cell">Cidade</th>
              <th className="hidden px-4 py-3 text-left font-medium md:table-cell">Data</th>
              <th className="px-4 py-3 text-left font-medium">Status</th>
              <th className="hidden px-4 py-3 text-left font-medium lg:table-cell">Origem</th>
              <th className="hidden px-4 py-3 text-right font-medium sm:table-cell">RSVPs</th>
              <th className="hidden px-4 py-3 text-right font-medium md:table-cell">Cliques</th>
              <th className="px-4 py-3 text-right font-medium">Ação</th>
            </tr>
          </thead>
          <tbody>
            {filtered.map((race) => (
              <tr key={race.id} className="border-b">
                <td className="px-4 py-3 font-medium">
                  <span className="flex items-center gap-1.5">
                    {race.is_promoted && (
                      <Star className="w-3.5 h-3.5 fill-yellow-500 text-yellow-500 shrink-0" />
                    )}
                    {race.name}
                  </span>
                </td>
                <td className="hidden px-4 py-3 sm:table-cell">
                  {`${race.city} — ${race.state}`}
                </td>
                <td className="hidden px-4 py-3 md:table-cell">
                  {formatDateShort(race.date)}
                </td>
                <td className="px-4 py-3">
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
                <td className="px-4 py-3 text-right">
                  <div className="flex items-center justify-end gap-1">
                    {race.status === "pending_review" && (
                      <Button
                        variant="default"
                        size="sm"
                        disabled={approvingId === race.id}
                        onClick={() => handleApprove(race.id)}
                        className="cursor-pointer"
                      >
                        {approvingId === race.id ? "..." : "Aprovar"}
                      </Button>
                    )}
                    <Button variant="ghost" size="sm" asChild>
                      <Link href={`/admin/corridas/${race.id}/editar`}>
                        Editar
                      </Link>
                    </Button>
                  </div>
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
