import { NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { scrapeEquilibrio } from "@/lib/scrapers/equilibrio";
import { slugify } from "@/lib/utils";
import { notifyNewRace } from "@/lib/notifications";

export async function GET(request: Request) {
    const authHeader = request.headers.get("authorization");
    if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
        return NextResponse.json({ error: "Não autorizado" }, { status: 401 });
    }

    const supabase = createAdminClient();
    let scraped;
    try {
        scraped = await scrapeEquilibrio();
    } catch (error) {
        return NextResponse.json({ error: "Falha no scraping", details: String(error) }, { status: 500 });
    }

    const { data: adminProfile } = await supabase.from("profiles").select("id").eq("role", "admin").limit(1).single();
    if (!adminProfile) return NextResponse.json({ error: "Nenhum perfil admin encontrado" }, { status: 500 });

    let inserted = 0;
    let skipped = 0;
    const errors: string[] = [];

    for (const race of scraped) {
        const slug = slugify(`${race.name}-${race.city || ""}`);
        const { data: existing } = await supabase.from("races").select("slug").eq("slug", slug).single();
        if (existing) { skipped++; continue; }

        const { data: existingWP } = await supabase.from("races").select("slug").eq("slug", race.slug).single();
        if (existingWP) { skipped++; continue; }

        if (!race.date) { errors.push(`${race.name}: data não encontrada, pulada`); skipped++; continue; }

        let cityId: string | null = null;
        let latitude = 0;
        let longitude = 0;
        if (race.city) {
            const { data: cityRow } = await supabase.from("cities").select("id, latitude, longitude").ilike("name", race.city).limit(1).single();
            if (cityRow) { cityId = cityRow.id; latitude = Number(cityRow.latitude); longitude = Number(cityRow.longitude); }
        }

        const raceData = {
            name: race.name, slug, date: race.date, start_time: race.startTime || "07:00",
            city: race.city || "Desconhecida", city_id: cityId, state: race.state || "SP",
            address: race.address || race.city || "A definir", latitude, longitude,
            distances: race.distances || ["5km"], registration_price: race.registrationPrice || "Consultar site",
            registration_link: race.registrationLink, registration_deadline: race.registrationDeadline || race.date,
            prize_type: race.prizeType, prize_details: race.prizeDetails, image_url: race.image_url,
            route_description: race.routeDescription, organizer: race.organizer, description: race.description,
            link: race.link, status: "confirmed" as const, rsvp_count: 0, is_promoted: false, origin: "admin" as const,
            created_by: adminProfile.id,
        };

        const { data: insertedRace, error: insertError } = await supabase.from("races").insert(raceData).select("id").single();
        if (insertError) { errors.push(`${race.name}: ${insertError.message}`); continue; }

        inserted++;
        try { await notifyNewRace(insertedRace.id); } catch (err) { console.error("[scrape-races] notifyNewRace failed:", err); }
    }

    return NextResponse.json({ scraped: scraped.length, inserted, skipped, errors: errors.length > 0 ? errors : undefined });
}
