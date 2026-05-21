import { createClient } from "@/lib/supabase/server";
import { todayInBrazil } from "@/lib/date";
import { Trophy, CalendarDays, Clock, MessageSquarePlus, MousePointerClick, Eye } from "lucide-react";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { AdminRacesTable } from "@/components/admin/admin-races-table";
import { BackfillEnrichButton } from "@/components/admin/backfill-enrich-button";

export const metadata = {
  title: "Corridas | Admin",
};

export default async function AdminPage() {
  const supabase = await createClient();

  const [racesResult, viewsResult, clicksResult, suggestionsResult] = await Promise.all([
    supabase
      .from("races")
      .select("id, name, city, state, date, status, origin, distances, rsvp_count, is_promoted, latitude, longitude")
      .order("date", { ascending: false }),
    supabase.from("race_views").select("race_id"),
    supabase.from("link_clicks").select("race_id"),
    supabase
      .from("race_suggestions")
      .select("id", { count: "exact" })
      .eq("status", "pending"),
  ]);

  const races = racesResult.data ?? [];

  const viewMap = new Map<string, number>();
  viewsResult.data?.forEach((v) => {
    viewMap.set(v.race_id, (viewMap.get(v.race_id) ?? 0) + 1);
  });
  const clickMap = new Map<string, number>();
  clicksResult.data?.forEach((c) => {
    clickMap.set(c.race_id, (clickMap.get(c.race_id) ?? 0) + 1);
  });

  const today = todayInBrazil();
  const totalRaces = races.length;
  const pendingReview = races.filter((r) => r.status === "pending_review").length;
  const upcomingRaces = races.filter(
    (r) => r.date >= today && r.status === "confirmed"
  ).length;
  const totalViews = viewsResult.data?.length ?? 0;
  const totalClicks = clicksResult.data?.length ?? 0;
  const pendingSuggestions = suggestionsResult.count ?? 0;

  const stats = [
    { title: "Total de Corridas", value: totalRaces, icon: Trophy },
    { title: "Corridas Futuras", value: upcomingRaces, icon: CalendarDays },
    { title: "Pendentes de Revisão", value: pendingReview, icon: Clock },
    { title: "Sugestões Pendentes", value: pendingSuggestions, icon: MessageSquarePlus },
    { title: "Visualizações", value: totalViews, icon: Eye },
    { title: "Cliques em Inscrições", value: totalClicks, icon: MousePointerClick },
  ];

  const racesWithClicks = races.map((r) => ({
    ...r,
    views: viewMap.get(r.id) ?? 0,
    clicks: clickMap.get(r.id) ?? 0,
  }));

  return (
    <>
      <div className="mb-6 grid gap-3 grid-cols-2 sm:grid-cols-3 lg:grid-cols-6">
        {stats.map((stat, i) => (
          <Card key={stat.title} className={i === stats.length - 1 && stats.length % 2 !== 0 ? "col-span-2 sm:col-span-1 lg:col-span-1" : ""}>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-xs font-medium text-muted-foreground">
                {stat.title}
              </CardTitle>
              <stat.icon className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <p className="text-2xl font-bold">{stat.value}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="mb-4 flex justify-end">
        <BackfillEnrichButton />
      </div>

      <AdminRacesTable races={racesWithClicks} />
    </>
  );
}
