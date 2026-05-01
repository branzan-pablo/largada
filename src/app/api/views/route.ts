import { NextRequest, NextResponse } from "next/server";
import { z } from "zod/v4";
import { createClient } from "@/lib/supabase/server";
import { rateLimit } from "@/lib/rate-limit";

const BodySchema = z.object({
  raceId: z.uuid(),
});

export async function POST(request: NextRequest) {
  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const parsed = BodySchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid body" }, { status: 400 });
  }
  const { raceId } = parsed.data;

  const ip =
    request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ||
    request.headers.get("x-real-ip") ||
    "unknown";

  // Anti-spam: cap views per IP+race at 1 per 10 minutes.
  const { limited } = rateLimit(`view:${ip}:${raceId}`, {
    max: 1,
    windowMs: 10 * 60 * 1000,
  });
  if (limited) {
    return NextResponse.json({ ok: true, deduped: true });
  }

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  await supabase
    .from("race_views")
    .insert({ race_id: raceId, user_id: user?.id ?? null });

  return NextResponse.json({ ok: true });
}
