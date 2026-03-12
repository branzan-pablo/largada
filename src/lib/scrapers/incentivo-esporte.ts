/**
 * Scraper – Incentivo Esporte (incentivoesporte.com.br)
 *
 * Busca corridas futuras via API JSON (calendário).
 * Endpoint de listagem retorna todos os eventos de uma só vez.
 * Detalhes (distâncias, preços, endereço) vêm de endpoint individual.
 */

import { isSaoPaulo, type Scraper, type ScrapedRace } from "./types";
import { slugify } from "@/lib/utils";

const API_BASE = "https://incentivoesporte.com.br/api/src/Site";
const SITE_BASE = "https://incentivoesporte.com.br";
const S3_ENDPOINT = "https://incentivoesporte.com.br/api/src/Admin/AwsS3GetObject.php";
const FETCH_TIMEOUT_MS = 10_000;
const CONCURRENCY = 5;

function fetchWithTimeout(
  url: string,
  timeoutMs = FETCH_TIMEOUT_MS,
): Promise<Response> {
  return fetch(url, { signal: AbortSignal.timeout(timeoutMs) });
}

// -- Types for listing API --------------------------------------------------

interface IEListEvent {
  eve_id: number;
  eve_nome: string;
  eve_data_evento: string;
  eve_hora_largada: string | null;
  eve_status: string;
  eve_end_uf: string | null;
  eve_end_nome_local: string | null;
  eve_end_cidade: number | null;
  eve_token: string;
  eve_img_destaque: string | null;
  eve_data_insc_fim: string | null;
  cid_descricao: string | null;
  cid_uf: string | null;
  org_fantasia: string | null;
  org_razao_social: string | null;
  mod_descricao: string | null;
}

interface IEListResponse {
  destaques: IEListEvent[];
  perto: unknown;
  proximos: IEListEvent[];
  calendario: IEListEvent[];
}

// -- Types for detail API ---------------------------------------------------

interface IEDistancia {
  edt_descricao: string;
  edt_distancia: string;
  insc_minima: (string | null)[];
  insc_maxima: (string | number | null)[];
}

interface IEDetailEvent {
  eve_id: number;
  eve_nome: string;
  eve_data_evento: string;
  eve_hora_largada: string | null;
  eve_end_uf: string | null;
  eve_end_nome_local: string | null;
  eve_end_endereco: string | null;
  eve_end_num: string | null;
  eve_end_latitude: string | null;
  eve_end_longitude: string | null;
  eve_token: string;
  eve_img_destaque: string | null;
  eve_data_insc_fim: string | null;
  eve_resumo: string | null;
  eve_lote1_de: string | null;
  eve_lote1_ate: string | null;
  eve_lote2_de: string | null;
  eve_lote2_ate: string | null;
  eve_lote3_de: string | null;
  eve_lote3_ate: string | null;
  eve_lote4_de: string | null;
  eve_lote4_ate: string | null;
  eve_lote5_de: string | null;
  eve_lote5_ate: string | null;
  cid_descricao: string | null;
  organizador?: {
    org_fantasia: string | null;
    org_razao_social: string | null;
  };
  distancias?: IEDistancia[];
}

// -- Helpers ----------------------------------------------------------------

function extractTime(time: string | null): string | null {
  if (!time) return null;
  // "08:00:00" → "08:00"
  const match = time.match(/^(\d{2}):(\d{2})/);
  return match ? `${match[1]}:${match[2]}` : null;
}

function extractDistances(distancias: IEDistancia[] | undefined): string[] | null {
  if (!distancias || distancias.length === 0) return null;

  const seen = new Set<string>();
  const result: string[] = [];

  for (const d of distancias) {
    // edt_distancia is like "5.00", "10.00", "21.00"
    const km = parseFloat(d.edt_distancia);
    if (isNaN(km) || km < 1 || km > 300) continue;

    const label = km % 1 === 0 ? `${km}k` : `${km}k`;
    if (!seen.has(label)) {
      seen.add(label);
      result.push(label);
    }
  }

  return result.length > 0 ? result : null;
}

function extractRegistrationPrice(
  detail: IEDetailEvent,
): string | null {
  if (!detail.distancias || detail.distancias.length === 0) return null;

  // Determine active lote index (0-4) based on current date
  const now = new Date().toISOString().slice(0, 10);
  const lotes = [
    { de: detail.eve_lote1_de, ate: detail.eve_lote1_ate },
    { de: detail.eve_lote2_de, ate: detail.eve_lote2_ate },
    { de: detail.eve_lote3_de, ate: detail.eve_lote3_ate },
    { de: detail.eve_lote4_de, ate: detail.eve_lote4_ate },
    { de: detail.eve_lote5_de, ate: detail.eve_lote5_ate },
  ];

  let activeLoteIdx = -1;
  for (let i = 0; i < lotes.length; i++) {
    const l = lotes[i];
    if (l.de && l.ate && now >= l.de && now <= l.ate) {
      activeLoteIdx = i;
      break;
    }
  }

  // Fallback: find the next future lote
  if (activeLoteIdx === -1) {
    for (let i = 0; i < lotes.length; i++) {
      if (lotes[i].de && lotes[i].de! > now) {
        activeLoteIdx = i;
        break;
      }
    }
  }

  // Last resort: use the last available lote
  if (activeLoteIdx === -1) {
    for (let i = lotes.length - 1; i >= 0; i--) {
      if (lotes[i].de) {
        activeLoteIdx = i;
        break;
      }
    }
  }

  if (activeLoteIdx === -1) return null;

  // Find cheapest minimum price across all distances for this lote
  let cheapest = Infinity;
  for (const d of detail.distancias) {
    const raw = d.insc_minima[activeLoteIdx];
    if (raw == null) continue;
    const val = parseFloat(String(raw));
    if (!isNaN(val) && val > 0 && val < cheapest) {
      cheapest = val;
    }
  }

  if (!isFinite(cheapest)) return null;
  return `R$${cheapest % 1 === 0 ? cheapest : cheapest.toFixed(2).replace(".", ",")}`;
}

function buildAddress(detail: IEDetailEvent): string | null {
  const parts: string[] = [];
  if (detail.eve_end_nome_local) parts.push(detail.eve_end_nome_local);
  if (detail.eve_end_endereco) {
    const num = detail.eve_end_num && detail.eve_end_num !== "S/N"
      ? `, ${detail.eve_end_num}`
      : "";
    parts.push(`${detail.eve_end_endereco}${num}`);
  }
  return parts.length > 0 ? parts.join(" - ") : null;
}

async function fetchEventDetail(token: string): Promise<IEDetailEvent | null> {
  try {
    const res = await fetchWithTimeout(
      `${API_BASE}/EventoDetalhe.php?eventoToken=${encodeURIComponent(token)}`,
    );
    if (!res.ok) {
      console.warn(`[incentivo-esporte] HTTP ${res.status} for event ${token}`);
      return null;
    }
    return await res.json();
  } catch (err) {
    console.warn(
      `[incentivo-esporte] Detail fetch failed for ${token}:`,
      err instanceof Error ? err.message : err,
    );
    return null;
  }
}

async function fetchImageUrl(filePath: string): Promise<string | null> {
  try {
    const res = await fetchWithTimeout(
      `${S3_ENDPOINT}?file=${encodeURIComponent(filePath)}`,
    );
    if (!res.ok) return null;
    const data = await res.json();
    return data?.url || null;
  } catch {
    return null;
  }
}

function mapToRace(
  event: IEListEvent,
  detail: IEDetailEvent | null,
  imageUrl: string | null,
): ScrapedRace {
  const organizer =
    detail?.organizador?.org_fantasia ||
    detail?.organizador?.org_razao_social ||
    event.org_fantasia ||
    event.org_razao_social ||
    "Incentivo Esporte";

  return {
    name: event.eve_nome,
    slug: slugify(event.eve_nome),
    date: event.eve_data_evento,
    startTime: extractTime(event.eve_hora_largada),
    city: (detail?.cid_descricao || event.cid_descricao)?.trim() || null,
    state: event.eve_end_uf?.trim() || null,
    address: detail ? buildAddress(detail) : event.eve_end_nome_local?.trim() || null,
    distances: detail ? extractDistances(detail.distancias) : null,
    registrationPrice: detail ? extractRegistrationPrice(detail) : null,
    registrationLink: `${SITE_BASE}/#/inscricao/${event.eve_token}`,
    registrationDeadline: event.eve_data_insc_fim || null,
    prizeType: "none",
    prizeDetails: null,
    image_url: imageUrl,
    routeDescription: null,
    organizer,
    description: detail?.eve_resumo?.trim() || null,
    link: `${SITE_BASE}/#/evento/${event.eve_token}`,
  };
}

// -- Main scrape function ---------------------------------------------------

async function scrapeIncentivoEsporte(): Promise<ScrapedRace[]> {
  const res = await fetchWithTimeout(`${API_BASE}/EventosCard.php`);
  if (!res.ok) {
    throw new Error(`Incentivo Esporte API error: ${res.status}`);
  }

  const data: IEListResponse = await res.json();

  // Merge all arrays, dedup by eve_id
  const all = [
    ...(data.destaques || []),
    ...(data.proximos || []),
    ...(data.calendario || []),
  ];
  const unique = new Map<number, IEListEvent>();
  for (const e of all) {
    if (!unique.has(e.eve_id)) unique.set(e.eve_id, e);
  }

  const events = [...unique.values()];
  const now = new Date().toISOString().slice(0, 10);

  // Filter: active, future, São Paulo
  const spEvents = events.filter((e) => {
    if (e.eve_status !== "A") return false;
    if (e.eve_data_evento < now) return false;
    return isSaoPaulo(e.eve_end_uf) || isSaoPaulo(e.cid_uf);
  });

  console.log(
    `[incentivo-esporte] ${spEvents.length} SP events out of ${events.length} total`,
  );

  if (spEvents.length === 0) return [];

  // Fetch details and images in batches
  const races: ScrapedRace[] = [];

  for (let i = 0; i < spEvents.length; i += CONCURRENCY) {
    const batch = spEvents.slice(i, i + CONCURRENCY);

    const detailResults = await Promise.allSettled(
      batch.map((e) => fetchEventDetail(e.eve_token)),
    );

    // Fetch images for events that have them
    const imageResults = await Promise.allSettled(
      batch.map((e) =>
        e.eve_img_destaque ? fetchImageUrl(e.eve_img_destaque) : Promise.resolve(null),
      ),
    );

    for (let j = 0; j < batch.length; j++) {
      const detailResult = detailResults[j];
      const detail =
        detailResult.status === "fulfilled" ? detailResult.value : null;
      const imageResult = imageResults[j];
      const imageUrl =
        imageResult.status === "fulfilled" ? imageResult.value : null;

      races.push(mapToRace(batch[j], detail, imageUrl));
    }
  }

  return races.filter((r) => isSaoPaulo(r.state));
}

export const incentivoEsporteScraper: Scraper = {
  name: "Incentivo Esporte",
  scrape: scrapeIncentivoEsporte,
};
