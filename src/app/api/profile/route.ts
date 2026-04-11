import { NextResponse } from "next/server";
import { REGION_CITIES } from "@/lib/constants";
import { rateLimit } from "@/lib/rate-limit";
import { requireAuth } from "@/lib/auth";
import { utcNow } from "@/lib/date";

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
  const {
    fullName,
    city,
    cityId,
    notificationsEnabled,
    notificationRadiusKm,
    onboardingCompleted,
  } = body;

  const updateData: Record<string, unknown> = {};

  if (fullName !== undefined) {
    updateData.full_name = fullName;
  }

  // New path: cityId (from cities table)
  if (cityId !== undefined) {
    const { data: cityRow } = await supabase
      .from("cities")
      .select("id, name, state_code, latitude, longitude")
      .eq("id", cityId)
      .single();

    if (!cityRow) {
      return NextResponse.json({ error: "Cidade inválida" }, { status: 400 });
    }

    updateData.city_id = cityRow.id;
    updateData.city = cityRow.name;
    updateData.state = cityRow.state_code;
    updateData.latitude = cityRow.latitude;
    updateData.longitude = cityRow.longitude;
  } else if (city !== undefined) {
    // Legacy path: city by name string (from REGION_CITIES)
    const selectedCity = REGION_CITIES.find((c) => c.name === city);
    if (!selectedCity) {
      return NextResponse.json({ error: "Cidade inválida" }, { status: 400 });
    }

    // Resolve city_id from cities table so notifications work
    const { data: cityRow } = await supabase
      .from("cities")
      .select("id")
      .ilike("name", city)
      .single();

    updateData.city_id = cityRow?.id ?? null;
    updateData.city = city;
    updateData.state = selectedCity.state;
    updateData.latitude = selectedCity.lat;
    updateData.longitude = selectedCity.lng;
  }

  if (notificationsEnabled !== undefined) {
    updateData.notifications_enabled = notificationsEnabled;
  }

  if (notificationRadiusKm !== undefined) {
    const radius = parseInt(notificationRadiusKm);
    if (!isNaN(radius) && radius >= 10 && radius <= 500) {
      updateData.notification_radius_km = radius;
    }
  }

  if (onboardingCompleted !== undefined) {
    updateData.onboarding_completed = onboardingCompleted;
  }

  updateData.updated_at = utcNow();

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
