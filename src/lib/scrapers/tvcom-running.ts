/**
 * Scraper – TVCom Running (tvcomrunning.com.br)
 *
 * Busca corridas futuras via HTML da listagem + páginas de detalhe.
 */

import { isSaoPaulo, type Scraper, type ScrapedRace } from "./types";
import { slugify } from "@/lib/utils";

const BASE_URL = "https://tvcomrunning.com.br";
const FETCH_TIMEOUT_MS = 10_000;
const CONCURRENCY = 5;

const MESES: Record<string, string> = {
  janeiro: "01",
  fevereiro: "02",
  março: "03",
  marco: "03",
  abril: "04",
  maio: "05",
  junho: "06",
  julho: "07",
  agosto: "08",
  setembro: "09",
  outubro: "10",
  novembro: "11",
  dezembro: "12",
};

function fetchWithTimeout(
  url: string,
  timeoutMs = FETCH_TIMEOUT_MS,
): Promise<Response> {
  return fetch(url, { signal: AbortSignal.timeout(timeoutMs) });
}

function extractEventSlugs(html: string): string[] {
  const slugs = new Set<string>();
  // Match event links from the listing page cards
  const matches = html.matchAll(
    /href="https:\/\/tvcomrunning\.com\.br\/([^"]+)"[^>]*>\s*(?:<img|INSCREVA-SE)/gi,
  );
  for (const m of matches) {
    const slug = m[1].trim();
    // Skip non-event pages
    if (
      slug === "" ||
      slug === "eventos" ||
      slug === "resultados" ||
      slug === "contato" ||
      slug === "sobre-nos" ||
      slug === "login" ||
      slug === "perguntas-e-respostas" ||
      slug.startsWith("teste-")
    ) {
      continue;
    }
    slugs.add(slug);
  }
  return [...slugs];
}

function parsePortugueseDate(text: string): string | null {
  // "18 DE OUTUBRO DE 2026 ÀS 08:00" or "01 DE MARÇO DE 2026"
  const m = text.match(/(\d{1,2})\s+DE\s+([A-ZÀ-Úa-zà-ú]+)\s+DE\s+(\d{4})/i);
  if (!m) return null;
  const mes = MESES[m[2].toLowerCase()];
  if (!mes) return null;
  return `${m[3]}-${mes}-${m[1].padStart(2, "0")}`;
}

function extractStartTime(text: string): string | null {
  // "18 DE OUTUBRO DE 2026 ÀS 08:00"
  const m = text.match(/[ÀA]S\s+(\d{1,2}):(\d{2})/i);
  if (m) return `${m[1].padStart(2, "0")}:${m[2]}`;
  return null;
}

function titleCase(str: string): string {
  return str
    .toLowerCase()
    .replace(/(?:^|\s)\S/g, (c) => c.toUpperCase());
}

function extractCityState(html: string): {
  city: string | null;
  state: string | null;
} {
  // Detail page: <i class="fa-solid fa-location-dot"></i> CITY - UF
  const m = html.match(/fa-(?:location-dot|map-marker-alt)"><\/i>\s*([^<]+)/i);
  if (m) {
    const location = m[1].trim();
    const parts = location.match(/^(.+?)\s*[-–]\s*([A-Z]{2})$/);
    if (parts) {
      return { city: titleCase(parts[1].trim()), state: parts[2] };
    }
  }
  return { city: null, state: null };
}

function extractDistances(html: string): string[] | null {
  // From MODALIDADES section or og:description
  const modMatch = html.match(/<h4>MODALIDADES<\/h4>\s*<p>([^<]+)<\/p>/i);
  const text = modMatch
    ? modMatch[1]
    : (html.match(/og:description"\s+content="([^"]+)"/i)?.[1] ?? "");

  const matches = text.match(/(\d+(?:[.,]\d+)?)\s*KM/gi);
  if (!matches) return null;

  const seen = new Set<string>();
  const result: string[] = [];
  for (const m of matches) {
    const numStr = m.replace(",", ".").match(/(\d+(?:\.\d+)?)/)?.[1];
    if (!numStr) continue;
    const num = parseFloat(numStr);
    if (num >= 1 && num <= 100 && !seen.has(numStr)) {
      seen.add(numStr);
      result.push(`${numStr}k`);
    }
  }
  return result.length > 0 ? result : null;
}

function extractRegistrationPrice(html: string): string | null {
  // From the categories table: R$ 129,90
  const matches = html.matchAll(/<td>[^<]*R\$\s*([\d.,]+)/gi);
  const prices: number[] = [];
  for (const m of matches) {
    const val = parseFloat(m[1].replace(".", "").replace(",", "."));
    if (val > 0 && val < 1000) prices.push(val);
  }
  if (prices.length === 0) return null;
  const min = Math.min(...prices);
  // Format back to Brazilian style
  return `R$${min % 1 === 0 ? min : min.toFixed(2).replace(".", ",")}`;
}

function extractRegistrationDeadline(html: string): string | null {
  // "DE 24/10/2025 ATÉ 01/10/2026 ÀS 23:59"
  const m = html.match(/ATÉ\s+(\d{2})\/(\d{2})\/(\d{4})/i);
  if (m) return `${m[3]}-${m[2]}-${m[1]}`;
  return null;
}

function extractImageUrl(html: string): string | null {
  const og = html.match(/og:image"\s+content="([^"]+)"/i);
  if (og) return og[1];
  const img = html.match(
    /src="(https:\/\/tvcomrunning\.com\.br\/uploads\/eventos\/[^"]+)"/i,
  );
  return img ? img[1] : null;
}

function extractTitle(html: string): string | null {
  const og = html.match(/og:title"\s+content="([^"]+)"/i);
  if (og) return og[1].trim();
  const h2 = html.match(/<h2 class="display-10[^"]*">([^<]+)<\/h2>/i);
  return h2 ? h2[1].trim() : null;
}

async function scrapeEventPage(slug: string): Promise<ScrapedRace | null> {
  const url = `${BASE_URL}/${slug}`;
  const res = await fetchWithTimeout(url);
  if (!res.ok) {
    console.warn(`[tvcom-running] HTTP ${res.status} for ${url}`);
    return null;
  }

  const html = await res.text();
  const title = extractTitle(html);
  if (!title) {
    console.warn(`[tvcom-running] No title found at ${url}`);
    return null;
  }

  // Extract date+time from "DATA DO EVENTO" section
  // HTML: <h4>DATA DO EVENTO</h4><p><i class="fa-regular fa-clock"></i> 18 DE OUTUBRO DE 2026 ÀS 08:00</p>
  const dateSection = html.match(
    /DATA DO EVENTO<\/h4>\s*<p>(?:<[^>]*>)*\s*([^<]+)<\/p>/i,
  );
  const dateTimeText = dateSection ? dateSection[1].trim() : "";

  const { city, state } = extractCityState(html);

  return {
    name: title,
    slug: slugify(title),
    date: parsePortugueseDate(dateTimeText),
    startTime: extractStartTime(dateTimeText),
    city,
    state,
    address: null,
    distances: extractDistances(html),
    registrationPrice: extractRegistrationPrice(html),
    registrationLink: url,
    registrationDeadline: extractRegistrationDeadline(html),
    prizeType: "none",
    prizeDetails: null,
    image_url: extractImageUrl(html),
    routeDescription: null,
    organizer: "TVCom Running",
    description: null,
    link: url,
  };
}

async function scrapeTvcomRunning(): Promise<ScrapedRace[]> {
  const listingRes = await fetchWithTimeout(`${BASE_URL}/eventos`);
  if (!listingRes.ok) {
    throw new Error(`Listing page error: ${listingRes.status}`);
  }

  const listingHtml = await listingRes.text();
  const slugs = extractEventSlugs(listingHtml);

  if (slugs.length === 0) {
    console.warn("[tvcom-running] No event slugs found");
    return [];
  }

  console.log(`[tvcom-running] Found ${slugs.length} event URLs`);

  const races: ScrapedRace[] = [];
  for (let i = 0; i < slugs.length; i += CONCURRENCY) {
    const batch = slugs.slice(i, i + CONCURRENCY);
    const results = await Promise.allSettled(
      batch.map((slug) => scrapeEventPage(slug)),
    );
    for (const result of results) {
      if (result.status === "fulfilled" && result.value) {
        races.push(result.value);
      } else if (result.status === "rejected") {
        console.warn("[tvcom-running] Event page failed:", result.reason);
      }
    }
  }

  return races.filter((r) => isSaoPaulo(r.state));
}

export const tvcomRunningScraper: Scraper = {
  name: "TVCom Running",
  scrape: scrapeTvcomRunning,
};
