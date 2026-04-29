import { NextResponse } from "next/server";
import { timingSafeEqual } from "crypto";
import { createAdminClient } from "@/lib/supabase/admin";
import { notifyNewRace } from "@/lib/notifications";

function safeCompare(a: string, b: string): boolean {
  if (a.length !== b.length) return false;
  return timingSafeEqual(Buffer.from(a), Buffer.from(b));
}

const LOOKBACK_DAYS = 90;
const MAX_PER_RUN = 50;

/**
 * GET /api/cron/notify-new-races
 *
 * Catches up confirmed races that never went through notifyNewRace
 * (scraped → approved via SQL, legacy inserts, or any path that
 * bypassed the API). notifyNewRace stamps races.notification_sent_at
 * on each call (success, no recipients, or no coords) so this cron
 * is naturally idempotent against the API path.
 */
export async function GET(request: Request) {
  const authHeader = request.headers.get("authorization");
  if (
    !authHeader ||
    !safeCompare(authHeader, `Bearer ${process.env.CRON_SECRET}`)
  ) {
    return NextResponse.json({ error: "Não autorizado" }, { status: 401 });
  }

  const supabase = createAdminClient();
  const cutoff = new Date(
    Date.now() - LOOKBACK_DAYS * 86400 * 1000,
  ).toISOString();

  const { data: races, error } = await supabase
    .from("races")
    .select("id, name")
    .eq("status", "confirmed")
    .is("notification_sent_at", null)
    .gte("created_at", cutoff)
    .order("created_at", { ascending: true })
    .limit(MAX_PER_RUN);

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  if (!races || races.length === 0) {
    return NextResponse.json({ message: "Nenhuma corrida pendente", processed: 0 });
  }

  let processed = 0;
  const errors: { id: string; message: string }[] = [];

  for (const race of races) {
    try {
      await notifyNewRace(race.id);
      processed++;
    } catch (err) {
      errors.push({ id: race.id, message: (err as Error).message });
    }
  }

  return NextResponse.json({
    processed,
    total: races.length,
    errors,
  });
}
