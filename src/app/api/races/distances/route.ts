import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export async function GET() {
  const supabase = await createClient();

  const { data, error } = await supabase
    .from("races")
    .select("distances")
    .eq("status", "confirmed");

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  const all = (data ?? []).flatMap((r) => r.distances as string[]);
  const unique = [...new Set(all)].sort((a, b) => parseFloat(a) - parseFloat(b));

  return NextResponse.json(unique);
}
