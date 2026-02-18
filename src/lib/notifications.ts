import webpush from "web-push";
import { createAdminClient } from "@/lib/supabase/admin";

let vapidConfigured = false;

function ensureVapid() {
  if (vapidConfigured) return;
  webpush.setVapidDetails(
    process.env.VAPID_SUBJECT!,
    process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY!,
    process.env.VAPID_PRIVATE_KEY!
  );
  vapidConfigured = true;
}

interface PushSubscriptionRecord {
  endpoint: string;
  p256dh: string;
  auth: string;
}

interface SendNotificationOptions {
  title: string;
  body: string;
  url: string;
  subscriptions: PushSubscriptionRecord[];
}

export async function sendToSubscriptions({
  title,
  body,
  url,
  subscriptions,
}: SendNotificationOptions) {
  if (subscriptions.length === 0) return { sent: 0, failed: 0 };

  ensureVapid();

  const baseUrl = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";
  const absoluteUrl = url.startsWith("http") ? url : `${baseUrl}${url}`;

  const payload = JSON.stringify({ title, body, url: absoluteUrl });

  const results = await Promise.allSettled(
    subscriptions.map((sub) =>
      webpush.sendNotification(
        {
          endpoint: sub.endpoint,
          keys: { p256dh: sub.p256dh, auth: sub.auth },
        },
        payload
      )
    )
  );

  // Clean up expired subscriptions (HTTP 404/410)
  const expiredEndpoints: string[] = [];
  results.forEach((result, idx) => {
    if (result.status === "rejected") {
      const err = result.reason as { statusCode?: number };
      console.error(
        `[notifications] subscription[${idx}] failed:`,
        err?.statusCode,
        err
      );
      if (err?.statusCode === 404 || err?.statusCode === 410) {
        expiredEndpoints.push(subscriptions[idx].endpoint);
      }
    }
  });

  if (expiredEndpoints.length > 0) {
    const supabase = createAdminClient();
    await supabase
      .from("push_subscriptions")
      .delete()
      .in("endpoint", expiredEndpoints);
    console.log(
      `[notifications] cleaned up ${expiredEndpoints.length} expired subscriptions`
    );
  }

  const sent = results.filter((r) => r.status === "fulfilled").length;
  return { sent, failed: results.length - sent };
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

  const { data: rows } = await supabase
    .from("push_subscriptions")
    .select(
      "endpoint, p256dh, auth, profiles!push_subscriptions_user_id_fkey(notifications_enabled, city)"
    )
    .not("endpoint", "is", null);

  if (!rows || rows.length === 0) return;

  const targetSubs = rows
    .filter(
      (r) => {
        const profile = r.profiles as unknown as { notifications_enabled: boolean; city: string } | null;
        return profile?.notifications_enabled && profile?.city === race.city;
      }
    )
    .map((r) => ({ endpoint: r.endpoint, p256dh: r.p256dh, auth: r.auth }));

  await sendToSubscriptions({
    title: "Nova corrida na sua região!",
    body: `${race.name} em ${race.city}. Confira os detalhes.`,
    url: `/corrida/${race.slug}`,
    subscriptions: targetSubs,
  });
}

/**
 * Notify all admins when a new suggestion is submitted
 */
export async function notifyNewSuggestion(suggestionName: string, city: string) {
  const supabase = createAdminClient();

  const { data: admins } = await supabase
    .from("profiles")
    .select("id")
    .eq("role", "admin")
    .eq("notifications_enabled", true);

  if (!admins || admins.length === 0) return;

  const adminIds = admins.map((a) => a.id);

  const { data: rows } = await supabase
    .from("push_subscriptions")
    .select("endpoint, p256dh, auth")
    .in("user_id", adminIds);

  if (!rows || rows.length === 0) return;

  await sendToSubscriptions({
    title: "Nova sugestão de corrida",
    body: `"${suggestionName}" em ${city}. Revise no painel admin.`,
    url: "/admin/sugestoes",
    subscriptions: rows,
  });
}
