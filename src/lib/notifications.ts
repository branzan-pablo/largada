import webpush from "web-push";
import { createAdminClient } from "@/lib/supabase/admin";
import type { Json } from "@/types/database";
import { utcNow } from "@/lib/date";

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

  // Clean up dead subscriptions.
  //   404 / 410 — endpoint expired or the user revoked permission.
  //   403       — VAPID key mismatch (sub was created against a different
  //                public key, e.g. after rotation or the Firebase→VAPID
  //                migration). The push service rejects every send and the
  //                sub will never recover, so it must be deleted.
  const expiredEndpoints: string[] = [];
  results.forEach((result, idx) => {
    if (result.status === "rejected") {
      const err = result.reason as { statusCode?: number };
      console.error(
        `[notifications] subscription[${idx}] failed:`,
        err?.statusCode,
        err,
      );
      if (
        err?.statusCode === 404 ||
        err?.statusCode === 410 ||
        err?.statusCode === 403
      ) {
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
export interface NotifyNewRaceResult {
  status:
    | "race-not-found"
    | "no-coords"
    | "no-recipients"
    | "no-subs"
    | "sent";
  recipients: number;
  subs: number;
  sent: number;
  failed: number;
}

export async function notifyNewRace(
  raceId: string,
): Promise<NotifyNewRaceResult> {
  const supabase = createAdminClient();

  // Mark the race as processed so the backlog cron does not retry it.
  // Idempotent: also called on early-return paths (no coords / no recipients).
  const markSent = async () => {
    await supabase
      .from("races")
      .update({ notification_sent_at: utcNow() })
      .eq("id", raceId);
  };

  const { data: race } = await supabase
    .from("races")
    .select("name, city, slug, latitude, longitude")
    .eq("id", raceId)
    .single();

  if (!race) {
    return { status: "race-not-found", recipients: 0, subs: 0, sent: 0, failed: 0 };
  }

  if (race.latitude == null || race.longitude == null) {
    console.warn(`[notifyNewRace] race ${raceId} has no coordinates, skipping`);
    await markSent();
    return { status: "no-coords", recipients: 0, subs: 0, sent: 0, failed: 0 };
  }

  const { data: recipients } = await supabase.rpc(
    "get_notification_recipients_by_location",
    { p_lat: race.latitude, p_lng: race.longitude },
  );

  const recipientsCount = recipients?.length ?? 0;
  console.log(`[notifyNewRace] race=${raceId} recipients=${recipientsCount}`);

  if (!recipients || recipients.length === 0) {
    await markSent();
    return { status: "no-recipients", recipients: 0, subs: 0, sent: 0, failed: 0 };
  }

  const userIds = (
    recipients as { user_id: string; distance_km: number }[]
  ).map((r) => r.user_id);

  const { data: subs } = await supabase
    .from("push_subscriptions")
    .select("endpoint, p256dh, auth")
    .in("user_id", userIds);

  const subsCount = subs?.length ?? 0;

  if (!subs || subs.length === 0) {
    await markSent();
    return {
      status: "no-subs",
      recipients: recipientsCount,
      subs: 0,
      sent: 0,
      failed: 0,
    };
  }

  const result = await sendToSubscriptions({
    title: "VAI TER CORRIDA!",
    body: `${race.name} em ${race.city}. Confira os detalhes.`,
    url: `/corrida/${race.slug}`,
    subscriptions: subs,
  });

  console.log(
    `[notifyNewRace] race=${raceId} sent=${result.sent} failed=${result.failed}`,
  );

  await markSent();
  return {
    status: "sent",
    recipients: recipientsCount,
    subs: subsCount,
    sent: result.sent,
    failed: result.failed,
  };
}

/**
 * Send a personalized race recommendation push to a specific user.
 * Used by the race-recommendations cron job.
 */
export async function notifyPersonalizedRace(
  userId: string,
  race: { id: string; name: string; city: string; slug: string },
  matchReason: string,
  scoreBreakdown?: {
    heuristic: number;
    cosine_sim: number | null;
    final: number;
    source: "heuristic" | "blended" | "embedding";
  },
) {
  const supabase = createAdminClient();

  const { data: subs } = await supabase
    .from("push_subscriptions")
    .select("endpoint, p256dh, auth")
    .eq("user_id", userId);

  // Always persist the recommendation log even when the user has no active
  // push subscription, so the "Pra você porque..." chip can still light up
  // on the listing when they sign in.
  await supabase.from("race_recommendation_logs").upsert(
    {
      user_id: userId,
      race_id: race.id,
      match_reason: matchReason,
      match_score_breakdown: scoreBreakdown
        ? (scoreBreakdown as unknown as Json)
        : null,
    },
    { onConflict: "user_id,race_id" },
  );

  if (!subs || subs.length === 0) return { sent: 0 };

  const result = await sendToSubscriptions({
    title: "Corrida ideal pra você!",
    body: `${race.name} em ${race.city}. ${matchReason}`,
    url: `/corrida/${race.slug}`,
    subscriptions: subs,
  });

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
