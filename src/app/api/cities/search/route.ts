import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const q = searchParams.get("q")?.trim();
  const limit = Math.min(parseInt(searchParams.get("limit") ?? "10"), 20);

  if (!q || q.length < 2) {
    return NextResponse.json([]);
  }

  const supabase = await createClient();

  const { data, error } = await supabase.rpc("search_cities", {
    p_query: q,
    p_limit: limit,
  });

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 400 });
  }

  return NextResponse.json(data ?? []);
}
