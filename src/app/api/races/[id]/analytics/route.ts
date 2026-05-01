import { NextRequest, NextResponse } from "next/server";
import { z } from "zod/v4";
import { requireAuth } from "@/lib/auth";
import { pastUtc } from "@/lib/date";

const ParamsSchema = z.object({ id: z.uuid() });

export type DailyPoint = {
  date: string;
  views: number;
  clicks: number;
};

export type RaceAnalytics = {
  totals: { views: number; clicks: number; ctr: number };
  daily: DailyPoint[];
};

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const auth = await requireAuth();
  if (auth instanceof NextResponse) return auth;
  const { user, supabase } = auth;

  const parsed = ParamsSchema.safeParse(await params);
  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid race id" }, { status: 400 });
  }
  const raceId = parsed.data.id;

  const { data: race } = await supabase
    .from("races")
    .select("id, created_by")
    .eq("id", raceId)
    .single();

  if (!race) {
    return NextResponse.json({ error: "Corrida não encontrada" }, { status: 404 });
  }

  const { data: profile } = await supabase
    .from("profiles")
    .select("role")
    .eq("id", user.id)
    .single();
  const isAdmin = profile?.role === "admin";
  const isOwner = race.created_by === user.id;

  if (!isOwner && !isAdmin) {
    return NextResponse.json({ error: "Acesso negado" }, { status: 403 });
  }

  const since = pastUtc(30);

  const [viewsRes, clicksRes] = await Promise.all([
    supabase
      .from("race_views")
      .select("viewed_at")
      .eq("race_id", raceId)
      .gte("viewed_at", since),
    supabase
      .from("link_clicks")
      .select("clicked_at")
      .eq("race_id", raceId)
      .gte("clicked_at", since),
  ]);

  const buckets = new Map<string, { views: number; clicks: number }>();
  const seedRange = () => {
    for (let i = 29; i >= 0; i--) {
      const d = new Date(Date.now() - i * 24 * 60 * 60 * 1000);
      const key = d.toISOString().slice(0, 10);
      buckets.set(key, { views: 0, clicks: 0 });
    }
  };
  seedRange();

  for (const row of viewsRes.data ?? []) {
    const key = row.viewed_at.slice(0, 10);
    const bucket = buckets.get(key) ?? { views: 0, clicks: 0 };
    bucket.views++;
    buckets.set(key, bucket);
  }
  for (const row of clicksRes.data ?? []) {
    const key = row.clicked_at.slice(0, 10);
    const bucket = buckets.get(key) ?? { views: 0, clicks: 0 };
    bucket.clicks++;
    buckets.set(key, bucket);
  }

  const daily: DailyPoint[] = Array.from(buckets.entries())
    .sort(([a], [b]) => (a < b ? -1 : 1))
    .map(([date, v]) => ({ date, views: v.views, clicks: v.clicks }));

  const views = viewsRes.data?.length ?? 0;
  const clicks = clicksRes.data?.length ?? 0;
  const ctr = views > 0 ? clicks / views : 0;

  const payload: RaceAnalytics = {
    totals: { views, clicks, ctr },
    daily,
  };

  return NextResponse.json(payload);
}
