// POST /api/radar/analyze
// Analisa corridas compatíveis com o perfil do corredor.
// Requer autenticação. Salva/atualiza o perfil e registra a análise.

import { NextRequest, NextResponse } from "next/server";
import { z } from "zod/v4";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { todayInBrazil } from "@/lib/date";
import {
  scoreRaces,
  FREE_RESULTS_COUNT,
  MIN_RECOMMENDED_SCORE,
  type RaceCandidate,
  type ScoredRace,
} from "@/lib/radar/scoring";

const analyzeSchema = z.object({
  pace: z.string().regex(/^\d{2}:\d{2}$/),
  distance: z.enum(["5k", "10k", "21k", "42k"]),
  sex: z.enum(["masculino", "feminino"]),
  ageCategory: z.string().min(1),
  city: z.string().min(1),
  cityId: z.string().nullable().optional(),
  state: z.string().nullable().optional(),
  latitude: z.number().nullable().optional(),
  longitude: z.number().nullable().optional(),
});

export async function POST(request: NextRequest) {
  try {
    // 1. Authenticate
    const supabase = await createClient();
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: "Não autorizado" }, { status: 401 });
    }

    // 2. Parse & validate body
    const body = await request.json();
    const parsed = analyzeSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { error: "Dados inválidos", details: parsed.error.issues },
        { status: 400 },
      );
    }

    const input = parsed.data;
    const admin = createAdminClient();

    // 3. Upsert radar profile
    const profileData = {
      user_id: user.id,
      pace: input.pace,
      preferred_distances: [input.distance],
      sex: input.sex,
      age_category: input.ageCategory,
      city: input.city,
      city_id: input.cityId ?? null,
      state: input.state ?? null,
      latitude: input.latitude ?? null,
      longitude: input.longitude ?? null,
    };

    const { data: profile, error: profileError } = await admin
      .from("radar_profiles")
      .upsert(profileData, { onConflict: "user_id" })
      .select("id")
      .single();

    if (profileError) {
      console.error("[Radar] Failed to upsert profile:", profileError);
      return NextResponse.json(
        { error: "Falha ao salvar perfil" },
        { status: 500 },
      );
    }

    // 4. Fetch upcoming races with matching distance
    const today = todayInBrazil();
    const { data: races, error: racesError } = await supabase
      .from("races")
      .select(
        "id, name, slug, date, start_time, city, state, latitude, longitude, distances, rsvp_count, prize_type, prize_details, registration_price, registration_link, image_url, is_promoted",
      )
      .gte("date", today)
      .eq("status", "confirmed")
      .contains("distances", [input.distance])
      .order("date", { ascending: true })
      .limit(100);

    if (racesError) {
      console.error("[Radar] Failed to fetch races:", racesError);
      return NextResponse.json(
        { error: "Falha ao buscar corridas" },
        { status: 500 },
      );
    }

    // 5. Score races
    const candidates: RaceCandidate[] = (races ?? []).map((r) => ({
      id: r.id,
      name: r.name,
      slug: r.slug,
      date: r.date,
      startTime: r.start_time,
      city: r.city,
      state: r.state,
      latitude: r.latitude,
      longitude: r.longitude,
      distances: r.distances,
      rsvpCount: r.rsvp_count,
      prizeType: r.prize_type,
      prizeDetails: r.prize_details,
      registrationPrice: r.registration_price,
      registrationLink: r.registration_link,
      imageUrl: r.image_url,
      isPromoted: r.is_promoted,
    }));

    const scored = scoreRaces(
      {
        pace: input.pace,
        distance: input.distance,
        sex: input.sex,
        ageCategory: input.ageCategory,
        city: input.city,
        latitude: input.latitude ?? null,
        longitude: input.longitude ?? null,
      },
      candidates,
    );

    const recommended = scored.filter((s) => s.score >= MIN_RECOMMENDED_SCORE);

    // 6. Record analysis
    await admin.from("radar_analyses").insert({
      user_id: user.id,
      profile_id: profile.id,
      distance_filter: input.distance,
      races_found: scored.length,
      races_recommended: recommended.length,
      is_paid: false,
    });

    // 7. Build response — free users see first N results with details, rest blurred
    const freeResults: ScoredRace[] = scored.slice(0, FREE_RESULTS_COUNT);
    const lockedResults: Array<{
      score: number;
      label: string;
      race: { city: string; state: string; date: string };
    }> = scored.slice(FREE_RESULTS_COUNT).map((s) => ({
      score: s.score,
      label: s.label,
      race: {
        city: s.race.city,
        state: s.race.state,
        date: s.race.date,
      },
    }));

    return NextResponse.json({
      totalFound: scored.length,
      totalRecommended: recommended.length,
      freeResults,
      lockedCount: lockedResults.length,
      lockedResults,
      profile: {
        id: profile.id,
        pace: input.pace,
        distance: input.distance,
        sex: input.sex,
        ageCategory: input.ageCategory,
        city: input.city,
      },
    });
  } catch (error) {
    console.error("[Radar] Unexpected error:", error);
    return NextResponse.json(
      { error: "Erro interno do servidor" },
      { status: 500 },
    );
  }
}
