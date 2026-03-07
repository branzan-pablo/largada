import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { slugify } from "@/lib/utils";
import { todayInBrazil } from "@/lib/date";
import { haversineDistance } from "@/lib/geo";
import { ITEMS_PER_PAGE } from "@/lib/constants";
import { notifyNewRace } from "@/lib/notifications";
import { raceSchema } from "@/lib/validations";
import { requireAdmin } from "@/lib/auth";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const supabase = await createClient();

  const city = searchParams.get("city");
  const dateFrom = searchParams.get("dateFrom");
  const dateTo = searchParams.get("dateTo");
  const distances = searchParams.get("distances");
  const prizeType = searchParams.get("prizeType");
  const search = searchParams.get("search");
  const lat = searchParams.get("lat");
  const lng = searchParams.get("lng");
  const radius = searchParams.get("radius");
  const page = parseInt(searchParams.get("page") ?? "1");
  const limit = parseInt(
    searchParams.get("limit") ?? String(ITEMS_PER_PAGE)
  );
  const includePast = searchParams.get("includePast") === "true";

  let query = supabase.from("races").select("*, cities(latitude, longitude)", { count: "exact" });

  // Only confirmed races for public API
  query = query.eq("status", "confirmed");

  // Only future races by default
  const today = todayInBrazil();
  if (!includePast) {
    query = query.gte("date", today);
  }

  // Hide races with closed registrations
  query = query.gte("registration_deadline", today);

  if (city) {
    query = query.eq("city", city);
  }

  if (dateFrom) {
    query = query.gte("date", dateFrom);
  }

  if (dateTo) {
    query = query.lte("date", dateTo);
  }

  if (prizeType) {
    const types = prizeType.split(",");
    // Include "both" when filtering by "money" or "trophy" individually
    if (types.includes("money") && !types.includes("both")) {
      types.push("both");
    }
    if (types.includes("trophy") && !types.includes("both")) {
      types.push("both");
    }
    query = query.in("prize_type", types);
  }

  if (distances) {
    const distanceList = distances.split(",");
    query = query.overlaps("distances", distanceList);
  }

  if (search) {
    // Sanitize search input — escape Postgres LIKE wildcards
    const sanitized = search.replace(/[%_\\]/g, "\\$&");
    query = query.or(
      `name.ilike.%${sanitized}%,city.ilike.%${sanitized}%,organizer.ilike.%${sanitized}%`
    );
  }

  // Promoted races first, then by date ascending
  query = query
    .order("is_promoted", { ascending: false })
    .order("date", { ascending: true });

  // Pagination
  const from = (page - 1) * limit;
  const to = from + limit - 1;
  query = query.range(from, to);

  const { data, error, count } = await query;

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 400 });
  }

  let filteredData = data ?? [];

  // Radius filter (Haversine — kept client-side, PostGIS would be needed to move server-side)
  if (lat && lng && radius) {
    const userLat = parseFloat(lat);
    const userLng = parseFloat(lng);
    const maxRadius = parseFloat(radius);
    filteredData = filteredData.filter((race) => {
      const raceLat = race.latitude || race.cities?.latitude || 0;
      const raceLng = race.longitude || race.cities?.longitude || 0;
      // Include races with no coordinates (0,0) rather than silently excluding them
      if (raceLat === 0 && raceLng === 0) return true;
      return haversineDistance(userLat, userLng, raceLat, raceLng) <= maxRadius;
    });
  }

  // When client-side filters (radius) are active, the DB count is unreliable
  const hasClientFilters = !!lat && !!lng && !!radius;
  const filteredCount = hasClientFilters ? null : count;
  // If client-side filters are active, we can only know there are more pages
  // if the DB returned a full page (meaning there might be more to fetch)
  const hasMore = hasClientFilters
    ? (data?.length ?? 0) >= limit
    : count ? from + limit < count : false;

  return NextResponse.json({
    data: filteredData,
    count: filteredCount,
    page,
    limit,
    hasMore,
  });
}

export async function POST(request: Request) {
  const authResult = await requireAdmin();
  if (authResult instanceof NextResponse) return authResult;
  const { user, supabase } = authResult;

  const raw = await request.json();
  const parsed = raceSchema.safeParse(raw);

  if (!parsed.success) {
    return NextResponse.json(
      { error: "Dados inválidos", details: parsed.error.issues },
      { status: 400 }
    );
  }

  const body = parsed.data;

  // Generate slug
  let slug = slugify(`${body.name}-${body.city}`);

  // Check for slug collision using admin client (bypasses RLS)
  const adminClient = createAdminClient();
  const { data: existing } = await adminClient
    .from("races")
    .select("slug")
    .eq("slug", slug)
    .single();

  if (existing) {
    const randomSuffix = Math.random().toString(36).substring(2, 6);
    slug = `${slug}-${randomSuffix}`;
  }

  // Resolve city_id from cities table
  const { data: cityRow } = await adminClient
    .from("cities")
    .select("id")
    .ilike("name", body.city)
    .single();

  const raceData = {
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
    status: (body.status ?? "confirmed") as string,
    is_promoted: body.isPromoted ?? false,
    created_by: user.id,
    origin: raw.origin === "approved_suggestion" ? "approved_suggestion" : "admin",
  };

  // Suggestions enter as pending_review
  if (raceData.origin === "approved_suggestion") {
    raceData.status = "pending_review";
  }

  const { data, error } = await supabase
    .from("races")
    .insert(raceData)
    .select()
    .single();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 400 });
  }

  // Only notify for directly confirmed races (not pending_review)
  if (data.status === "confirmed") {
    try {
      await notifyNewRace(data.id);
    } catch (err) {
      console.error("[notifications] notifyNewRace failed:", err);
    }
  }

  return NextResponse.json(data, { status: 201 });
}
