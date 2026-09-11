// Stats agregadas para a landing — cache em memoria por revalidate window.
// Usa um client anon stateless (sem cookies) para preservar SSG/ISR.
// Sao numeros publicos; RLS permite leitura.

import { createClient } from "@supabase/supabase-js";
import type { Database } from "@/types/database";
import { todayInBrazil, futureDateInBrazil } from "@/lib/date";

export interface LandingStats {
  totalRaces: number;
  racesOpenThisWeek: number;
  totalRsvps: number;
  /** Slug da prova quando há exatamente 1 com inscrição aberta — habilita link direto. */
  firstOpenSlug?: string;
}

const FALLBACK: LandingStats = {
  totalRaces: 0,
  racesOpenThisWeek: 0,
  totalRsvps: 0,
};

function buildAnonClient() {
  return createClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      auth: {
        persistSession: false,
        autoRefreshToken: false,
      },
    }
  );
}

export async function getLandingStats(): Promise<LandingStats> {
  if (
    !process.env.NEXT_PUBLIC_SUPABASE_URL ||
    !process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
  ) {
    return FALLBACK;
  }

  try {
    const supabase = buildAnonClient();
    const today = todayInBrazil();
    const sevenDays = futureDateInBrazil(7);

    const [
      { count: totalRaces },
      { count: racesOpenThisWeek },
      rsvpAgg,
      openSlugRes,
    ] = await Promise.all([
      supabase
        .from("races")
        .select("id", { count: "exact", head: true })
        .eq("status", "confirmed")
        .gte("date", today),
      supabase
        .from("races")
        .select("id", { count: "exact", head: true })
        .eq("status", "confirmed")
        .gte("registration_deadline", today)
        .lte("registration_deadline", sevenDays),
      supabase
        .from("races")
        .select("rsvp_count")
        .eq("status", "confirmed")
        .gte("date", today),
      supabase
        .from("races")
        .select("slug")
        .eq("status", "confirmed")
        .gte("registration_deadline", today)
        .lte("registration_deadline", sevenDays)
        .order("registration_deadline", { ascending: true })
        .limit(2),
    ]);

    const totalRsvps =
      rsvpAgg.data?.reduce(
        (sum, r) => sum + (typeof r.rsvp_count === "number" ? r.rsvp_count : 0),
        0
      ) ?? 0;

    const firstOpenSlug =
      racesOpenThisWeek === 1 && openSlugRes.data?.[0]?.slug
        ? openSlugRes.data[0].slug
        : undefined;

    return {
      totalRaces: totalRaces ?? 0,
      racesOpenThisWeek: racesOpenThisWeek ?? 0,
      totalRsvps,
      firstOpenSlug,
    };
  } catch (err) {
    console.error("[LandingStats] failed:", err);
    return FALLBACK;
  }
}
