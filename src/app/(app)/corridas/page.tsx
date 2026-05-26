import { createClient } from "@/lib/supabase/server";
import { RaceList } from "@/components/races/race-list";
import { todayInBrazil } from "@/lib/date";
import { ITEMS_PER_PAGE } from "@/lib/constants";
import type { Race } from "@/types/race";

export const metadata = {
  title: "Corridas",
};

// Dynamic so we can join the per-user match_reason into the initial render.
// At current traffic the cost over the previous ISR is negligible (~100ms
// TTFB) and the personalized chip would otherwise only render after the
// first client-side fetch.
export const dynamic = "force-dynamic";

async function getInitialRaces() {
  const supabase = await createClient();
  const today = todayInBrazil();

  const { data, count } = await supabase
    .from("races")
    .select("*", { count: "exact" })
    .eq("status", "confirmed")
    .gte("date", today)
    .or(`registration_deadline.gte.${today},is_promoted.eq.true`)
    .order("is_promoted", { ascending: false })
    .order("date", { ascending: true })
    .range(0, ITEMS_PER_PAGE - 1);

  let races = (data ?? []) as Race[];

  // For authenticated viewers, join the match_reason emitted by the
  // race-recommendations cron so the "Pra você porque..." chip can render on
  // first paint. Anonymous viewers skip this branch.
  if (races.length > 0) {
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (user) {
      const { data: logs } = await supabase
        .from("race_recommendation_logs")
        .select("race_id, match_reason")
        .eq("user_id", user.id)
        .in(
          "race_id",
          races.map((r) => r.id),
        );
      if (logs && logs.length > 0) {
        const reasonByRace = new Map(
          logs
            .filter((l) => l.match_reason)
            .map((l) => [l.race_id, l.match_reason as string]),
        );
        if (reasonByRace.size > 0) {
          races = races.map((race) => ({
            ...race,
            match_reason: reasonByRace.get(race.id) ?? null,
          }));
        }
      }
    }
  }

  return {
    data: races,
    count: count ?? null,
    hasMore: count ? ITEMS_PER_PAGE < count : false,
  };
}

export default async function CorridasPage() {
  const initialData = await getInitialRaces();
  return <RaceList initialData={initialData} />;
}
