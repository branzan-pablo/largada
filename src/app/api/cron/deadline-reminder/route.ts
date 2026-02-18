import { NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { sendToSubscriptions } from "@/lib/notifications";

// Cron: send reminders for races with registration deadline in 3 days
export async function GET(request: Request) {
  const authHeader = request.headers.get("authorization");
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: "Não autorizado" }, { status: 401 });
  }

  const supabase = createAdminClient();

  // Find races with deadline in exactly 3 days
  const threeDaysFromNow = new Date();
  threeDaysFromNow.setDate(threeDaysFromNow.getDate() + 3);
  const targetDate = threeDaysFromNow.toISOString().split("T")[0];

  const { data: races } = await supabase
    .from("races")
    .select("id, name, city, slug, registration_deadline")
    .eq("registration_deadline", targetDate);

  if (!races || races.length === 0) {
    return NextResponse.json({ message: "Nenhuma corrida com prazo em 3 dias", sent: 0 });
  }

  let totalSent = 0;

  for (const race of races) {
    // Get users who RSVPed for this race and have notifications enabled
    const { data: rsvps } = await supabase
      .from("rsvps")
      .select("user_id")
      .eq("race_id", race.id);

    if (!rsvps || rsvps.length === 0) continue;

    const userIds = rsvps.map((r) => r.user_id);

    // Get push subscriptions for these users (with notification preference check via join)
    const { data: subs } = await supabase
      .from("push_subscriptions")
      .select(
        "endpoint, p256dh, auth, profiles!push_subscriptions_user_id_fkey(notifications_enabled)"
      )
      .in("user_id", userIds);

    if (!subs || subs.length === 0) continue;

    const targetSubs = subs
      .filter((s) => {
        const profile = s.profiles as unknown as { notifications_enabled: boolean } | null;
        return profile?.notifications_enabled;
      })
      .map((s) => ({
        endpoint: s.endpoint,
        p256dh: s.p256dh,
        auth: s.auth,
      }));

    if (targetSubs.length === 0) continue;

    try {
      const result = await sendToSubscriptions({
        title: "Inscrição expirando!",
        body: `Faltam 3 dias para o prazo de inscrição: ${race.name}. Não perca!`,
        url: `/corrida/${race.slug}`,
        subscriptions: targetSubs,
      });

      totalSent += result.sent;
    } catch (error) {
      console.error("[deadline-reminder] failed for race:", race.id, error);
    }
  }

  return NextResponse.json({ sent: totalSent, races: races.length });
}
