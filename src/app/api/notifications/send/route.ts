import { NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { getAdminMessaging } from "@/lib/firebase/admin";

// Send notification to users in the same city/region when a new race is created
export async function POST(request: Request) {
  const authHeader = request.headers.get("authorization");
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    // Also allow calls from our own API routes with the service role
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

    // Get FCM tokens for users in the same city with notifications enabled
    const { data: tokens } = await supabase
      .from("fcm_tokens")
      .select("token, profiles:user_id(city, notifications_enabled)")
      .not("token", "is", null);

    if (!tokens || tokens.length === 0) {
      return NextResponse.json({ sent: 0 });
    }

    const targetTokens = tokens
      .filter((t) => {
        const profile = t.profiles as unknown as { city: string | null; notifications_enabled: boolean } | null;
        return profile?.notifications_enabled && profile?.city === race.city;
      })
      .map((t) => t.token);

    if (targetTokens.length === 0) {
      return NextResponse.json({ sent: 0 });
    }

    try {
      const messaging = getAdminMessaging();
      const result = await messaging.sendEachForMulticast({
        tokens: targetTokens,
        notification: {
          title: "Nova corrida na sua região!",
          body: `${race.name} em ${race.city}. Confira os detalhes.`,
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

  return NextResponse.json({ error: "Método inválido" }, { status: 400 });
}
