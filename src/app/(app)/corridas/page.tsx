import { createClient } from "@/lib/supabase/server";
import { RaceList } from "@/components/races/race-list";
import { todayInBrazil } from "@/lib/date";
import { ITEMS_PER_PAGE } from "@/lib/constants";
import { PUBLIC_RACE_SUMMARY_COLUMNS } from "@/lib/public-races";
import type { RaceSummary } from "@/types/race";

export const metadata = {
  title: "Corridas",
};

export const revalidate = 300;

async function getInitialRaces() {
  const supabase = await createClient();
  const today = todayInBrazil();

  const { data, count } = await supabase
    .from("races")
    .select(PUBLIC_RACE_SUMMARY_COLUMNS, { count: "exact" })
    .eq("status", "confirmed")
    .gte("date", today)
    .gte("registration_deadline", today)
    .order("date", { ascending: true })
    .range(0, ITEMS_PER_PAGE - 1);

  return {
    data: (data ?? []) as RaceSummary[],
    count: count ?? null,
    hasMore: count ? ITEMS_PER_PAGE < count : false,
  };
}

export default async function CorridasPage() {
  const initialData = await getInitialRaces();
  return <RaceList initialData={initialData} />;
}
