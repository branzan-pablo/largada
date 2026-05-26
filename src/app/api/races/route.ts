import { NextResponse } from "next/server";
import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { slugify } from "@/lib/utils";
import { todayInBrazil } from "@/lib/date";
import { haversineDistance } from "@/lib/geo";
import { ITEMS_PER_PAGE } from "@/lib/constants";
import { notifyNewRace } from "@/lib/notifications";
import { raceSchema } from "@/lib/validations";
import { requireAdmin } from "@/lib/auth";
import { enrichRace } from "@/lib/ai/enrich-race";
import { embedText, toPgVector } from "@/lib/ai/embed";
import { isAIEnabled } from "@/lib/ai/provider";

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
  const semanticMode = searchParams.get("mode") === "semantic";

  // When semantic search is requested and we have a query, embed it and
  // resolve the top N matches by cosine similarity. The IDs replace the
  // ILIKE branch below; other filters (city, date, distance, prize) still
  // apply on top of the semantic candidate set.
  let semanticIds: string[] | null = null;
  let usedSemantic = false;
  if (semanticMode && search && isAIEnabled()) {
    try {
      const queryEmbedding = await embedText(search);
      const { data: matches, error: matchError } = await supabase.rpc(
        "match_races_semantic_any_date",
        {
          query_embedding: toPgVector(queryEmbedding),
          match_threshold: 0.5,
          match_count: 50,
        },
      );
      if (!matchError && matches && matches.length > 0) {
        semanticIds = matches.map((m) => m.id);
        usedSemantic = true;
      }
    } catch (err) {
      console.error("[races] semantic search failed, falling back:", err);
    }
  }

  let query = supabase.from("races").select("*, cities(latitude, longitude)", { count: "exact" });

  // Only confirmed races for public API
  query = query.eq("status", "confirmed");

  // Only future races by default
  const today = todayInBrazil();
  if (!includePast) {
    query = query.gte("date", today);
  }

  // Hide races with closed registrations (but keep promoted races visible)
  query = query.or(`registration_deadline.gte.${today},is_promoted.eq.true`);

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

  if (usedSemantic && semanticIds) {
    // Semantic mode replaces the ILIKE branch. Limit the query to the candidate
    // set; ordering by similarity is reapplied in JS below because Postgres
    // returns the `.in()` rows in arbitrary order.
    query = query.in("id", semanticIds);
  } else if (search) {
    // Sanitize search input — escape Postgres LIKE wildcards
    const sanitized = search.replace(/[%_\\]/g, "\\$&");
    query = query.or(
      `name.ilike.%${sanitized}%,city.ilike.%${sanitized}%,organizer.ilike.%${sanitized}%`
    );
  }

  // Default order: promoted first, then date ascending. In semantic mode we
  // skip this and reapply the similarity ranking in JS below.
  if (!usedSemantic) {
    query = query
      .order("is_promoted", { ascending: false })
      .order("date", { ascending: true });
  }

  // Pagination. Semantic mode returns at most 50 matches and disables
  // pagination — every match comes back in a single response.
  const from = (page - 1) * limit;
  if (!usedSemantic) {
    const to = from + limit - 1;
    query = query.range(from, to);
  }

  const { data, error, count } = await query;

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 400 });
  }

  let filteredData = data ?? [];

  // Reapply the semantic order: Postgres `.in()` doesn't preserve list order,
  // so we sort the returned rows by their position in the original similarity
  // ranking. Rows missing from the ID list go to the end (defensive only —
  // shouldn't happen because we filtered by these IDs).
  if (usedSemantic && semanticIds) {
    const order = new Map(semanticIds.map((id, idx) => [id, idx]));
    filteredData = [...filteredData].sort(
      (a, b) =>
        (order.get(a.id) ?? Number.MAX_SAFE_INTEGER) -
        (order.get(b.id) ?? Number.MAX_SAFE_INTEGER),
    );
  }

  // Join the user's match_reason on top of the race rows so the listing card
  // can render the "Pra você porque..." chip without a second round trip.
  // We do this in JS (not a SQL join) because the cardinality is tiny — at
  // most ITEMS_PER_PAGE races — and Supabase doesn't easily express a
  // filtered left join with a foreign-table user_id predicate.
  let isPersonalized = false;
  if (filteredData.length > 0) {
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (user) {
      const raceIds = filteredData.map((r) => r.id);
      const { data: logs } = await supabase
        .from("race_recommendation_logs")
        .select("race_id, match_reason")
        .eq("user_id", user.id)
        .in("race_id", raceIds);
      if (logs && logs.length > 0) {
        const reasonByRace = new Map(
          logs
            .filter((l) => l.match_reason)
            .map((l) => [l.race_id, l.match_reason as string]),
        );
        if (reasonByRace.size > 0) {
          filteredData = filteredData.map((race) => ({
            ...race,
            match_reason: reasonByRace.get(race.id) ?? null,
          }));
          isPersonalized = true;
        }
      }
    }
  }

  // Radius filter (Haversine — kept client-side, PostGIS would be needed to move server-side)
  if (lat && lng && radius) {
    const userLat = parseFloat(lat);
    const userLng = parseFloat(lng);
    const maxRadius = parseFloat(radius);
    filteredData = filteredData.filter((race) => {
      if (race.is_promoted) return true;
      const raceLat = race.latitude || race.cities?.latitude || 0;
      const raceLng = race.longitude || race.cities?.longitude || 0;
      // Include races with no coordinates (0,0) rather than silently excluding them
      if (raceLat === 0 && raceLng === 0) return true;
      return haversineDistance(userLat, userLng, raceLat, raceLng) <= maxRadius;
    });
  }

  // When client-side filters (radius) are active, the DB count is unreliable.
  // Semantic mode returns everything in one response, so the visible count is
  // simply the filtered length and there are never more pages.
  const hasClientFilters = !!lat && !!lng && !!radius;
  const filteredCount = usedSemantic
    ? filteredData.length
    : hasClientFilters
      ? null
      : count;
  const hasMore = usedSemantic
    ? false
    : hasClientFilters
      ? (data?.length ?? 0) >= limit
      : count ? from + limit < count : false;

  const response = NextResponse.json({
    data: filteredData,
    count: filteredCount,
    page,
    limit,
    hasMore,
  });
  // Personalized responses include per-user match_reason and must not be
  // shared by the CDN cache. Anonymous responses stay on the same SWR policy.
  response.headers.set(
    "Cache-Control",
    isPersonalized
      ? "private, no-store"
      : "public, s-maxage=60, stale-while-revalidate=300",
  );
  return response;
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

  // Bust ISR caches so the listing and detail page reflect the new race.
  // pending_review races are filtered out of the listing query, but admin
  // may still visit the detail URL — revalidating both is cheap and safe.
  revalidatePath("/corridas");
  if (data?.slug) revalidatePath(`/corrida/${data.slug}`);

  // AI enrichment: structured prize + fingerprint embedding. Awaited inline
  // because Vercel kills the runtime after response, but the call is wrapped
  // in graceful-failure so a provider outage never blocks the admin flow.
  try {
    await enrichRace(data.id);
  } catch (err) {
    console.error("[ai] enrichRace failed:", err);
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
