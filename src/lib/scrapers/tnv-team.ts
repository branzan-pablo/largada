/**
 * Scraper – TNV Team Sports (tnvteam.com.br)
 *
 * Busca corridas futuras via API JSON paginada.
 */

import type { Scraper, ScrapedRace } from "./types";
import { slugify } from "@/lib/utils";

const API_BASE = "https://emporiodascarnesjales.com.br/api/eventos/future";
const FETCH_TIMEOUT_MS = 10_000;

function fetchWithTimeout(
  url: string,
  timeoutMs = FETCH_TIMEOUT_MS,
): Promise<Response> {
  return fetch(url, { signal: AbortSignal.timeout(timeoutMs) });
}

interface TNVEndereco {
  endereco: string;
  numero: string;
  bairro: string;
  cidade: string;
  uf: string;
  complemento: string;
}

interface TNVDistancia {
  distancia: number;
  unidade: string;
  descricao: string;
}

interface TNVLoteValorTag {
  valor: string;
  tag: { tipo: string };
}

interface TNVLote {
  dataInicio: string;
  dataFinal: string;
  valoresTags: TNVLoteValorTag[];
}

interface TNVEvento {
  titulo: string;
  slug: string;
  dataEvento: string;
  horaLargada: string;
  fimInscricao: string;
  urlBanner: string;
  urlImageDestaque: string;
  resumo: string;
  endereco: TNVEndereco[];
  distanciaEvento: TNVDistancia[];
  lotesEventos: TNVLote[];
  organizador?: { nomeFantasia?: string };
}

interface TNVResponse {
  eventos: TNVEvento[];
  total: number;
  currentPage: number;
  totalPages: number;
}

function extractDate(iso: string): string {
  return iso.slice(0, 10);
}

function buildAddress(addr: TNVEndereco): string {
  const parts: string[] = [];
  if (addr.endereco) {
    parts.push(
      addr.numero && addr.numero !== "S/N"
        ? `${addr.endereco}, ${addr.numero}`
        : addr.endereco,
    );
  }
  if (addr.bairro) parts.push(addr.bairro);
  if (addr.cidade) parts.push(`${addr.cidade}-${addr.uf}`);
  return parts.join(", ");
}

function extractDistances(distancias: TNVDistancia[]): string[] | null {
  const seen = new Set<string>();
  const result: string[] = [];

  for (const d of distancias) {
    let km: number;
    if (d.unidade === "Metros") {
      km = d.distancia / 1000;
    } else {
      km = d.distancia;
    }

    // Filter out absurd combined triathlon distances
    if (km > 300 || km < 0.5) continue;

    const key = km % 1 === 0 ? `${km}k` : `${km}k`;
    if (!seen.has(key)) {
      seen.add(key);
      result.push(key);
    }
  }

  return result.length > 0 ? result : null;
}

function extractRegistrationPrice(lotes: TNVLote[]): string | null {
  const now = new Date();

  // Find active lote (dataInicio <= now <= dataFinal)
  const activeLotes = lotes
    .filter((l) => new Date(l.dataFinal) >= now)
    .sort(
      (a, b) =>
        new Date(a.dataInicio).getTime() - new Date(b.dataInicio).getTime(),
    );

  // Use the first active lote, or fall back to the last lote
  const lote = activeLotes[0] ?? lotes[lotes.length - 1];
  if (!lote) return null;

  // Find "Padrão" tag value
  const padrao = lote.valoresTags.find((v) => v.tag.tipo === "Padrão");
  if (padrao) {
    const valor = parseFloat(padrao.valor);
    if (valor > 0) return `R$${padrao.valor}`;
  }

  // Fallback: find cheapest non-zero value
  const valores = lote.valoresTags
    .map((v) => parseFloat(v.valor))
    .filter((v) => v > 0);
  if (valores.length > 0) return `R$${Math.min(...valores)}`;

  return null;
}

function mapEventToRace(evento: TNVEvento): ScrapedRace {
  const addr = evento.endereco[0];
  const city = addr?.cidade || null;
  const state = addr?.uf || null;

  return {
    name: evento.titulo,
    slug: slugify(evento.titulo),
    date: extractDate(evento.dataEvento),
    startTime: evento.horaLargada || null,
    city,
    state,
    address: addr ? buildAddress(addr) : null,
    distances: extractDistances(evento.distanciaEvento),
    registrationPrice: extractRegistrationPrice(evento.lotesEventos),
    registrationLink: "https://www.tnvteam.com.br/calendario",
    registrationDeadline: evento.fimInscricao
      ? extractDate(evento.fimInscricao)
      : null,
    prizeType: "none",
    prizeDetails: null,
    image_url: evento.urlImageDestaque || evento.urlBanner || null,
    routeDescription: null,
    organizer: evento.organizador?.nomeFantasia || "TNV Team Sports",
    description: evento.resumo?.trim() || null,
    link: "https://www.tnvteam.com.br/calendario",
  };
}

async function scrapeTnvTeam(): Promise<ScrapedRace[]> {
  // Fetch first page to get total pages
  const firstRes = await fetchWithTimeout(`${API_BASE}?page=1&limit=100`);
  if (!firstRes.ok) {
    throw new Error(`TNV API error: ${firstRes.status}`);
  }

  const firstData: TNVResponse = await firstRes.json();
  const races: ScrapedRace[] = firstData.eventos.map(mapEventToRace);

  console.log(
    `[tnv-team] Page 1/${firstData.totalPages}: ${firstData.eventos.length} eventos`,
  );

  // Fetch remaining pages
  for (let page = 2; page <= firstData.totalPages; page++) {
    try {
      const res = await fetchWithTimeout(`${API_BASE}?page=${page}&limit=100`);
      if (!res.ok) {
        console.warn(`[tnv-team] HTTP ${res.status} for page ${page}`);
        continue;
      }
      const data: TNVResponse = await res.json();
      console.log(
        `[tnv-team] Page ${page}/${firstData.totalPages}: ${data.eventos.length} eventos`,
      );
      races.push(...data.eventos.map(mapEventToRace));
    } catch (err) {
      console.warn(
        `[tnv-team] Page ${page} failed:`,
        err instanceof Error ? err.message : err,
      );
    }
  }

  return races;
}

export const tnvTeamScraper: Scraper = {
  name: "TNV Team Sports",
  scrape: scrapeTnvTeam,
};
