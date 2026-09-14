import { CalendarDays, Clock, Trophy } from "lucide-react";
import { createClient } from "@/lib/supabase/server";
import { AdminRacesTable } from "@/components/admin/admin-races-table";
import { BackfillEnrichButton } from "@/components/admin/backfill-enrich-button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { todayInBrazil } from "@/lib/date";

export const metadata = { title: "Corridas | Admin" };

export default async function AdminPage() {
  const supabase = await createClient();
  const { data } = await supabase
    .from("races")
    .select("id, name, city, state, date, status, origin, latitude, longitude")
    .order("date", { ascending: false });
  const races = data ?? [];
  const today = todayInBrazil();
  const stats = [
    { title: "Total de Corridas", value: races.length, icon: Trophy },
    { title: "Corridas Futuras", value: races.filter((race) => race.date >= today && race.status === "confirmed").length, icon: CalendarDays },
    { title: "Pendentes de Revisão", value: races.filter((race) => race.status === "pending_review").length, icon: Clock },
  ];
  return (
    <>
      <div className="mb-6 grid gap-3 sm:grid-cols-3">
        {stats.map((stat) => <Card key={stat.title}><CardHeader className="flex flex-row items-center justify-between pb-2"><CardTitle className="text-xs font-medium text-muted-foreground">{stat.title}</CardTitle><stat.icon className="h-4 w-4 text-muted-foreground" /></CardHeader><CardContent><p className="text-2xl font-bold">{stat.value}</p></CardContent></Card>)}
      </div>
      <div className="mb-4 flex justify-end"><BackfillEnrichButton /></div>
      <AdminRacesTable races={races} />
    </>
  );
}
