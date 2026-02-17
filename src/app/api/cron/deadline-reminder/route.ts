import { NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { sendToTokens } from "@/lib/notifications";

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

    // Get FCM tokens for these users (with notification preference check via join)
    const { data: tokens } = await supabase
      .from("fcm_tokens")
      .select("token, profiles!fcm_tokens_user_id_fkey(notifications_enabled)")
      .in("user_id", userIds);

    if (!tokens || tokens.length === 0) continue;

    const targetTokens = tokens
      .filter((t) => t.profiles?.notifications_enabled)
      .map((t) => t.token);

    if (targetTokens.length === 0) continue;

    try {
      const result = await sendToTokens({
        title: "Inscrição expirando!",
        body: `Faltam 3 dias para o prazo de inscrição: ${race.name}. Não perca!`,
        url: `/corrida/${race.slug}`,
        tokens: targetTokens,
      });

      totalSent += result.sent;
    } catch (error) {
      console.error("[deadline-reminder] failed for race:", race.id, error);
    }
  }

  return NextResponse.json({ sent: totalSent, races: races.length });
}
