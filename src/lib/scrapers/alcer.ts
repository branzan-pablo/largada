/**
 * Scraper – ALCER (alcer.esp.br)
 *
 * Busca corridas via sitemap XML → páginas de evento → JSON-LD structured data.
 * Padrão idêntico ao Rax Eventos.
 */

import { isSaoPaulo, type Scraper, type ScrapedRace } from "./types";
import { slugify } from "@/lib/utils";

const SITEMAP_URL = "https://www.alcer.esp.br/event-pages-sitemap.xml";
const FETCH_TIMEOUT_MS = 10_000;
const CONCURRENCY = 5;

function fetchWithTimeout(
  url: string,
  timeoutMs = FETCH_TIMEOUT_MS,
): Promise<Response> {
  return fetch(url, { signal: AbortSignal.timeout(timeoutMs) });
}

function extractEventURLsFromSitemap(xml: string): string[] {
  const urls: string[] = [];
  const seen = new Set<string>();
  const matches = xml.matchAll(/<loc>\s*(https?:\/\/[^<]+)\s*<\/loc>/gi);
  for (const m of matches) {
    let url = m[1].trim();
    // Remove /form suffix (registration page duplicate)
    url = url.replace(/\/form$/, "");
    if (url.includes("/events/") && !seen.has(url)) {
      seen.add(url);
      urls.push(url);
    }
  }
  return urls;
}

interface JsonLdEvent {
  "@type"?: string;
  name?: string;
  startDate?: string;
  endDate?: string;
  location?: {
    "@type"?: string;
    name?: string;
    address?:
      | string
      | {
          "@type"?: string;
          streetAddress?: string;
          addressLocality?: string;
          addressRegion?: string;
          addressCountry?: string;
        };
    url?: string;
  };
  image?: string | string[] | { "@type"?: string; url?: string };
  description?: string;
  organizer?: {
    name?: string;
  };
}

function extractJsonLd(html: string): JsonLdEvent | null {
  const scriptMatches = html.matchAll(
    /<script\s+type=["']application\/ld\+json["'][^>]*>([\s\S]*?)<\/script>/gi,
  );
  for (const m of scriptMatches) {
    try {
      const data = JSON.parse(m[1]);
      const items = Array.isArray(data) ? data : [data];
      for (const item of items) {
        if (
          item["@type"] === "Event" ||
          item["@type"] === "SportsEvent" ||
          item["@type"]?.includes?.("Event")
        ) {
          return item as JsonLdEvent;
        }
      }
    } catch {
      // Invalid JSON, skip
    }
  }
  return null;
}

function extractOgImage(html: string): string | null {
  const m = html.match(
    /<meta\s+(?:property|name)=["']og:image["']\s+content=["']([^"']+)["']/i,
  );
  if (m) return m[1];
  const m2 = html.match(
    /<meta\s+content=["']([^"']+)["']\s+(?:property|name)=["']og:image["']/i,
  );
  return m2 ? m2[1] : null;
}

function extractDistances(html: string): string[] | null {
  const matches = html.match(/(\d+(?:[.,]\d+)?)\s*km/gi);
  if (!matches) return null;
  const seen = new Set<string>();
  const result: string[] = [];
  for (const m of matches) {
    const numStr = m.replace(",", ".").match(/(\d+(?:\.\d+)?)/)?.[1];
    if (!numStr) continue;
    const num = parseFloat(numStr);
    if (num >= 3 && num <= 100 && !seen.has(numStr)) {
      seen.add(numStr);
      result.push(`${numStr}k`);
    }
  }
  return result.length > 0 ? result : null;
}

function parseStartDate(dateStr: string): {
  date: string;
  time: string | null;
} {
  const dateMatch = dateStr.match(/^(\d{4}-\d{2}-\d{2})/);
  const date = dateMatch ? dateMatch[1] : dateStr.slice(0, 10);
  const timeMatch = dateStr.match(/T(\d{2}:\d{2})/);
  const time = timeMatch ? timeMatch[1] : null;
  return { date, time };
}

function extractCity(location: JsonLdEvent["location"]): {
  city: string | null;
  state: string | null;
  address: string | null;
} {
  if (!location) return { city: null, state: null, address: null };

  if (typeof location.address === "string") {
    // Wix format: "R. Thomas Paes..., Parque Roselandia, Votuporanga - SP, 15501-213, Brasil"
    const m = location.address.match(/,\s*([^,]+?)\s*-\s*([A-Z]{2})\s*,/);
    if (m) {
      return {
        city: m[1].trim(),
        state: m[2],
        address: location.address,
      };
    }
    // Fallback: "City - ST"
    const m2 = location.address.match(/([^,–-]+)\s*[-–]\s*([A-Z]{2})\b/);
    return {
      city: m2 ? m2[1].trim() : null,
      state: m2 ? m2[2] : null,
      address: location.address,
    };
  }

  if (typeof location.address === "object") {
    const addr = location.address;
    const parts: string[] = [];
    if (addr.streetAddress) parts.push(addr.streetAddress);
    if (addr.addressLocality) parts.push(addr.addressLocality);
    if (addr.addressRegion) parts.push(addr.addressRegion);

    return {
      city: addr.addressLocality || null,
      state: addr.addressRegion || null,
      address: parts.length > 0 ? parts.join(", ") : location.name || null,
    };
  }

  return { city: null, state: null, address: location.name || null };
}

async function scrapeEventPage(url: string): Promise<ScrapedRace | null> {
  const res = await fetchWithTimeout(url);
  if (!res.ok) {
    console.warn(`[alcer] HTTP ${res.status} for ${url}`);
    return null;
  }

  const html = await res.text();
  const jsonLd = extractJsonLd(html);

  if (!jsonLd || !jsonLd.name) {
    console.warn(`[alcer] No JSON-LD Event found at ${url}`);
    return null;
  }

  const { date, time } = jsonLd.startDate
    ? parseStartDate(jsonLd.startDate)
    : { date: null as string | null, time: null };

  const { city, state, address } = extractCity(jsonLd.location);

  let ogImage: string | null = null;
  if (typeof jsonLd.image === "string") {
    ogImage = jsonLd.image;
  } else if (Array.isArray(jsonLd.image)) {
    ogImage = jsonLd.image[0];
  } else if (
    jsonLd.image &&
    typeof jsonLd.image === "object" &&
    "url" in jsonLd.image
  ) {
    ogImage = jsonLd.image.url || null;
  } else {
    ogImage = extractOgImage(html);
  }

  const distances = extractDistances(html);
  const slug = slugify(jsonLd.name);

  return {
    name: jsonLd.name,
    slug,
    date: date || null,
    startTime: time || null,
    city,
    state,
    address,
    distances,
    registrationPrice: null,
    registrationLink: url,
    registrationDeadline: null,
    prizeType: "none",
    prizeDetails: null,
    image_url: ogImage || null,
    routeDescription: null,
    organizer: "ALCER",
    description: jsonLd.description?.slice(0, 500) || null,
    link: url,
  };
}

async function scrapeAlcer(): Promise<ScrapedRace[]> {
  const sitemapRes = await fetchWithTimeout(SITEMAP_URL);
  if (!sitemapRes.ok) {
    throw new Error(`Sitemap fetch failed: ${sitemapRes.status}`);
  }
  const sitemapXml = await sitemapRes.text();
  const eventUrls = extractEventURLsFromSitemap(sitemapXml);

  if (eventUrls.length === 0) {
    console.warn("[alcer] No event URLs found in sitemap");
    return [];
  }

  console.log(`[alcer] Found ${eventUrls.length} event URLs in sitemap`);

  const races: ScrapedRace[] = [];
  for (let i = 0; i < eventUrls.length; i += CONCURRENCY) {
    const batch = eventUrls.slice(i, i + CONCURRENCY);
    const results = await Promise.allSettled(
      batch.map((url) => scrapeEventPage(url)),
    );
    for (const result of results) {
      if (result.status === "fulfilled" && result.value) {
        races.push(result.value);
      } else if (result.status === "rejected") {
        console.warn("[alcer] Event page failed:", result.reason);
      }
    }
  }

  return races.filter((r) => isSaoPaulo(r.state));
}

export const alcerScraper: Scraper = {
  name: "ALCER",
  scrape: scrapeAlcer,
};
