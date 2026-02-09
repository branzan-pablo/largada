import { createClient } from "@/lib/supabase/server";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Trophy, Users, MessageSquarePlus, CalendarDays } from "lucide-react";

export const metadata = {
  title: "Admin Dashboard",
};

export default async function AdminDashboardPage() {
  const supabase = await createClient();

  const [racesResult, usersResult, suggestionsResult] = await Promise.all([
    supabase.from("races").select("id, date, status", { count: "exact" }),
    supabase.from("profiles").select("id", { count: "exact" }),
    supabase
      .from("race_suggestions")
      .select("id", { count: "exact" })
      .eq("status", "pending"),
  ]);

  const totalRaces = racesResult.count ?? 0;
  const totalUsers = usersResult.count ?? 0;
  const pendingSuggestions = suggestionsResult.count ?? 0;

  const today = new Date().toISOString().split("T")[0];
  const upcomingRaces =
    racesResult.data?.filter(
      (r) => r.date >= today && r.status === "confirmed"
    ).length ?? 0;

  const stats = [
    {
      title: "Total de Corridas",
      value: totalRaces,
      icon: Trophy,
    },
    {
      title: "Corridas Futuras",
      value: upcomingRaces,
      icon: CalendarDays,
    },
    {
      title: "Usuários Cadastrados",
      value: totalUsers,
      icon: Users,
    },
    {
      title: "Sugestões Pendentes",
      value: pendingSuggestions,
      icon: MessageSquarePlus,
    },
  ];

  return (
    <div className="p-6">
      <h1 className="mb-6 text-2xl font-bold">Dashboard</h1>
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {stats.map((stat) => (
          <Card key={stat.title}>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                {stat.title}
              </CardTitle>
              <stat.icon className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <p className="text-3xl font-bold">{stat.value}</p>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
