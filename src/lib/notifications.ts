import webpush from "web-push";
import { createAdminClient } from "@/lib/supabase/admin";

let vapidConfigured = false;

function ensureVapid() {
  if (vapidConfigured) return;
  webpush.setVapidDetails(
    process.env.VAPID_SUBJECT!,
    process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY!,
    process.env.VAPID_PRIVATE_KEY!,
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
        payload,
      ),
    ),
  );

  // Clean up expired subscriptions (HTTP 404/410)
  const expiredEndpoints: string[] = [];
  results.forEach((result, idx) => {
    if (result.status === "rejected") {
      const err = result.reason as { statusCode?: number };
      console.error(
        `[notifications] subscription[${idx}] failed:`,
        err?.statusCode,
        err,
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
  }

  const sent = results.filter((r) => r.status === "fulfilled").length;
  return { sent, failed: results.length - sent };
}

/**
 * Notify users when a new race is created/approved.
 * Uses radius-based matching via Haversine with the race's lat/lng.
 * Matches users who have coordinates via city_id OR directly on their profile.
 */
export async function notifyNewRace(raceId: string) {
  const supabase = createAdminClient();

  const { data: race } = await supabase
    .from("races")
    .select("name, city, slug, latitude, longitude")
    .eq("id", raceId)
    .single();

  if (!race) return;

  if (!race.latitude || !race.longitude) {
    console.warn(`[notifyNewRace] race ${raceId} has no coordinates, skipping`);
    return;
  }

  const { data: recipients } = await supabase.rpc(
    "get_notification_recipients_by_location",
    { p_lat: race.latitude, p_lng: race.longitude },
  );

  console.log(
    `[notifyNewRace] race=${raceId} recipients=${recipients?.length ?? 0}`,
  );

  if (!recipients || recipients.length === 0) return;

  const userIds = (
    recipients as { user_id: string; distance_km: number }[]
  ).map((r) => r.user_id);

  const { data: subs } = await supabase
    .from("push_subscriptions")
    .select("endpoint, p256dh, auth")
    .in("user_id", userIds);

  if (!subs || subs.length === 0) return;

  const result = await sendToSubscriptions({
    title: "VAI TER CORRIDA!",
    body: `${race.name} em ${race.city}. Confira os detalhes.`,
    url: `/corrida/${race.slug}`,
    subscriptions: subs,
  });

  console.log(
    `[notifyNewRace] race=${raceId} sent=${result.sent} failed=${result.failed}`,
  );
}

/**
 * Send a personalized race recommendation push to a specific user.
 * Used by the race-recommendations cron job.
 */
export async function notifyPersonalizedRace(
  userId: string,
  race: { id: string; name: string; city: string; slug: string },
  matchReason: string,
) {
  const supabase = createAdminClient();

  const { data: subs } = await supabase
    .from("push_subscriptions")
    .select("endpoint, p256dh, auth")
    .eq("user_id", userId);

  if (!subs || subs.length === 0) return { sent: 0 };

  const result = await sendToSubscriptions({
    title: "Corrida ideal pra você!",
    body: `${race.name} em ${race.city} — ${matchReason}`,
    url: `/corrida/${race.slug}`,
    subscriptions: subs,
  });

  // Log for dedup
  if (result.sent > 0) {
    await supabase
      .from("race_recommendation_logs")
      .upsert({ user_id: userId, race_id: race.id }, { onConflict: "user_id,race_id" });
  }

  return result;
}

/**
 * Notify all admins when a new suggestion is submitted
 */
export async function notifyNewSuggestion(
  suggestionName: string,
  city: string,
) {
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
