// GET /api/cron/expire-promotions
// Resets is_promoted=false for races whose promoted_until has passed.
// Called daily by Vercel Cron. Protected by CRON_SECRET.

import { NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";

export async function GET(request: Request) {
    const authHeader = request.headers.get("authorization");
    if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
        return NextResponse.json({ error: "Não autorizado" }, { status: 401 });
    }

    const admin = createAdminClient();
    const now = new Date().toISOString();

    const { data, error } = await admin
        .from("races")
        .update({ is_promoted: false, promoted_until: null })
        .eq("is_promoted", true)
        .not("promoted_until", "is", null)
        .lt("promoted_until", now)
        .select("id, name, promoted_until");

    if (error) {
        console.error("[Cron] expire-promotions error:", error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }

    const count = data?.length ?? 0;
    console.info(`[Cron] expire-promotions: ${count} race(s) expired`);
    if (count > 0) {
        console.info("[Cron] expired races:", data?.map((r) => `${r.name} (${r.id})`));
    }

    return NextResponse.json({ expired: count });
}
