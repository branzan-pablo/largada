import { NextResponse } from "next/server";
import { requireAdmin } from "@/lib/auth";
import { createAdminClient } from "@/lib/supabase/admin";
import { notifyNewRace } from "@/lib/notifications";

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const authResult = await requireAdmin();
  if (authResult instanceof NextResponse) return authResult;

  const { id } = await params;
  const { action } = await request.json();

  if (action !== "approve" && action !== "reject") {
    return NextResponse.json(
      { error: "Ação inválida. Use 'approve' ou 'reject'." },
      { status: 400 }
    );
  }

  const supabase = createAdminClient();

  // Verify race exists and is pending_review
  const { data: race, error: fetchError } = await supabase
    .from("races")
    .select("id, status")
    .eq("id", id)
    .single();

  if (fetchError || !race) {
    return NextResponse.json({ error: "Corrida não encontrada" }, { status: 404 });
  }

  if (race.status !== "pending_review") {
    return NextResponse.json(
      { error: "Apenas corridas com status 'pending_review' podem ser revisadas" },
      { status: 400 }
    );
  }

  const newStatus = action === "approve" ? "confirmed" : "cancelled";

  const { error: updateError } = await supabase
    .from("races")
    .update({ status: newStatus })
    .eq("id", id);

  if (updateError) {
    return NextResponse.json({ error: updateError.message }, { status: 500 });
  }

  // Notify users when a race is approved
  if (action === "approve") {
    try {
      await notifyNewRace(id);
    } catch (err) {
      console.error("[review] notifyNewRace failed:", err);
    }
  }

  return NextResponse.json({ id, status: newStatus });
}
