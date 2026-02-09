import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { REGION_CITIES } from "@/lib/constants";

export async function PATCH(request: Request) {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Não autorizado" }, { status: 401 });
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
