import { createAdminClient } from "@/lib/supabase/admin";
import { slugify } from "@/lib/utils";
import { todayInBrazil } from "@/lib/date";
import type { ScrapedRace } from "./types";

function isValidDate(dateStr: string): boolean {
  return /^\d{4}-\d{2}-\d{2}$/.test(dateStr) && !isNaN(Date.parse(dateStr));
}

function normalizeForDedup(name: string): string {
  return name
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9\s]/g, "")
    .replace(/\s+/g, " ")
    .trim();
}

function jaccardSimilarity(a: string, b: string): number {
  const setA = new Set(a.split(" "));
  const setB = new Set(b.split(" "));
  let intersection = 0;
  for (const word of setA) {
    if (setB.has(word)) intersection++;
  }
  const union = new Set([...setA, ...setB]).size;
  return union === 0 ? 1 : intersection / union;
}

function isSimilarRace(
  a: { name: string; date: string | null; city: string | null },
  b: { name: string; date: string; city: string | null },
): boolean {
  if (a.date !== b.date) return false;
  const cityA = a.city ? normalizeForDedup(a.city) : "";
  const cityB = b.city ? normalizeForDedup(b.city) : "";
  if (cityA !== cityB) return false;
  return jaccardSimilarity(normalizeForDedup(a.name), normalizeForDedup(b.name)) >= 0.75;
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

  // Pre-fetch existing future races for fuzzy dedup against DB
  const today = todayInBrazil();
  const { data: existingFutureRaces } = await supabase
    .from("races")
    .select("name, date, city")
    .gte("date", today);
  const dbRaces: { name: string; date: string; city: string | null }[] =
    (existingFutureRaces || []).map((r) => ({
      name: r.name,
      date: r.date,
      city: r.city,
    }));

  // Track races seen in this batch for within-batch fuzzy dedup
  const seenRaces: { name: string; date: string; city: string | null }[] = [];

  let inserted = 0;
  let skipped = 0;
  const errors: string[] = [];

  for (const race of races) {
    // Filter: only São Paulo state. Races without state go through for admin review.
    if (race.state && race.state.toUpperCase() !== "SP") {
      skipped++;
      continue;
    }

    const slug = slugify(`${race.name}-${race.city || ""}`);

    // Slug-based duplicate check
    if (existingSlugsSet.has(slug) || existingSlugsSet.has(race.slug)) {
      skipped++;
      continue;
    }

    // Fuzzy duplicate check against DB
    const dbMatch = race.date
      ? dbRaces.find((db) => isSimilarRace(race, db))
      : undefined;
    if (dbMatch) {
      console.log(
        `[insert-races] Fuzzy duplicate (DB): "${race.name}" ~ "${dbMatch.name}" (date: ${dbMatch.date}, city: ${dbMatch.city || "N/A"})`,
      );
      skipped++;
      continue;
    }

    // Fuzzy duplicate check within batch
    const batchMatch = race.date
      ? seenRaces.find((seen) =>
          isSimilarRace(race, { name: seen.name, date: seen.date, city: seen.city }),
        )
      : undefined;
    if (batchMatch) {
      console.log(
        `[insert-races] Fuzzy duplicate (batch): "${race.name}" ~ "${batchMatch.name}" (date: ${batchMatch.date}, city: ${batchMatch.city || "N/A"})`,
      );
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
      state: race.state || "N/A",
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

    // Track newly inserted slug and race info for dedup within same batch
    existingSlugsSet.add(slug);
    if (race.date) {
      seenRaces.push({ name: race.name, date: race.date, city: race.city });
    }
    inserted++;
  }

  return { inserted, skipped, errors };
}
