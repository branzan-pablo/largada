import { NextResponse } from "next/server";
import { SUGGESTION_DAILY_LIMIT } from "@/lib/constants";
import { notifyNewSuggestion } from "@/lib/notifications";
import { suggestionSchema } from "@/lib/validations";
import { requireAuth, requireAdmin } from "@/lib/auth";
import { z } from "zod/v4";

export async function POST(request: Request) {
  const authResult = await requireAuth();
  if (authResult instanceof NextResponse) return authResult;
  const { user, supabase } = authResult;

  // Rate limiting: max 5 suggestions per day
  const oneDayAgo = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString();
  const { count } = await supabase
    .from("race_suggestions")
    .select("id", { count: "exact", head: true })
    .eq("user_id", user.id)
    .gte("created_at", oneDayAgo);

  if (count && count >= SUGGESTION_DAILY_LIMIT) {
    return NextResponse.json(
      { error: "Limite de sugestões diárias atingido. Tente novamente amanhã." },
      { status: 429 }
    );
  }

  const raw = await request.json();
  const parsed = suggestionSchema.safeParse(raw);

  if (!parsed.success) {
    return NextResponse.json(
      { error: "Dados inválidos", details: parsed.error.issues },
      { status: 400 }
    );
  }

  const body = parsed.data;

  const { data, error } = await supabase
    .from("race_suggestions")
    .insert({
      user_id: user.id,
      name: body.name,
      date: body.date || null,
      city: body.city,
      state: body.state || null,
      link: body.link || null,
      notes: body.notes || null,
    })
    .select()
    .single();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 400 });
  }

  // Notify admins about new suggestion (await before response — Vercel kills runtime after)
  try {
    await notifyNewSuggestion(body.name, body.city);
  } catch (err) {
    console.error("[notifications] notifyNewSuggestion failed:", err);
  }

  return NextResponse.json(data, { status: 201 });
}

export async function PATCH(request: Request) {
  const authResult = await requireAdmin();
  if (authResult instanceof NextResponse) return authResult;
  const { user, supabase } = authResult;

  const body = await request.json();

  const patchSchema = z.object({
    id: z.string().min(1, "ID é obrigatório"),
    status: z.enum(["approved", "rejected"], { message: "Status deve ser 'approved' ou 'rejected'" }),
  });

  const parsed = patchSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: parsed.error.issues[0]?.message ?? "Dados inválidos" },
      { status: 400 }
    );
  }

  const { id, status } = parsed.data;

  const { data, error } = await supabase
    .from("race_suggestions")
    .update({
      status,
      reviewed_by: user.id,
      reviewed_at: new Date().toISOString(),
    })
    .eq("id", id)
    .select()
    .single();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 400 });
  }

  return NextResponse.json(data);
}

export async function DELETE(request: Request) {
  const authResult = await requireAuth();
  if (authResult instanceof NextResponse) return authResult;
  const { user, supabase } = authResult;

  const { searchParams } = new URL(request.url);
  const id = searchParams.get("id");

  if (!id) {
    return NextResponse.json({ error: "ID é obrigatório" }, { status: 400 });
  }

  // Only allow deleting own pending suggestions
  const { data: suggestion } = await supabase
    .from("race_suggestions")
    .select("user_id, status")
    .eq("id", id)
    .single();

  if (!suggestion) {
    return NextResponse.json({ error: "Sugestão não encontrada" }, { status: 404 });
  }

  if (suggestion.user_id !== user.id) {
    return NextResponse.json({ error: "Acesso negado" }, { status: 403 });
  }

  if (suggestion.status !== "pending") {
    return NextResponse.json(
      { error: "Apenas sugestões pendentes podem ser excluídas" },
      { status: 400 }
    );
  }

  const { error } = await supabase
    .from("race_suggestions")
    .delete()
    .eq("id", id);

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 400 });
  }

  return NextResponse.json({ success: true });
}
