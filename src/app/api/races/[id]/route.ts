import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { raceSchema } from "@/lib/validations";

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Não autorizado" }, { status: 401 });
  }

  const { data: profile } = await supabase
    .from("profiles")
    .select("role")
    .eq("id", user.id)
    .single();

  if (profile?.role !== "admin") {
    return NextResponse.json({ error: "Acesso negado" }, { status: 403 });
  }

  const raw = await request.json();

  // Validate with partial schema (PATCH allows partial updates)
  const partialSchema = raceSchema.partial();
  const parsed = partialSchema.safeParse(raw);

  if (!parsed.success) {
    return NextResponse.json(
      { error: "Dados inválidos", details: parsed.error.issues },
      { status: 400 }
    );
  }

  const body = parsed.data as Record<string, unknown>;

  const updateData: Record<string, unknown> = {
    updated_at: new Date().toISOString(),
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
    routeDescription: "route_description",
    routeImageUrl: "route_image_url",
    organizer: "organizer",
    description: "description",
    status: "status",
  };

  for (const [camel, snake] of Object.entries(fieldMap)) {
    if (body[camel] !== undefined) {
      updateData[snake] = body[camel];
    }
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
