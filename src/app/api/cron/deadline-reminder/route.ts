import { NextResponse } from "next/server";
import { timingSafeEqual } from "crypto";
import { createAdminClient } from "@/lib/supabase/admin";
import { sendToSubscriptions } from "@/lib/notifications";
import { futureDateInBrazil } from "@/lib/date";

function safeCompare(a: string, b: string): boolean {
  if (a.length !== b.length) return false;
  return timingSafeEqual(Buffer.from(a), Buffer.from(b));
}

// Cron: send reminders for races with registration deadline in 3 days
export async function GET(request: Request) {
  const authHeader = request.headers.get("authorization");
  if (!authHeader || !safeCompare(authHeader, `Bearer ${process.env.CRON_SECRET}`)) {
    return NextResponse.json({ error: "Não autorizado" }, { status: 401 });
  }

  const supabase = createAdminClient();

  // Find races with deadline in exactly 3 days (Brazil timezone). Each race
  // matches this filter on exactly one day, so the cron is naturally
  // idempotent — no per-race tracking column needed.
  const targetDate = futureDateInBrazil(3);

  const { data: races } = await supabase
    .from("races")
    .select("id, name, city, slug, registration_deadline, latitude, longitude")
    .eq("status", "confirmed")
    .eq("registration_deadline", targetDate);

  if (!races || races.length === 0) {
    return NextResponse.json({ message: "Nenhuma corrida com prazo em 3 dias", sent: 0 });
  }

  let totalSent = 0;

  for (const race of races) {
    // Match recipients by location (same RPC notifyNewRace uses). The RPC
    // already filters by profiles.notifications_enabled and per-user
    // notification_radius_km, so we don't need a follow-up join.
    if (race.latitude == null || race.longitude == null) {
      console.warn(
        `[deadline-reminder] race ${race.id} has no coordinates, skipping`,
      );
      continue;
    }

    const { data: recipients } = await supabase.rpc(
      "get_notification_recipients_by_location",
      { p_lat: race.latitude, p_lng: race.longitude },
    );

    if (!recipients || recipients.length === 0) continue;

    const userIds = (
      recipients as { user_id: string; distance_km: number }[]
    ).map((r) => r.user_id);

    const { data: subs } = await supabase
      .from("push_subscriptions")
      .select("endpoint, p256dh, auth")
      .in("user_id", userIds);

    if (!subs || subs.length === 0) continue;

    try {
      const result = await sendToSubscriptions({
        title: "Inscrição expirando!",
        body: `Faltam 3 dias para o prazo de inscrição: ${race.name}. Não perca!`,
        url: `/corrida/${race.slug}`,
        subscriptions: subs,
      });

      totalSent += result.sent;
    } catch (error) {
      console.error("[deadline-reminder] failed for race:", race.id, error);
    }
  }

  return NextResponse.json({ sent: totalSent, races: races.length });
}
