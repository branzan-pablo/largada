import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export async function GET(request: Request, { params }: RouteContext<"/api/r/[slug]">) {
  const supabase = await createClient();
  const { data: race } = await supabase
    .from("races")
    .select("registration_link")
    .eq("slug", (await params).slug)
    .eq("status", "confirmed")
    .single();

  if (!race?.registration_link) {
    return NextResponse.redirect(new URL("/corridas", request.url));
  }

  try {
    return NextResponse.redirect(new URL(race.registration_link), 307);
  } catch {
    return NextResponse.redirect(new URL("/corridas", request.url));
  }
}
