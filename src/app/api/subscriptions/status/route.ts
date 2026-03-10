// GET /api/subscriptions/status
// Returns the current user's active subscription, or null.

import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { getActiveSubscription } from "@/lib/subscriptions";

export async function GET() {
  const supabase = await createClient();
  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser();

  if (authError || !user) {
    return NextResponse.json({ error: "Não autorizado" }, { status: 401 });
  }

  const subscription = await getActiveSubscription(user.id);

  return NextResponse.json({ subscription });
}
