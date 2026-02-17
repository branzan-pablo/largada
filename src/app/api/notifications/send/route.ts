import { NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { getAdminMessaging } from "@/lib/firebase/admin";

// Send notification to users when a new race is created
export async function POST(request: Request) {
  const authHeader = request.headers.get("authorization");
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: "Não autorizado" }, { status: 401 });
  }

  const supabase = createAdminClient();
  const body = await request.json();

  if (!body.raceId) {
    return NextResponse.json({ error: "raceId é obrigatório" }, { status: 400 });
  }

  // Fetch the race
  const { data: race } = await supabase
    .from("races")
    .select("name, city, slug")
    .eq("id", body.raceId)
    .single();

  if (!race) {
    return NextResponse.json({ error: "Corrida não encontrada" }, { status: 404 });
  }

  // Get FCM tokens for users with notifications enabled
  const { data: tokens } = await supabase
    .from("fcm_tokens")
    .select("token, profiles!fcm_tokens_user_id_fkey(notifications_enabled)")
    .not("token", "is", null);

  if (!tokens || tokens.length === 0) {
    return NextResponse.json({ sent: 0 });
  }

  const targetTokens = tokens
    .filter((t) => t.profiles?.notifications_enabled)
    .map((t) => t.token);

  if (targetTokens.length === 0) {
    return NextResponse.json({ sent: 0 });
  }

  const baseUrl = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";
  const raceUrl = `${baseUrl}/corrida/${race.slug}`;
  const iconUrl = `${baseUrl}/icons/icon.svg`;

  const title = "Nova corrida na sua região!";
  const notifBody = `${race.name} em ${race.city}. Confira os detalhes.`;

  try {
    const messaging = getAdminMessaging();
    const result = await messaging.sendEachForMulticast({
      tokens: targetTokens,
      notification: { title, body: notifBody },
      data: { url: raceUrl },
      webpush: {
        notification: { title, body: notifBody, icon: iconUrl },
        fcmOptions: { link: raceUrl },
      },
      android: {
        priority: "high" as const,
        notification: { title, body: notifBody, icon: "ic_notification", clickAction: raceUrl },
      },
      apns: {
        headers: { "apns-priority": "10" },
        payload: { aps: { alert: { title, body: notifBody }, sound: "default" } },
      },
    });

    // Log individual failures
    result.responses.forEach((resp, idx) => {
      if (!resp.success) {
        console.error(`[send] token[${idx}] failed:`, resp.error?.code, resp.error?.message);
      }
    });

    return NextResponse.json({
      sent: result.successCount,
      failed: result.failureCount,
    });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Erro ao enviar notificações" },
      { status: 500 }
    );
  }
}
