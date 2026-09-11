import type { MetadataRoute } from "next";
import { createAdminClient } from "@/lib/supabase/admin";

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const baseUrl = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";

  const staticPages: MetadataRoute.Sitemap = [
    { url: baseUrl, changeFrequency: "weekly", priority: 1.0 },
    { url: `${baseUrl}/corridas`, changeFrequency: "daily", priority: 0.9 },
  ];

  // Preview builds may be created before Supabase credentials are configured.
  // Keep the static sitemap available instead of failing the whole deployment.
  if (
    !process.env.NEXT_PUBLIC_SUPABASE_URL ||
    !process.env.SUPABASE_SERVICE_ROLE_KEY
  ) {
    return staticPages;
  }

  // Dynamic race pages (limited to most recent 1000 for performance)
  const supabase = createAdminClient();
  const { data: races } = await supabase
    .from("races")
    .select("slug, date")
    .order("date", { ascending: false })
    .limit(1000);

  const racePages: MetadataRoute.Sitemap = (races ?? []).map((race) => ({
    url: `${baseUrl}/corrida/${race.slug}`,
    lastModified: race.date,
    changeFrequency: "weekly" as const,
    priority: 0.7,
  }));

  return [...staticPages, ...racePages];
}
