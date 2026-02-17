import { createAdminClient } from "@/lib/supabase/admin";
import { getAdminMessaging } from "@/lib/firebase/admin";

interface SendNotificationOptions {
  title: string;
  body: string;
  url: string;
  tokens: string[];
}

export async function sendToTokens({ title, body, url, tokens }: SendNotificationOptions) {
  if (tokens.length === 0) return { sent: 0, failed: 0 };

  const baseUrl = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";
  const absoluteUrl = url.startsWith("http") ? url : `${baseUrl}${url}`;
  const iconUrl = `${baseUrl}/icons/icon.svg`;

  try {
    const messaging = getAdminMessaging();
    const result = await messaging.sendEachForMulticast({
      tokens,
      notification: { title, body },
      data: { url: absoluteUrl },
      webpush: {
        notification: { title, body, icon: iconUrl },
        fcmOptions: { link: absoluteUrl },
      },
      android: {
        priority: "high" as const,
        notification: { title, body, icon: "ic_notification", clickAction: absoluteUrl },
      },
      apns: {
        headers: { "apns-priority": "10" },
        payload: { aps: { alert: { title, body }, sound: "default" } },
      },
    });

    // Log individual failures and collect invalid tokens for cleanup
    const invalidTokens: string[] = [];
    result.responses.forEach((resp, idx) => {
      if (!resp.success) {
        console.error(`[notifications] token[${idx}] failed:`, resp.error?.code, resp.error?.message);
        if (
          resp.error?.code === "messaging/registration-token-not-registered" ||
          resp.error?.code === "messaging/invalid-registration-token"
        ) {
          invalidTokens.push(tokens[idx]);
        }
      }
    });

    // Remove stale tokens from DB
    if (invalidTokens.length > 0) {
      const supabase = createAdminClient();
      await supabase.from("fcm_tokens").delete().in("token", invalidTokens);
      console.log(`[notifications] cleaned up ${invalidTokens.length} invalid tokens`);
    }

    return { sent: result.successCount, failed: result.failureCount };
  } catch (error) {
    console.error("[notifications] sendToTokens failed:", error);
    return { sent: 0, failed: 0 };
  }
}

/**
 * Notify users in the same city when a new race is created
 */
export async function notifyNewRace(raceId: string) {
  const supabase = createAdminClient();

  const { data: race } = await supabase
    .from("races")
    .select("name, city, slug")
    .eq("id", raceId)
    .single();

  if (!race) return;

  const { data: tokens } = await supabase
    .from("fcm_tokens")
    .select("token, profiles!fcm_tokens_user_id_fkey(notifications_enabled, city)")
    .not("token", "is", null);

  if (!tokens || tokens.length === 0) return;

  const targetTokens = tokens
    .filter((t) => {
      return t.profiles?.notifications_enabled && t.profiles?.city === race.city;
    })
    .map((t) => t.token);

  await sendToTokens({
    title: "Nova corrida na sua região!",
    body: `${race.name} em ${race.city}. Confira os detalhes.`,
    url: `/corrida/${race.slug}`,
    tokens: targetTokens,
  });
}

/**
 * Notify all admins when a new suggestion is submitted
 */
export async function notifyNewSuggestion(suggestionName: string, city: string) {
  const supabase = createAdminClient();

  // Get all admin user IDs
  const { data: admins } = await supabase
    .from("profiles")
    .select("id")
    .eq("role", "admin")
    .eq("notifications_enabled", true);

  if (!admins || admins.length === 0) return;

  const adminIds = admins.map((a) => a.id);

  // Get FCM tokens for those admins
  const { data: tokens } = await supabase
    .from("fcm_tokens")
    .select("token")
    .in("user_id", adminIds);

  if (!tokens || tokens.length === 0) return;

  await sendToTokens({
    title: "Nova sugestão de corrida",
    body: `"${suggestionName}" em ${city}. Revise no painel admin.`,
    url: "/admin/sugestoes",
    tokens: tokens.map((t) => t.token),
  });
}
