import { NextResponse } from "next/server";
import { REGION_CITIES } from "@/lib/constants";
import { rateLimit } from "@/lib/rate-limit";
import { requireAuth } from "@/lib/auth";

export async function PATCH(request: Request) {
  const authResult = await requireAuth();
  if (authResult instanceof NextResponse) return authResult;
  const { user, supabase } = authResult;

  if (rateLimit(`profile:${user.id}`, { max: 5, windowMs: 60_000 }).limited) {
    return NextResponse.json(
      { error: "Muitas requisições. Aguarde um momento." },
      { status: 429 }
    );
  }

  const body = await request.json();
  const { fullName, city, notificationsEnabled } = body;

  const updateData: Record<string, unknown> = {};

  if (fullName !== undefined) {
    updateData.full_name = fullName;
  }

  if (city !== undefined) {
    updateData.city = city;
    const selectedCity = REGION_CITIES.find((c) => c.name === city);
    if (selectedCity) {
      updateData.state = selectedCity.state;
      updateData.latitude = selectedCity.lat;
      updateData.longitude = selectedCity.lng;
    }
  }

  if (notificationsEnabled !== undefined) {
    updateData.notifications_enabled = notificationsEnabled;
  }

  updateData.updated_at = new Date().toISOString();

  const { data, error } = await supabase
    .from("profiles")
    .update(updateData)
    .eq("id", user.id)
    .select()
    .single();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 400 });
  }

  return NextResponse.json(data);
}
