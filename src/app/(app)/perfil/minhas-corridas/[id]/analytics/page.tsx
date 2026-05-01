import { notFound, redirect } from "next/navigation";
import Link from "next/link";
import { ChevronLeft } from "lucide-react";
import { createClient } from "@/lib/supabase/server";
import { AnalyticsClient } from "./analytics-client";

export const metadata = {
  title: "Analytics da corrida",
};

export default async function RaceAnalyticsPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/corridas?login=true");

  const { data: race } = await supabase
    .from("races")
    .select("id, name, slug, city, state, created_by, is_promoted")
    .eq("id", id)
    .single();

  if (!race) notFound();

  const { data: profile } = await supabase
    .from("profiles")
    .select("role")
    .eq("id", user.id)
    .single();
  const isOwner = race.created_by === user.id;
  const isAdmin = profile?.role === "admin";
  if (!isOwner && !isAdmin) notFound();

  return (
    <div className="mx-auto max-w-screen-md md:pb-12">
      <Link
        href="/perfil/minhas-corridas?tab=created"
        className="mb-4 inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground transition-colors"
      >
        <ChevronLeft className="h-4 w-4" />
        Minhas corridas
      </Link>
      <h1 className="mb-1 text-2xl font-bold">{race.name}</h1>
      <p className="mb-6 text-sm text-muted-foreground">
        {race.city}/{race.state} · Últimos 30 dias
      </p>
      <AnalyticsClient raceId={race.id} raceSlug={race.slug} />
    </div>
  );
}
