import { createAdminClient } from "@/lib/supabase/admin";
import { slugify } from "@/lib/utils";
import { todayInBrazil } from "@/lib/date";
import type { ScrapedRace } from "./types";

function isValidDate(dateStr: string): boolean {
  return /^\d{4}-\d{2}-\d{2}$/.test(dateStr) && !isNaN(Date.parse(dateStr));
}

export async function insertScrapedRaces(
  races: ScrapedRace[],
): Promise<{ inserted: number; skipped: number; errors: string[] }> {
  const supabase = createAdminClient();

  const { data: adminProfile } = await supabase
    .from("profiles")
    .select("id")
    .eq("role", "admin")
    .limit(1)
    .single();

  if (!adminProfile) {
    throw new Error("Nenhum perfil admin encontrado");
  }

  // Pre-fetch existing slugs to avoid N+1 queries
  const allSlugs = races.map((r) => slugify(`${r.name}-${r.city || ""}`));
  const allWPSlugs = races.map((r) => r.slug);
  const uniqueSlugs = [...new Set([...allSlugs, ...allWPSlugs])];

  const { data: existingRaces } = await supabase
    .from("races")
    .select("slug")
    .in("slug", uniqueSlugs);
  const existingSlugsSet = new Set((existingRaces || []).map((r) => r.slug));

  // Pre-fetch all cities (table is small; avoids case-sensitive .in() mismatches)
  const { data: cities } = await supabase
    .from("cities")
    .select("id, name, latitude, longitude");
  const cityMap = new Map((cities || []).map((c) => [c.name.toLowerCase(), c]));

  const today = todayInBrazil();
  let inserted = 0;
  let skipped = 0;
  const errors: string[] = [];

  for (const race of races) {
    const slug = slugify(`${race.name}-${race.city || ""}`);

    // Unified duplicate check
    if (existingSlugsSet.has(slug) || existingSlugsSet.has(race.slug)) {
      skipped++;
      continue;
    }

    // Validate date
    if (!race.date) {
      errors.push(`${race.name}: data não encontrada`);
      skipped++;
      continue;
    }
    if (!isValidDate(race.date)) {
      errors.push(`${race.name}: data inválida (${race.date})`);
      skipped++;
      continue;
    }
    if (race.date < today) {
      skipped++;
      continue;
    }

    // Validate deadline is not after race date
    let deadline = race.registrationDeadline;
    if (deadline && deadline > race.date) {
      deadline = race.date;
    }

    // City lookup from pre-fetched map
    let cityId: string | null = null;
    let latitude = 0;
    let longitude = 0;
    if (race.city) {
      const cityRow = cityMap.get(race.city.toLowerCase());
      if (cityRow) {
        cityId = cityRow.id;
        latitude = Number(cityRow.latitude);
        longitude = Number(cityRow.longitude);
      } else {
        console.warn(
          `[insert-races] City not found in DB: "${race.city}" — race "${race.name}" will have (0,0) coords`,
        );
      }
    }

    const raceData = {
      name: race.name,
      slug,
      date: race.date,
      start_time: race.startTime || "07:00",
      city: race.city || "Desconhecida",
      city_id: cityId,
      state: race.state || "SP",
      address: race.address || race.city || "A definir",
      latitude,
      longitude,
      distances: race.distances || ["5k"],
      registration_price: race.registrationPrice || "Consultar site",
      registration_link: race.registrationLink || race.link,
      registration_deadline: deadline || race.date,
      prize_type: race.prizeType,
      prize_details: race.prizeDetails,
      image_url: race.image_url || undefined,
      route_description: race.routeDescription || undefined,
      organizer: race.organizer,
      description: race.description || undefined,
      link: race.link,
      status: "pending_review" as const,
      rsvp_count: 0,
      is_promoted: false,
      origin: "scraper" as const,
      created_by: adminProfile.id,
    };

    const { error: insertError } = await supabase
      .from("races")
      .insert(raceData)
      .select("id")
      .single();
    if (insertError) {
      console.error(
        `[insert-races] Insert failed for "${race.name}":`,
        insertError.message,
      );
      errors.push(`${race.name}: falha ao inserir`);
      continue;
    }

    // Track newly inserted slug to avoid duplicates within same batch
    existingSlugsSet.add(slug);
    inserted++;
  }

  return { inserted, skipped, errors };
}
