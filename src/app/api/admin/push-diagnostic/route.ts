import { NextResponse } from "next/server";
import webpush from "web-push";
import { requireAdmin } from "@/lib/auth";
import { createAdminClient } from "@/lib/supabase/admin";

/**
 * GET /api/admin/push-diagnostic
 *
 * Read-only diagnostic for the Web Push delivery pipeline.
 * Reports VAPID env presence (without exposing secret values), inspects the
 * admin user's own push subscriptions, and attempts a single send so the raw
 * web-push error (statusCode/headers/body) can be inspected directly in the
 * browser response — without needing access to Vercel logs.
 *
 * Returns JSON. The actual notification is delivered only to subscriptions
 * owned by the calling admin (never to other users).
 */
export async function GET() {
  const authResult = await requireAdmin();
  if (authResult instanceof NextResponse) return authResult;
  const { user } = authResult;

  const publicKey = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY;
  const privateKey = process.env.VAPID_PRIVATE_KEY;
  const subject = process.env.VAPID_SUBJECT;

  const env = {
    hasPublicKey: !!publicKey,
    hasPrivateKey: !!privateKey,
    hasSubject: !!subject,
    publicKeyPrefix: publicKey ? publicKey.slice(0, 8) : null,
    publicKeyLength: publicKey ? publicKey.length : 0,
    privateKeyLength: privateKey ? privateKey.length : 0,
    subjectPrefix: subject ? subject.slice(0, 12) : null,
    appUrl: process.env.NEXT_PUBLIC_APP_URL ?? null,
  };

  let setVapidError: string | null = null;
  if (publicKey && privateKey && subject) {
    try {
      webpush.setVapidDetails(subject, publicKey, privateKey);
    } catch (err) {
      setVapidError = (err as Error).message;
    }
  } else {
    setVapidError = "missing env vars (skipped setVapidDetails)";
  }

  const supabase = createAdminClient();

  const { count: totalSubs } = await supabase
    .from("push_subscriptions")
    .select("*", { count: "exact", head: true });

  const { data: mySubs } = await supabase
    .from("push_subscriptions")
    .select("id, endpoint, p256dh, auth, created_at, updated_at")
    .eq("user_id", user.id)
    .order("updated_at", { ascending: false });

  const subSummary = (mySubs ?? []).map((s) => {
    let host = "unknown";
    try {
      host = new URL(s.endpoint).host;
    } catch {
      // ignore
    }
    return {
      id: s.id,
      host,
      endpointTail: s.endpoint.slice(-12),
      p256dhLength: s.p256dh.length,
      authLength: s.auth.length,
      created_at: s.created_at,
      updated_at: s.updated_at,
    };
  });

  let sendAttempt: unknown = null;
  if (mySubs && mySubs.length > 0 && !setVapidError) {
    const target = mySubs[0];
    try {
      const payload = JSON.stringify({
        title: "Push diagnostic",
        body: "Se você está vendo isto, o pipeline está OK.",
        url: `${process.env.NEXT_PUBLIC_APP_URL ?? ""}/perfil`,
      });
      const result = await webpush.sendNotification(
        {
          endpoint: target.endpoint,
          keys: { p256dh: target.p256dh, auth: target.auth },
        },
        payload,
      );
      sendAttempt = {
        ok: true,
        targetSubId: target.id,
        statusCode: result.statusCode,
        headers: result.headers,
      };
    } catch (err) {
      const e = err as {
        name?: string;
        message?: string;
        statusCode?: number;
        headers?: Record<string, string>;
        body?: string;
        endpoint?: string;
      };
      sendAttempt = {
        ok: false,
        targetSubId: target.id,
        error: {
          name: e?.name ?? "Error",
          message: e?.message ?? String(err),
          statusCode: e?.statusCode ?? null,
          headers: e?.headers ?? null,
          body: e?.body ?? null,
        },
      };
    }
  } else if (mySubs && mySubs.length === 0) {
    sendAttempt = { skipped: "no subscriptions for this admin user" };
  } else if (setVapidError) {
    sendAttempt = { skipped: `vapid not configured: ${setVapidError}` };
  }

  return NextResponse.json({
    userId: user.id,
    env,
    setVapidError,
    totalSubsInDb: totalSubs ?? 0,
    mySubsCount: mySubs?.length ?? 0,
    mySubs: subSummary,
    sendAttempt,
  });
}
