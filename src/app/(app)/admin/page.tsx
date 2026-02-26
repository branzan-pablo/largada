import { createClient } from "@/lib/supabase/server";
import { todayInBrazil } from "@/lib/date";
import { Trophy, CalendarDays, Clock, MousePointerClick } from "lucide-react";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { AdminRacesTable } from "@/components/admin/admin-races-table";

export const metadata = {
  title: "Corridas — Admin",
};

export default async function AdminPage() {
  const supabase = await createClient();

  const [racesResult, clicksResult] = await Promise.all([
    supabase
      .from("races")
      .select("id, name, city, state, date, status, origin, distances, rsvp_count, is_promoted")
      .order("date", { ascending: false }),
    supabase.from("link_clicks").select("race_id"),
  ]);

  const races = racesResult.data ?? [];

  // Build click count map
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
  const totalClicks = clicksResult.data?.length ?? 0;

  const stats = [
    { title: "Total", value: totalRaces, icon: Trophy },
    { title: "Futuras", value: upcomingRaces, icon: CalendarDays },
    { title: "Pendentes", value: pendingReview, icon: Clock },
    { title: "Cliques", value: totalClicks, icon: MousePointerClick },
  ];

  // Enrich races with click counts
  const racesWithClicks = races.map((r) => ({
    ...r,
    clicks: clickMap.get(r.id) ?? 0,
  }));

  return (
    <div className="p-6 md:p-8">
      <div className="mb-6 grid gap-3 grid-cols-2 lg:grid-cols-4">
        {stats.map((stat) => (
          <Card key={stat.title}>
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

      <AdminRacesTable races={racesWithClicks} />
    </div>
  );
}
