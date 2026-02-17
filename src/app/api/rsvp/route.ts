import { NextResponse } from "next/server";
import { rateLimit } from "@/lib/rate-limit";
import { requireAuth } from "@/lib/auth";

export async function POST(request: Request) {
  const authResult = await requireAuth();
  if (authResult instanceof NextResponse) return authResult;
  const { user, supabase } = authResult;

  if (rateLimit(`rsvp:${user.id}`, { max: 10, windowMs: 60_000 }).limited) {
    return NextResponse.json(
      { error: "Muitas requisições. Aguarde um momento." },
      { status: 429 }
    );
  }

  const { raceId } = await request.json();

  if (!raceId) {
    return NextResponse.json({ error: "raceId é obrigatório" }, { status: 400 });
  }

  // Check if RSVP already exists
  const { data: existing } = await supabase
    .from("rsvps")
    .select("id")
    .eq("user_id", user.id)
    .eq("race_id", raceId)
    .single();

  if (existing) {
    // Remove RSVP
    const { error } = await supabase
      .from("rsvps")
      .delete()
      .eq("id", existing.id);

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 400 });
    }

    return NextResponse.json({ rsvped: false });
  }

  // Create RSVP
  const { error } = await supabase
    .from("rsvps")
    .insert({ user_id: user.id, race_id: raceId });

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 400 });
  }

  return NextResponse.json({ rsvped: true });
}
