import { NextResponse } from "next/server";
import { timingSafeEqual } from "crypto";
import { equilibrioScraper } from "@/lib/scrapers/equilibrio";
import { insertScrapedRaces } from "@/lib/scrapers/insert-races";

export const maxDuration = 60;

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

  let races;
  try {
    races = await equilibrioScraper.scrape();
  } catch (error) {
    console.error("[scrape-equilibrio] Falha no scraping:", error);
    return NextResponse.json({ error: "Falha no scraping" }, { status: 500 });
  }

  console.log(`[scrape-equilibrio] Scraped ${races.length} corridas`);

  if (races.length === 0) {
    return NextResponse.json({ scraped: 0, inserted: 0, skipped: 0 });
  }

  try {
    const result = await insertScrapedRaces(races);
    if (result.errors.length > 0)
      console.warn("[scrape-equilibrio] Errors:", result.errors.join(" | "));
    console.log(
      `[scrape-equilibrio] Done: scraped=${races.length} inserted=${result.inserted} skipped=${result.skipped} errors=${result.errors.length}`,
    );
    return NextResponse.json({
      scraped: races.length,
      inserted: result.inserted,
      skipped: result.skipped,
      errors: result.errors.length > 0 ? result.errors.length : undefined,
    });
  } catch (error) {
    console.error("[scrape-equilibrio] Falha na inserção:", error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Falha na inserção" },
      { status: 500 },
    );
  }
}
