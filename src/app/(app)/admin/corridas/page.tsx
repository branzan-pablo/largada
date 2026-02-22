import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Plus } from "lucide-react";
import { formatDateShort } from "@/lib/utils";
import { RACE_STATUSES } from "@/lib/constants";

export const metadata = {
  title: "Corridas — Admin",
};

export default async function AdminRacesPage() {
  const supabase = await createClient();

  const [{ data: races }, { data: clickCounts }] = await Promise.all([
    supabase
      .from("races")
      .select("id, name, city, state, date, status, distances, rsvp_count")
      .order("date", { ascending: false }),
    supabase.from("link_clicks").select("race_id"),
  ]);

  // Build a map of race_id -> click count
  const clickMap = new Map<string, number>();
  clickCounts?.forEach((c) => {
    clickMap.set(c.race_id, (clickMap.get(c.race_id) ?? 0) + 1);
  });

  return (
    <div className="p-6">
      <div className="mb-6 flex items-center justify-between">
        <h1 className="text-2xl font-bold">Corridas</h1>
        <Button asChild>
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
              <th className="hidden px-4 py-3 text-left font-medium sm:table-cell">
                Cidade
              </th>
              <th className="hidden px-4 py-3 text-left font-medium md:table-cell">
                Data
              </th>
              <th className="px-4 py-3 text-left font-medium">Status</th>
              <th className="hidden px-4 py-3 text-right font-medium sm:table-cell">
                RSVPs
              </th>
              <th className="hidden px-4 py-3 text-right font-medium md:table-cell">
                Cliques
              </th>
              <th className="px-4 py-3 text-right font-medium">Ação</th>
            </tr>
          </thead>
          <tbody>
            {races?.map((race) => (
              <tr key={race.id} className="border-b">
                <td className="px-4 py-3 font-medium">{race.name}</td>
                <td className="hidden px-4 py-3 sm:table-cell">
                  {`${race.city} — ${race.state}`}
                </td>
                <td className="hidden px-4 py-3 md:table-cell">
                  {formatDateShort(race.date)}
                </td>
                <td className="px-4 py-3">
                  <StatusBadge status={race.status} />
                </td>
                <td className="hidden px-4 py-3 text-right sm:table-cell">
                  {race.rsvp_count}
                </td>
                <td className="hidden px-4 py-3 text-right md:table-cell">
                  {clickMap.get(race.id) ?? 0}
                </td>
                <td className="px-4 py-3 text-right">
                  <Button variant="ghost" size="sm" asChild>
                    <Link href={`/admin/corridas/${race.id}/editar`}>
                      Editar
                    </Link>
                  </Button>
                </td>
              </tr>
            ))}
            {(!races || races.length === 0) && (
              <tr>
                <td
                  colSpan={7}
                  className="px-4 py-8 text-center text-muted-foreground"
                >
                  Nenhuma corrida cadastrada.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}

function StatusBadge({ status }: { status: string }) {
  const variants: Record<string, string> = {
    confirmed:
      "bg-green-50 text-green-700 border-green-200",
    postponed:
      "bg-yellow-50 text-yellow-700 border-yellow-200",
    cancelled:
      "bg-red-50 text-red-700 border-red-200",
  };

  return (
    <Badge variant="outline" className={variants[status] ?? ""}>
      {RACE_STATUSES[status as keyof typeof RACE_STATUSES] ?? status}
    </Badge>
  );
}
