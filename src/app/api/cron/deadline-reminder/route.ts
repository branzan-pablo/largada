import { NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { getAdminMessaging } from "@/lib/firebase/admin";

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

    // Get FCM tokens for these users
    const { data: tokens } = await supabase
      .from("fcm_tokens")
      .select("token, user_id")
      .in("user_id", userIds);

    if (!tokens || tokens.length === 0) continue;

    // Filter users with notifications enabled
    const { data: profiles } = await supabase
      .from("profiles")
      .select("id, notifications_enabled")
      .in("id", userIds)
      .eq("notifications_enabled", true);

    const enabledUserIds = new Set(profiles?.map((p) => p.id) ?? []);
    const targetTokens = tokens
      .filter((t) => enabledUserIds.has(t.user_id))
      .map((t) => t.token);

    if (targetTokens.length === 0) continue;

    try {
      const messaging = getAdminMessaging();
      const result = await messaging.sendEachForMulticast({
        tokens: targetTokens,
        notification: {
          title: "Inscrição expirando!",
          body: `Faltam 3 dias para o prazo de inscrição: ${race.name}. Não perca!`,
        },
        data: {
          url: `/corrida/${race.slug}`,
        },
        webpush: {
          fcmOptions: {
            link: `/corrida/${race.slug}`,
          },
        },
      });

      totalSent += result.successCount;
    } catch {
      // Continue with next race
    }
  }

  return NextResponse.json({ sent: totalSent, races: races.length });
}
