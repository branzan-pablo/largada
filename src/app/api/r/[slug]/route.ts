import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ slug: string }> }
) {
  const { slug } = await params;
  const supabase = await createClient();

  // Fetch race and active affiliate rules in parallel
  const [{ data: race }, { data: rules }] = await Promise.all([
    supabase
      .from("races")
      .select("id, registration_link")
      .eq("slug", slug)
      .single(),
    supabase
      .from("affiliate_rules")
      .select("domain, param_key, param_value")
      .eq("active", true),
  ]);

  if (!race) {
    return NextResponse.redirect(new URL("/corridas", request.url));
  }

  // Get current user (may be null for anonymous)
  const {
    data: { user },
  } = await supabase.auth.getUser();

  // Fire-and-forget click tracking
  supabase
    .from("link_clicks")
    .insert({ race_id: race.id, user_id: user?.id ?? null })
    .then();

  // Append affiliate param if a rule matches the registration link domain
  let targetUrl = race.registration_link;
  if (rules && rules.length > 0) {
    try {
      const url = new URL(targetUrl);
      const hostname = url.hostname.replace(/^www\./, "");
      const match = rules.find(
        (r) => hostname === r.domain || hostname.endsWith("." + r.domain)
      );
      if (match) {
        url.searchParams.set(match.param_key, match.param_value);
        targetUrl = url.toString();
      }
    } catch {
      // Invalid URL — redirect as-is
    }
  }

  return NextResponse.redirect(targetUrl, 307);
}
