import { NextResponse } from "next/server";
import { unstable_cache } from "next/cache";
import { createAdminClient } from "@/lib/supabase/admin";

const getDistances = unstable_cache(
  async () => {
    const supabase = createAdminClient();
    const { data, error } = await supabase
      .from("races")
      .select("distances")
      .eq("status", "confirmed");
    if (error) throw error;
    const all = (data ?? []).flatMap((r) => r.distances as string[]);
    return [...new Set(all)].sort((a, b) => parseFloat(a) - parseFloat(b));
  },
  ["race-distances"],
  { revalidate: 3600 }
);

export async function GET() {
  try {
    const unique = await getDistances();
    const response = NextResponse.json(unique);
    response.headers.set("Cache-Control", "public, s-maxage=3600, stale-while-revalidate=86400");
    return response;
  } catch (err) {
    return NextResponse.json({ error: String(err) }, { status: 500 });
  }
}
