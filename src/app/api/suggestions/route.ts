import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { SUGGESTION_DAILY_LIMIT } from "@/lib/constants";

export async function POST(request: Request) {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Não autorizado" }, { status: 401 });
  }

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

  const body = await request.json();

  const { data, error } = await supabase
    .from("race_suggestions")
    .insert({
      user_id: user.id,
      name: body.name,
      date: body.date || null,
      city: body.city,
      link: body.link || null,
      notes: body.notes || null,
    })
    .select()
    .single();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 400 });
  }

  return NextResponse.json(data, { status: 201 });
}

export async function PATCH(request: Request) {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Não autorizado" }, { status: 401 });
  }

  // Check admin role
  const { data: profile } = await supabase
    .from("profiles")
    .select("role")
    .eq("id", user.id)
    .single();

  if (profile?.role !== "admin") {
    return NextResponse.json({ error: "Acesso negado" }, { status: 403 });
  }

  const body = await request.json();
  const { id, status } = body;

  if (!id || !status) {
    return NextResponse.json(
      { error: "ID e status são obrigatórios" },
      { status: 400 }
    );
  }

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
