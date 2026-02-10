import type { MetadataRoute } from "next";
import { createAdminClient } from "@/lib/supabase/admin";

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const baseUrl = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";

  const staticPages: MetadataRoute.Sitemap = [
    { url: baseUrl, changeFrequency: "weekly", priority: 1.0 },
    { url: `${baseUrl}/corridas`, changeFrequency: "daily", priority: 0.9 },
    { url: `${baseUrl}/login`, changeFrequency: "monthly", priority: 0.3 },
  ];

  // Dynamic race pages
  const supabase = createAdminClient();
  const { data: races } = await supabase
    .from("races")
    .select("slug, date")
    .order("date", { ascending: false });

  const racePages: MetadataRoute.Sitemap = (races ?? []).map((race) => ({
    url: `${baseUrl}/corrida/${race.slug}`,
    lastModified: race.date,
    changeFrequency: "weekly" as const,
    priority: 0.7,
  }));

  return [...staticPages, ...racePages];
}
