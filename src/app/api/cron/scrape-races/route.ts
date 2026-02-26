import { NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { scrapeEquilibrio } from "@/lib/scrapers/equilibrio";
import { slugify } from "@/lib/utils";
import { notifyNewRace } from "@/lib/notifications";
import { timingSafeEqual } from "crypto";
import { todayInBrazil } from "@/lib/date";

export const maxDuration = 60;

function isValidDate(dateStr: string): boolean {
    return /^\d{4}-\d{2}-\d{2}$/.test(dateStr) && !isNaN(Date.parse(dateStr));
}

function safeCompare(a: string, b: string): boolean {
    if (a.length !== b.length) return false;
    return timingSafeEqual(Buffer.from(a), Buffer.from(b));
}

export async function GET(request: Request) {
    const authHeader = request.headers.get("authorization") || "";
    const expected = `Bearer ${process.env.CRON_SECRET}`;
    if (!safeCompare(authHeader, expected)) {
        return NextResponse.json({ error: "Não autorizado" }, { status: 401 });
    }

    const supabase = createAdminClient();
    let scraped;
    try {
        scraped = await scrapeEquilibrio();
    } catch (error) {
        console.error("[scrape-races] Falha no scraping:", error);
        return NextResponse.json({ error: "Falha no scraping" }, { status: 500 });
    }

    if (scraped.length === 0) {
        console.warn("[scrape-races] Scraper retornou 0 corridas — possível indisponibilidade do site");
        return NextResponse.json({ scraped: 0, inserted: 0, skipped: 0 });
    }

    const { data: adminProfile } = await supabase.from("profiles").select("id").eq("role", "admin").limit(1).single();
    if (!adminProfile) return NextResponse.json({ error: "Nenhum perfil admin encontrado" }, { status: 500 });

    // Pre-fetch existing slugs to avoid N+1 queries
    const allSlugs = scraped.map((r) => slugify(`${r.name}-${r.city || ""}`));
    const allWPSlugs = scraped.map((r) => r.slug);
    const uniqueSlugs = [...new Set([...allSlugs, ...allWPSlugs])];

    const { data: existingRaces } = await supabase
        .from("races")
        .select("slug")
        .in("slug", uniqueSlugs);
    const existingSlugsSet = new Set((existingRaces || []).map((r) => r.slug));

    // Pre-fetch cities
    const cityNames = [...new Set(scraped.map((r) => r.city).filter(Boolean))] as string[];
    const { data: cities } = await supabase
        .from("cities")
        .select("id, name, latitude, longitude")
        .in("name", cityNames);
    const cityMap = new Map(
        (cities || []).map((c) => [c.name.toLowerCase(), c])
    );

    const today = todayInBrazil();
    let inserted = 0;
    let skipped = 0;
    const errors: string[] = [];

    for (const race of scraped) {
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
            }
        }

        const raceData = {
            name: race.name, slug, date: race.date, start_time: race.startTime || "07:00",
            city: race.city || "Desconhecida", city_id: cityId, state: race.state || "SP",
            address: race.address || race.city || "A definir", latitude, longitude,
            distances: race.distances || ["5km"], registration_price: race.registrationPrice || "Consultar site",
            registration_link: race.registrationLink || race.link, registration_deadline: deadline || race.date,
            prize_type: race.prizeType, prize_details: race.prizeDetails, image_url: race.image_url || undefined,
            route_description: race.routeDescription || undefined, organizer: race.organizer, description: race.description || undefined,
            link: race.link, status: "confirmed" as const, rsvp_count: 0, is_promoted: false, origin: "admin" as const,
            created_by: adminProfile.id,
        };

        const { data: insertedRace, error: insertError } = await supabase.from("races").insert(raceData).select("id").single();
        if (insertError) {
            console.error(`[scrape-races] Insert failed for "${race.name}":`, insertError.message);
            errors.push(`${race.name}: falha ao inserir`);
            continue;
        }

        // Track newly inserted slug to avoid duplicates within same batch
        existingSlugsSet.add(slug);
        inserted++;
        notifyNewRace(insertedRace.id).catch((err) => console.error("[scrape-races] notifyNewRace failed:", err));
    }

    if (errors.length > 0) console.warn("[scrape-races] Error details:", errors.join(" | "));
    console.log(`[scrape-races] Done: scraped=${scraped.length} inserted=${inserted} skipped=${skipped} errors=${errors.length}`);
    return NextResponse.json({ scraped: scraped.length, inserted, skipped, errors: errors.length > 0 ? errors.length : undefined });
}
