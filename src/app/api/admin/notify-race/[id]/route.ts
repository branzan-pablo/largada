import { NextResponse } from "next/server";
import { requireAdmin } from "@/lib/auth";
import { notifyNewRace } from "@/lib/notifications";
import { createAdminClient } from "@/lib/supabase/admin";

/**
 * POST /api/admin/notify-race/:id
 *
 * Manually fires the "VAI TER CORRIDA!" push for a specific race.
 * Useful to verify end-to-end delivery on a single race before
 * letting the daily backlog cron process the whole catalog.
 *
 * Returns the resolved counts so it doubles as an inspection probe:
 *   { status, recipients, subs, sent, failed, race: { id, name, slug, status } }
 *
 * Note: also stamps races.notification_sent_at on success — calling
 * this twice will be a no-op the second time (status='no-recipients'
 * shape because the cron also marks the row, and re-running this
 * endpoint will re-stamp anyway). To force a re-send, manually clear
 * notification_sent_at in SQL first.
 */
export async function POST(
  _request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const authResult = await requireAdmin();
  if (authResult instanceof NextResponse) return authResult;

  const { id } = await params;

  const supabase = createAdminClient();
  const { data: race, error } = await supabase
    .from("races")
    .select("id, name, slug, status, latitude, longitude, notification_sent_at")
    .eq("id", id)
    .single();

  if (error || !race) {
    return NextResponse.json({ error: "Corrida não encontrada" }, { status: 404 });
  }

  const result = await notifyNewRace(id);

  return NextResponse.json({
    race: {
      id: race.id,
      name: race.name,
      slug: race.slug,
      status: race.status,
      latitude: race.latitude,
      longitude: race.longitude,
      previousNotificationSentAt: race.notification_sent_at,
    },
    ...result,
  });
}
