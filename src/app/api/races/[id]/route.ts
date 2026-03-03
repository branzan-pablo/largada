import { NextResponse } from "next/server";
import { raceSchemaBase } from "@/lib/validations";
import { requireAdmin } from "@/lib/auth";
import { createAdminClient } from "@/lib/supabase/admin";
import { utcNow } from "@/lib/date";

export async function DELETE(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const authResult = await requireAdmin();
  if (authResult instanceof NextResponse) return authResult;

  const supabase = createAdminClient();
  const { error } = await supabase.from("races").delete().eq("id", id);

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 400 });
  }

  return NextResponse.json({ success: true });
}

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

  return NextResponse.json(data);
}
