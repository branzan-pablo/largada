import { NextRequest, NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";

interface StravaWebhookEvent {
  object_type: "activity" | "athlete";
  object_id: number;
  aspect_type: "create" | "update" | "delete";
  updates: Record<string, string>;
  owner_id: number;
  subscription_id: number;
  event_time: number;
}

/**
 * GET — Strava subscription validation.
 * Strava sends a GET request with hub.mode, hub.challenge, hub.verify_token
 * when creating a webhook subscription. We must echo back hub.challenge.
 */
export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const mode = searchParams.get("hub.mode");
  const challenge = searchParams.get("hub.challenge");
  const verifyToken = searchParams.get("hub.verify_token");

  if (
    mode === "subscribe" &&
    verifyToken === process.env.STRAVA_WEBHOOK_VERIFY_TOKEN
  ) {
    return NextResponse.json({ "hub.challenge": challenge });
  }

  return NextResponse.json({ error: "Forbidden" }, { status: 403 });
}

/**
 * POST — Strava webhook event.
 * Must respond with 200 within 2 seconds (Strava retries up to 3 times).
 * Currently handles athlete deauthorization events only.
 */
export async function POST(request: NextRequest) {
  let body: StravaWebhookEvent;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const { object_type, aspect_type, owner_id, updates } = body;

  // Handle athlete deauthorization (MANDATORY per Strava API Agreement)
  if (
    object_type === "athlete" &&
    aspect_type === "update" &&
    updates?.authorized === "false"
  ) {
    await handleStravaDeauth(owner_id);
  }

  return NextResponse.json({ received: true }, { status: 200 });
}

/**
 * Handles Strava deauthorization: removes all Strava-related data for the athlete.
 * Called when Strava notifies us that a user has revoked access.
 */
async function handleStravaDeauth(athleteId: number) {
  const admin = createAdminClient();

  // Find user by athlete ID
  const { data: profile } = await admin
    .from("profiles")
    .select("id")
    .eq("strava_athlete_id", athleteId)
    .maybeSingle();

  if (!profile) {
    console.warn(
      `[Strava Webhook] Deauth for unknown athlete ${athleteId} — skipping`
    );
    return;
  }

  // Delete stored tokens
  await admin.from("strava_tokens").delete().eq("user_id", profile.id);

  // Clear strava_athlete_id from profile
  await admin
    .from("profiles")
    .update({ strava_athlete_id: null })
    .eq("id", profile.id);

  // Clear Strava-specific metadata from auth user
  const { data: userData } = await admin.auth.admin.getUserById(profile.id);
  if (userData?.user?.user_metadata?.provider === "strava") {
    await admin.auth.admin.updateUserById(profile.id, {
      user_metadata: {
        ...userData.user.user_metadata,
        strava_id: null,
        provider: null,
      },
    });
  }

  console.info(
    `[Strava Webhook] Deauthorized athlete ${athleteId}, user ${profile.id}`
  );
}
