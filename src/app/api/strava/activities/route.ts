import { NextRequest, NextResponse } from "next/server";
import { requireAuth } from "@/lib/auth";
import { createAdminClient } from "@/lib/supabase/admin";
import { getAthleteData } from "@/lib/strava";

/**
 * GET /api/strava/activities
 * Returns cached Strava activities and stats for the authenticated user.
 * Query param ?refresh=1 forces a fresh fetch from Strava.
 */
export async function GET(request: NextRequest) {
  const authResult = await requireAuth();
  if (authResult instanceof NextResponse) return authResult;
  const { user } = authResult;

  try {
    const forceRefresh = request.nextUrl.searchParams.get("refresh") === "1";
    const admin = createAdminClient();

    const data = await getAthleteData(admin, user.id, forceRefresh);

    return NextResponse.json(data);
  } catch (err) {
    console.error("[/api/strava/activities] Error:", err);
    return NextResponse.json(
      { error: "Erro ao carregar atividades" },
      { status: 500 }
    );
  }
}
