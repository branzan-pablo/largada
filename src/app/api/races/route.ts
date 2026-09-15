import { NextResponse } from "next/server";
import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { requireAdmin } from "@/lib/auth";
import { enrichRace } from "@/lib/ai/enrich-race";
import { ITEMS_PER_PAGE } from "@/lib/constants";
import { todayInBrazil } from "@/lib/date";
import { slugify } from "@/lib/utils";
import { raceSchema } from "@/lib/validations";
import { PUBLIC_RACE_SUMMARY_COLUMNS } from "@/lib/public-races";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const supabase = await createClient();
  const today = todayInBrazil();

  const city = searchParams.get("city");
  const dateFrom = searchParams.get("dateFrom");
  const dateTo = searchParams.get("dateTo");
  const distances = searchParams.get("distances");
  const prizeType = searchParams.get("prizeType");
  const search = searchParams.get("search");
  const page = Math.max(1, Number.parseInt(searchParams.get("page") ?? "1", 10));
  const requestedLimit = Number.parseInt(searchParams.get("limit") ?? String(ITEMS_PER_PAGE), 10);
  const limit = Math.min(50, Math.max(1, requestedLimit));
  const from = (page - 1) * limit;

  let query = supabase
    .from("races")
    .select(PUBLIC_RACE_SUMMARY_COLUMNS, { count: "exact" })
    .eq("status", "confirmed")
    .gte("date", today)
    .gte("registration_deadline", today);

  if (city) query = query.eq("city", city);
  if (dateFrom) query = query.gte("date", dateFrom);
  if (dateTo) query = query.lte("date", dateTo);
  if (distances) query = query.overlaps("distances", distances.split(","));

  if (prizeType) {
    const types = prizeType.split(",");
    if ((types.includes("money") || types.includes("trophy")) && !types.includes("both")) {
      types.push("both");
    }
    query = query.in("prize_type", types);
  }

  if (search) {
    const sanitized = search.replace(/[%_\\]/g, "\\$&");
    query = query.or(
      `name.ilike.%${sanitized}%,city.ilike.%${sanitized}%,organizer.ilike.%${sanitized}%`,
    );
  }

  const { data, error, count } = await query
    .order("date", { ascending: true })
    .range(from, from + limit - 1);

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 400 });
  }

  const response = NextResponse.json({
    data: data ?? [],
    count: count ?? 0,
    page,
    limit,
    hasMore: count ? from + limit < count : false,
  });
  response.headers.set("Cache-Control", "public, s-maxage=60, stale-while-revalidate=300");
  return response;
}

export async function POST(request: Request) {
  const authResult = await requireAdmin();
  if (authResult instanceof NextResponse) return authResult;
  const { user, supabase } = authResult;

  const parsed = raceSchema.safeParse(await request.json());
  if (!parsed.success) {
    return NextResponse.json(
      { error: "Dados inválidos", details: parsed.error.issues },
      { status: 400 },
    );
  }

  const body = parsed.data;
  let slug = slugify(`${body.name}-${body.city}`);
  const adminClient = createAdminClient();
  const { data: existing } = await adminClient.from("races").select("slug").eq("slug", slug).maybeSingle();
  if (existing) slug = `${slug}-${Math.random().toString(36).substring(2, 6)}`;

  const { data: cityRow } = await adminClient
    .from("cities")
    .select("id")
    .ilike("name", body.city)
    .maybeSingle();

  const { data, error } = await supabase
    .from("races")
    .insert({
      name: body.name,
      slug,
      date: body.date,
      start_time: body.startTime,
      city: body.city,
      city_id: cityRow?.id ?? null,
      state: body.state ?? "SP",
      address: body.address,
      latitude: body.latitude,
      longitude: body.longitude,
      distances: body.distances,
      registration_price: body.registrationPrice ?? "",
      registration_prices: body.registrationPrices ?? null,
      registration_batches: body.registrationBatches ?? null,
      registration_link: body.registrationLink,
      registration_deadline: body.registrationDeadline,
      prize_type: body.prizeType,
      prize_details: body.prizeDetails ?? null,
      image_url: body.imageUrl ?? null,
      route_description: body.routeDescription ?? null,
      route_image_url: body.routeImageUrl ?? null,
      organizer: body.organizer ?? null,
      description: body.description ?? null,
      status: body.status ?? "confirmed",
      is_promoted: false,
      created_by: user.id,
      origin: "admin",
    })
    .select()
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 400 });

  revalidatePath("/");
  revalidatePath(`/corrida/${data.slug}`);
  try {
    await enrichRace(data.id);
  } catch (error) {
    console.error("[ai] enrichRace failed:", error);
  }

  return NextResponse.json(data, { status: 201 });
}
