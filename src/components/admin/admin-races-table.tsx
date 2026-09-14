"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Check, MapPin, MapPinOff, Pencil, Plus, X } from "lucide-react";
import { toast } from "sonner";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { RACE_ORIGINS, RACE_STATUSES } from "@/lib/constants";
import { formatDateShort } from "@/lib/date";
import { isWithinRegion } from "@/lib/geo";

interface RaceRow {
  id: string;
  name: string;
  city: string;
  state: string;
  date: string;
  status: string;
  origin: string;
  latitude: number;
  longitude: number;
}

const STATUS_FILTERS = [
  ["active", "Ativas"], ["all", "Todas"], ["pending_review", "Pendentes"],
  ["confirmed", "Confirmadas"], ["cancelled", "Canceladas"], ["rejected", "Rejeitadas"],
] as const;
const ORIGIN_FILTERS = [["all", "Todas"], ["admin", "Admin"], ["scraper", "Scraper"]] as const;
const hasCoords = (race: RaceRow) => !(race.latitude === 0 && race.longitude === 0);
const isOutsideRegion = (race: RaceRow) => hasCoords(race) && !isWithinRegion(race.latitude, race.longitude);

export function AdminRacesTable({ races }: { races: RaceRow[] }) {
  const router = useRouter();
  const [statusFilter, setStatusFilter] = useState("active");
  const [originFilter, setOriginFilter] = useState("all");
  const [missingCoords, setMissingCoords] = useState(false);
  const [outsideRegion, setOutsideRegion] = useState(false);
  const [loadingId, setLoadingId] = useState<string | null>(null);
  const [updates, setUpdates] = useState<Record<string, string>>({});
  const filtered = races.filter((raw) => {
    const race = { ...raw, status: updates[raw.id] ?? raw.status };
    if (statusFilter === "active" && ["cancelled", "rejected"].includes(race.status)) return false;
    if (statusFilter !== "active" && statusFilter !== "all" && race.status !== statusFilter) return false;
    if (originFilter !== "all" && race.origin !== originFilter) return false;
    if (missingCoords && hasCoords(race)) return false;
    if (outsideRegion && !isOutsideRegion(race)) return false;
    return true;
  });

  async function review(id: string, action: "approve" | "reject") {
    setLoadingId(id);
    try {
      const response = await fetch(`/api/races/${id}/review`, { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ action }) });
      const payload = await response.json();
      if (!response.ok) throw new Error(payload.error ?? "Erro ao atualizar corrida");
      setUpdates((current) => ({ ...current, [id]: payload.status }));
      toast.success(action === "approve" ? "Corrida aprovada" : "Corrida rejeitada");
      router.refresh();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Erro ao atualizar corrida");
    } finally {
      setLoadingId(null);
    }
  }

  return (
    <>
      <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
        <div className="flex flex-wrap items-center gap-2">
          <FilterGroup label="Status" options={STATUS_FILTERS} value={statusFilter} onChange={setStatusFilter} />
          <FilterGroup label="Origem" options={ORIGIN_FILTERS} value={originFilter} onChange={setOriginFilter} />
          <FilterButton active={missingCoords} onClick={() => setMissingCoords((value) => !value)} icon={<MapPinOff className="h-3.5 w-3.5" />}>Sem coordenadas</FilterButton>
          <FilterButton active={outsideRegion} onClick={() => setOutsideRegion((value) => !value)} icon={<MapPin className="h-3.5 w-3.5" />}>Fora da região</FilterButton>
        </div>
        <div className="flex items-center gap-3"><span className="text-xs text-muted-foreground">{filtered.length} corridas</span><Button asChild size="sm"><Link href="/admin/corridas/nova"><Plus className="mr-2 h-4 w-4" />Nova corrida</Link></Button></div>
      </div>
      <div className="overflow-x-auto rounded-md border">
        <table className="w-full text-sm">
          <thead><tr className="border-b bg-muted/50"><th className="px-4 py-3 text-left">Nome</th><th className="px-4 py-3 text-left">Cidade</th><th className="px-4 py-3 text-left">Data</th><th className="px-4 py-3 text-left">Status</th><th className="px-4 py-3 text-left">Origem</th><th className="px-4 py-3 text-right">Ações</th></tr></thead>
          <tbody>
            {filtered.map((raw) => { const race = { ...raw, status: updates[raw.id] ?? raw.status }; return (
              <tr key={race.id} className="border-b"><td className="px-4 py-3 font-medium">{race.name}</td><td className="px-4 py-3">{race.city} - {race.state}{!hasCoords(race) && <MapPinOff className="ml-1 inline h-3.5 w-3.5 text-amber-500" />}</td><td className="px-4 py-3">{formatDateShort(race.date)}</td><td className="px-4 py-3"><StatusBadge status={race.status} /></td><td className="px-4 py-3 text-xs text-muted-foreground">{RACE_ORIGINS[race.origin as keyof typeof RACE_ORIGINS] ?? race.origin}</td><td className="px-4 py-3"><div className="flex justify-end gap-1">{race.status === "pending_review" && <><Button variant="ghost" size="icon" title="Aprovar" disabled={loadingId === race.id} onClick={() => review(race.id, "approve")}><Check className="h-4 w-4 text-green-600" /></Button><Button variant="ghost" size="icon" title="Reprovar" disabled={loadingId === race.id} onClick={() => review(race.id, "reject")}><X className="h-4 w-4" /></Button></>}<Button variant="ghost" size="icon" title="Editar" asChild><Link href={`/admin/corridas/${race.id}/editar`}><Pencil className="h-4 w-4" /></Link></Button></div></td></tr>
            ); })}
            {!filtered.length && <tr><td colSpan={6} className="px-4 py-8 text-center text-muted-foreground">Nenhuma corrida encontrada.</td></tr>}
          </tbody>
        </table>
      </div>
    </>
  );
}

function FilterGroup({ label, options, value, onChange }: { label: string; options: readonly (readonly [string, string])[]; value: string; onChange: (value: string) => void }) {
  return <div className="flex items-center gap-1"><span className="text-xs text-muted-foreground">{label}:</span>{options.map(([key, text]) => <button key={key} onClick={() => onChange(key)} className={`rounded-full px-2 py-1 text-xs ${value === key ? "bg-foreground text-background" : "bg-muted text-muted-foreground"}`}>{text}</button>)}</div>;
}
function FilterButton({ active, onClick, icon, children }: { active: boolean; onClick: () => void; icon: React.ReactNode; children: React.ReactNode }) {
  return <button onClick={onClick} className={`flex items-center gap-1 rounded-full px-3 py-1 text-xs ${active ? "bg-amber-100 text-amber-800" : "text-muted-foreground"}`}>{icon}{children}</button>;
}
function StatusBadge({ status }: { status: string }) {
  const styles: Record<string, string> = { confirmed: "bg-green-50 text-green-700", postponed: "bg-yellow-50 text-yellow-700", cancelled: "bg-red-50 text-red-700", pending_review: "bg-amber-50 text-amber-700", rejected: "bg-slate-100 text-slate-700" };
  return <Badge variant="outline" className={styles[status]}>{RACE_STATUSES[status as keyof typeof RACE_STATUSES] ?? status}</Badge>;
}
