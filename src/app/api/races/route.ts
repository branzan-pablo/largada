import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { slugify } from "@/lib/utils";
import { haversineDistance } from "@/lib/geo";
import { ITEMS_PER_PAGE } from "@/lib/constants";
import { notifyNewRace } from "@/lib/notifications";

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

  let query = supabase.from("races").select("*", { count: "exact" });

  // Only future races by default
  if (!includePast) {
    const today = new Date().toISOString().split("T")[0];
    query = query.gte("date", today);
  }

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
    query = query.in("prize_type", types);
  }

  if (search) {
    query = query.or(
      `name.ilike.%${search}%,city.ilike.%${search}%,organizer.ilike.%${search}%`
    );
  }

  // Sort by date ascending
  query = query.order("date", { ascending: true });

  // Pagination
  const from = (page - 1) * limit;
  const to = from + limit - 1;
  query = query.range(from, to);

  const { data, error, count } = await query;

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 400 });
  }

  let filteredData = data ?? [];

  // Distance filter (array overlap — show races that have at least one of the selected distances)
  if (distances) {
    const distanceList = distances.split(",");
    filteredData = filteredData.filter((race) =>
      race.distances.some((d: string) => distanceList.includes(d))
    );
  }

  // Radius filter (Haversine)
  if (lat && lng && radius) {
    const userLat = parseFloat(lat);
    const userLng = parseFloat(lng);
    const maxRadius = parseFloat(radius);
    filteredData = filteredData.filter(
      (race) =>
        haversineDistance(userLat, userLng, race.latitude, race.longitude) <=
        maxRadius
    );
  }

  return NextResponse.json({
    data: filteredData,
    count,
    page,
    limit,
    hasMore: count ? from + limit < count : false,
  });
}

export async function POST(request: Request) {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Não autorizado" }, { status: 401 });
  }

  // Check admin role
  const { data: profile } = await supabase
    .from("profiles")
    .select("role")
    .eq("id", user.id)
    .single();

  if (profile?.role !== "admin") {
    return NextResponse.json({ error: "Acesso negado" }, { status: 403 });
  }

  const body = await request.json();

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

  const raceData = {
    name: body.name,
    slug,
    date: body.date,
    start_time: body.startTime,
    city: body.city,
    state: body.state ?? "SP",
    address: body.address,
    latitude: body.latitude,
    longitude: body.longitude,
    distances: body.distances,
    registration_price: body.registrationPrice,
    registration_link: body.registrationLink,
    registration_deadline: body.registrationDeadline,
    prize_type: body.prizeType,
    prize_details: body.prizeDetails ?? null,
    route_description: body.routeDescription ?? null,
    route_image_url: body.routeImageUrl ?? null,
    organizer: body.organizer ?? null,
    description: body.description ?? null,
    status: body.status ?? "confirmed",
    created_by: user.id,
    origin: body.origin ?? "admin",
  };

  const { data, error } = await supabase
    .from("races")
    .insert(raceData)
    .select()
    .single();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 400 });
  }

  // Send push notifications before returning (Vercel kills the runtime after response)
  try {
    await notifyNewRace(data.id);
  } catch (err) {
    console.error("[notifications] notifyNewRace failed:", err);
  }

  return NextResponse.json(data, { status: 201 });
}
