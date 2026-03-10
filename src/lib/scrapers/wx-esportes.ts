/**
 * Scraper – WX Esportes (wxesportes.com.br)
 *
 * Busca corridas futuras via API JSON paginada.
 */

import { isSaoPaulo, type Scraper, type ScrapedRace } from "./types";
import { slugify } from "@/lib/utils";

const API_BASE = "https://api.wxesportes.com.br/events";
const SITE_BASE = "https://wxesportes.com.br/events";
const FETCH_TIMEOUT_MS = 10_000;

const STATE_ABBREV: Record<string, string> = {
  "acre": "AC",
  "alagoas": "AL",
  "amapá": "AP",
  "amazonas": "AM",
  "bahia": "BA",
  "ceará": "CE",
  "distrito federal": "DF",
  "espírito santo": "ES",
  "goiás": "GO",
  "maranhão": "MA",
  "mato grosso": "MT",
  "mato grosso do sul": "MS",
  "minas gerais": "MG",
  "pará": "PA",
  "paraíba": "PB",
  "paraná": "PR",
  "pernambuco": "PE",
  "piauí": "PI",
  "rio de janeiro": "RJ",
  "rio grande do norte": "RN",
  "rio grande do sul": "RS",
  "rondônia": "RO",
  "roraima": "RR",
  "santa catarina": "SC",
  "são paulo": "SP",
  "sergipe": "SE",
  "tocantins": "TO",
};

function fetchWithTimeout(
  url: string,
  timeoutMs = FETCH_TIMEOUT_MS,
): Promise<Response> {
  return fetch(url, { signal: AbortSignal.timeout(timeoutMs) });
}

interface WXPriceRange {
  beginsAt: string | null;
  amount: number;
  discountFlatAmount: number;
}

interface WXPrice {
  ranges: WXPriceRange[];
  activeRange?: WXPriceRange;
}

interface WXFieldOption {
  name: string;
  ageLimitMin?: number;
  ageLimitMax?: number;
  maxRegistrations?: number;
}

interface WXField {
  name: string;
  type: string;
  options: WXFieldOption[];
}

interface WXEvent {
  id: string;
  status: string;
  registrationStatus: string;
  name: string;
  description: string | null;
  location: string | null;
  city: string | null;
  state: string | null;
  runsAt: string | null;
  registrationBeginsAt: string | null;
  registrationEndsAt: string | null;
  sponsorName: string | null;
  coverResourceUrl: string | null;
  price?: WXPrice;
  fields?: WXField[];
}

interface WXListEvent {
  id: string;
  status: string;
  registrationStatus: string;
  name: string;
  description: string | null;
  location: string | null;
  city: string | null;
  state: string | null;
  runsAt: string | null;
  registrationEndsAt: string | null;
  sponsorName: string | null;
  coverResourceUrl: string | null;
}

interface WXPageResponse {
  content: WXListEvent[];
  size: number;
  number: number;
  last: boolean;
  totalItems: number;
  totalPages: number;
}

function stateToAbbrev(state: string | null): string | null {
  if (!state) return null;
  // Already abbreviated
  if (/^[A-Z]{2}$/.test(state)) return state;
  return STATE_ABBREV[state.toLowerCase().trim()] ?? null;
}

function extractDate(iso: string | null): string | null {
  if (!iso) return null;
  return iso.slice(0, 10);
}

function extractTime(iso: string | null): string | null {
  if (!iso) return null;
  const match = iso.match(/T(\d{2}):(\d{2})/);
  if (!match) return null;
  return `${match[1]}:${match[2]}`;
}

function extractDistances(fields: WXField[] | undefined): string[] | null {
  if (!fields) return null;

  // Look for "Modalidade" field with options like "Corrida 5K", "Caminhada 10K"
  const modalidade = fields.find(
    (f) => f.name.toLowerCase() === "modalidade" && f.type === "OPTION",
  );
  if (!modalidade) return null;

  const seen = new Set<string>();
  const result: string[] = [];

  for (const opt of modalidade.options) {
    const match = opt.name.match(/(\d+(?:[.,]\d+)?)\s*(?:km|k)/i);
    if (match) {
      const num = match[1].replace(",", ".");
      const km = parseFloat(num);
      if (km >= 1 && km <= 100 && !seen.has(num)) {
        seen.add(num);
        result.push(`${num}k`);
      }
    }
  }

  return result.length > 0 ? result : null;
}

function extractRegistrationPrice(price: WXPrice | undefined): string | null {
  if (!price?.ranges || price.ranges.length === 0) return null;

  // Use activeRange if available, otherwise find the cheapest effective price
  if (price.activeRange) {
    const effective =
      price.activeRange.amount - (price.activeRange.discountFlatAmount || 0);
    if (effective > 0) {
      return `R$${effective % 1 === 0 ? effective : effective.toFixed(2).replace(".", ",")}`;
    }
  }

  // Fallback: find lowest effective price across all ranges
  const prices = price.ranges
    .map((r) => r.amount - (r.discountFlatAmount || 0))
    .filter((v) => v > 0);

  if (prices.length === 0) return null;
  const min = Math.min(...prices);
  return `R$${min % 1 === 0 ? min : min.toFixed(2).replace(".", ",")}`;
}

function mapEventToRace(
  event: WXListEvent | WXEvent,
  detail?: WXEvent,
): ScrapedRace {
  const src = detail ?? event;
  const stateAbbrev = stateToAbbrev(src.state);
  const eventUrl = `${SITE_BASE}/${event.id}`;

  return {
    name: src.name,
    slug: slugify(src.name),
    date: extractDate(src.runsAt),
    startTime: extractTime(src.runsAt),
    city: src.city?.trim() || null,
    state: stateAbbrev,
    address: src.location?.trim() || null,
    distances:
      "fields" in src ? extractDistances((src as WXEvent).fields) : null,
    registrationPrice:
      "price" in src
        ? extractRegistrationPrice((src as WXEvent).price)
        : null,
    registrationLink: eventUrl,
    registrationDeadline: extractDate(src.registrationEndsAt),
    prizeType: "none",
    prizeDetails: null,
    image_url: src.coverResourceUrl || null,
    routeDescription: null,
    organizer: src.sponsorName?.trim() || "WX Esportes",
    description: src.description?.trim() || null,
    link: eventUrl,
  };
}

async function fetchEventDetail(id: string): Promise<WXEvent | null> {
  try {
    const res = await fetchWithTimeout(`${API_BASE}/${id}`);
    if (!res.ok) {
      console.warn(`[wx-esportes] HTTP ${res.status} for event ${id}`);
      return null;
    }
    return await res.json();
  } catch (err) {
    console.warn(
      `[wx-esportes] Detail fetch failed for ${id}:`,
      err instanceof Error ? err.message : err,
    );
    return null;
  }
}

async function scrapeWxEsportes(): Promise<ScrapedRace[]> {
  const now = new Date();
  const allEvents: WXListEvent[] = [];

  // Fetch all pages from listing API
  let page = 0;
  let totalPages = 1;

  while (page < totalPages) {
    const res = await fetchWithTimeout(`${API_BASE}?page=${page}`);
    if (!res.ok) {
      throw new Error(`WX Esportes API error: ${res.status}`);
    }

    const data: WXPageResponse = await res.json();
    // The API returns events as an array directly or in a content field
    const events = Array.isArray(data) ? data : (data.content ?? data);
    if (Array.isArray(events)) {
      allEvents.push(...events);
    }

    totalPages = data.totalPages ?? 1;
    console.log(
      `[wx-esportes] Page ${page + 1}/${totalPages}: ${Array.isArray(events) ? events.length : 0} eventos`,
    );

    if (data.last) break;
    page++;
  }

  // Filter: only PUBLISHED events with future dates in São Paulo
  const futureEvents = allEvents.filter((e) => {
    if (e.status !== "PUBLISHED") return false;
    if (!e.runsAt) return false;
    if (e.state?.toLowerCase() !== "são paulo") return false;
    return new Date(e.runsAt) >= now;
  });

  console.log(
    `[wx-esportes] ${futureEvents.length} future events out of ${allEvents.length} total`,
  );

  if (futureEvents.length === 0) return [];

  // Fetch detail pages for prices and distances (concurrency: 5)
  const races: ScrapedRace[] = [];
  const CONCURRENCY = 5;

  for (let i = 0; i < futureEvents.length; i += CONCURRENCY) {
    const batch = futureEvents.slice(i, i + CONCURRENCY);
    const details = await Promise.allSettled(
      batch.map((e) => fetchEventDetail(e.id)),
    );

    for (let j = 0; j < batch.length; j++) {
      const result = details[j];
      const detail =
        result.status === "fulfilled" ? result.value : null;
      races.push(mapEventToRace(batch[j], detail ?? undefined));
    }
  }

  return races.filter((r) => isSaoPaulo(r.state));
}

export const wxEsportesScraper: Scraper = {
  name: "WX Esportes",
  scrape: scrapeWxEsportes,
};
