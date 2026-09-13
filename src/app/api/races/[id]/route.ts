import { NextResponse } from "next/server";
import { revalidatePath } from "next/cache";
import { raceSchemaBase } from "@/lib/validations";
import { requireAdmin } from "@/lib/auth";
import { createAdminClient } from "@/lib/supabase/admin";
import { utcNow } from "@/lib/date";
import { notifyNewRace } from "@/lib/notifications";
import { enrichRace } from "@/lib/ai/enrich-race";

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const authResult = await requireAdmin();
  if (authResult instanceof NextResponse) return authResult;
  const { supabase } = authResult;

  const raw = await request.json();

  // Validate with partial schema (PATCH allows partial updates)
  const partialSchema = raceSchemaBase.partial();
  const parsed = partialSchema.safeParse(raw);

  if (!parsed.success) {
    return NextResponse.json(
      { error: "Dados inválidos", details: parsed.error.issues },
      { status: 400 }
    );
  }

  const body = parsed.data as Record<string, unknown>;

  const updateData: Record<string, unknown> = {
    updated_at: utcNow(),
  };

  const fieldMap: Record<string, string> = {
    name: "name",
    date: "date",
    startTime: "start_time",
    city: "city",
    state: "state",
    address: "address",
    latitude: "latitude",
    longitude: "longitude",
    distances: "distances",
    registrationPrice: "registration_price",
    registrationPrices: "registration_prices",
    registrationBatches: "registration_batches",
    registrationLink: "registration_link",
    registrationDeadline: "registration_deadline",
    prizeType: "prize_type",
    prizeDetails: "prize_details",
    imageUrl: "image_url",
    routeDescription: "route_description",
    routeImageUrl: "route_image_url",
    organizer: "organizer",
    description: "description",
    status: "status",
    isPromoted: "is_promoted",
  };

  for (const [camel, snake] of Object.entries(fieldMap)) {
    if (body[camel] !== undefined) {
      updateData[snake] = body[camel];
    }
  }

  // Capture current status before update so we can detect a transition to confirmed
  let previousStatus: string | null = null;
  if (updateData.status === "confirmed") {
    const { data: current } = await supabase
      .from("races")
      .select("status")
      .eq("id", id)
      .single();
    previousStatus = current?.status ?? null;
  }

  // Resolve city_id when city changes
  if (updateData.city) {
    const adminClient = createAdminClient();
    const { data: cityRow } = await adminClient
      .from("cities")
      .select("id")
      .ilike("name", updateData.city as string)
      .single();
    updateData.city_id = cityRow?.id ?? null;
  }

  const { data, error } = await supabase
    .from("races")
    .update(updateData)
    .eq("id", id)
    .select()
    .single();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 400 });
  }

  revalidatePath("/corridas");
  if (data?.slug) revalidatePath(`/corrida/${data.slug}`);

  // Re-run AI enrichment when fields that feed the embedding or the prize
  // extractor change. Awaited inline with graceful failure so a provider
  // outage never blocks the admin save.
  const ENRICH_TRIGGER_FIELDS = [
    "name",
    "city",
    "date",
    "organizer",
    "prize_type",
    "prize_details",
  ];
  if (ENRICH_TRIGGER_FIELDS.some((f) => f in updateData)) {
    try {
      await enrichRace(id);
    } catch (err) {
      console.error("[ai] enrichRace on PATCH failed:", err);
    }
  }

  // Notify when race transitions to confirmed for the first time
  if (updateData.status === "confirmed" && previousStatus !== "confirmed") {
    try {
      await notifyNewRace(id);
    } catch (err) {
      console.error("[races/id] notifyNewRace failed:", err);
    }
  }

  return NextResponse.json(data);
}
