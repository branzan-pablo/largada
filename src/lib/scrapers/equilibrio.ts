/**
 * Scraper – Equilíbrio Esportes (equilibrio.esp.br)
 *
 * Busca corridas futuras via WordPress REST API + scraping HTML
 * das páginas de detalhe para extrair informações completas.
 */

import type { Scraper, ScrapedRace } from "./types";

const BASE_URL = "https://equilibrio.esp.br";
const FETCH_TIMEOUT_MS = 8_000;
const CONCURRENCY = 5;

interface WPCorridaProxima {
  id: number;
  slug: string;
  title: { rendered: string };
  link: string;
}

interface WPProduct {
  slug: string;
  uagb_featured_image_src?: {
    full?: [string, number, number, boolean];
  };
}

function fetchWithTimeout(
  url: string,
  timeoutMs = FETCH_TIMEOUT_MS,
): Promise<Response> {
  return fetch(url, { signal: AbortSignal.timeout(timeoutMs) });
}

function stripHTML(html: string): string {
  if (!html) return "";
  return html
    .replace(/<br\s*\/?>/gi, "\n")
    .replace(/<\/p>/gi, "\n")
    .replace(/<[^>]+>/g, "")
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&quot;/g, '"')
    .replace(/&#039;/g, "'")
    .replace(/&#8211;/g, "–")
    .replace(/&#8217;/g, "'")
    .replace(/&nbsp;/g, " ")
    .replace(/\n{3,}/g, "\n\n")
    .trim();
}

function extractCidadeEstado(titulo: string): {
  cidade: string | null;
  estado: string | null;
} {
  const normalizado = titulo.replace(/\s*\d{4}\s*$/, "").trim();
  const segmentos = normalizado.split(/\s*[–|]\s*/);
  for (let i = segmentos.length - 1; i >= 0; i--) {
    const seg = segmentos[i].trim();
    const m = seg.match(/^(.+?)\s*[-–]\s*([A-Z]{2})$/);
    if (m) {
      let cidade = m[1].trim();
      const estado = m[2].trim();
      // If city name is suspiciously long, extract from "DE X" suffix
      if (cidade.split(/\s+/).length > 4) {
        const deMatch = cidade.match(/\bde\s+(.+)$/i);
        if (deMatch) cidade = deMatch[1].trim();
      }
      return { cidade, estado };
    }
  }
  const fallback = normalizado.match(/\bde\s+(.+?)\s*[-–]\s*([A-Z]{2})\b/i);
  if (fallback)
    return { cidade: fallback[1].trim(), estado: fallback[2].trim() };
  return { cidade: null, estado: null };
}

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

function extractDataEvento(texto: string): string | null {
  // \w+ doesn't match accented chars (e.g. "março"), so use explicit char class
  const MES_RE = "[a-záéíóúâêôãõç]+";
  const m1 = texto.match(
    new RegExp(
      `(?:dia|n[oa]?\\s+dia)\\s+(\\d{1,2})\\s+de\\s+(${MES_RE})\\s+de\\s+(\\d{4})`,
      "i",
    ),
  );
  if (m1) {
    const mes = MESES[m1[2].toLowerCase()];
    if (mes) return `${m1[3]}-${mes}-${m1[1].padStart(2, "0")}`;
  }
  const m2 = texto.match(
    new RegExp(
      `realizado\\s+(?:no\\s+)?dia\\s+(\\d{1,2})\\s+de\\s+(${MES_RE})\\s+de\\s+(\\d{4})`,
      "i",
    ),
  );
  if (m2) {
    const mes = MESES[m2[2].toLowerCase()];
    if (mes) return `${m2[3]}-${mes}-${m2[1].padStart(2, "0")}`;
  }
  const m3 = texto.match(/(\d{2})\/(\d{2})\/(\d{4})/);
  if (m3) return `${m3[3]}-${m3[2]}-${m3[1]}`;
  // Pattern 4: "dia X de MÊS" without explicit year — infer from text context
  const m4 = texto.match(new RegExp(`\\bdia\\s+(\\d{1,2})\\s+de\\s+(${MES_RE})`, "i"));
  if (m4) {
    const mes = MESES[m4[2].toLowerCase()];
    if (mes) {
      const yearMatch = texto.match(/\b(20\d{2})\b/);
      const year = yearMatch
        ? yearMatch[1]
        : new Date().getFullYear().toString();
      return `${year}-${mes}-${m4[1].padStart(2, "0")}`;
    }
  }
  // Pattern 5: "X de MÊS de ANO" without any prefix (e.g. "26 de março de 2026")
  const m5 = texto.match(
    new RegExp(`\\b(\\d{1,2})\\s+de\\s+(${MES_RE})\\s+de\\s+(20\\d{2})\\b`, "i"),
  );
  if (m5) {
    const mes = MESES[m5[2].toLowerCase()];
    if (mes) return `${m5[3]}-${mes}-${m5[1].padStart(2, "0")}`;
  }
  return null;
}

function extractHorarioLargada(texto: string): string | null {
  const m = texto.match(
    /largada\b[^.]{0,40}?prevista\s+para\s+[àa]s?\s+(\d{1,2})[h:](\d{2})?/i,
  );
  if (m) return `${m[1].padStart(2, "0")}:${m[2] || "00"}`;
  const m2 = texto.match(/largada\s+[àa]s?\s+(\d{1,2})[h:](\d{2})?/i);
  if (m2) return `${m2[1].padStart(2, "0")}:${m2[2] || "00"}`;
  return null;
}

function extractDistancias(texto: string): string[] | null {
  const matches = texto.match(/(\d+(?:[.,]\d+)?)\s*km/gi);
  if (!matches) return null;
  const seen = new Set<string>();
  const result: string[] = [];
  for (const m of matches) {
    const numStr = m.replace(",", ".").match(/(\d+(?:\.\d+)?)/)?.[1];
    if (!numStr) continue;
    const num = parseFloat(numStr);
    if (num >= 3 && num <= 42.2 && !seen.has(numStr)) {
      seen.add(numStr);
      result.push(`${numStr}k`);
    }
  }
  return result.length > 0 ? result : null;
}

function extractValorInscricao(texto: string): string | null {
  const lotes: string[] = [];
  const loteMatches = [
    ...texto.matchAll(
      /(\d)[ºo°]\s*lote[^:]*?:\s*(?:.*?)R\$\s*(\d+(?:[.,]\d{2})?)/gi,
    ),
  ];
  if (loteMatches.length > 0) {
    for (const m of loteMatches) {
      lotes.push(`${m[1]}º Lote: R$${m[2].replace(",", ".")}`);
    }
    return lotes.join(" | ");
  }
  // Fallback: find the cheapest R$ value in the inscription section
  const secaoInscricao = texto.match(
    /(?:inscri[çc][oõ]es|1[ºo]\s*lote|valor)[\s\S]*?(?:2[ºo]\s*lote|retirada|kit)/i,
  );
  const textoAlvo = secaoInscricao ? secaoInscricao[0] : texto;
  const matches = textoAlvo.match(/R\$\s*(\d+(?:[.,]\d{2})?)/g);
  if (matches) {
    const valores = matches
      .map((m) => parseFloat(m.replace("R$", "").trim().replace(",", ".")))
      .filter((v) => v >= 20 && v <= 500);
    if (valores.length > 0) return `R$${Math.min(...valores)}`;
  }
  return null;
}

function extractDataLimiteInscricao(texto: string): string | null {
  const m1 = texto.match(
    /encerrad[ao]s?\s+(?:via\s+internet\s+)?(?:no\s+)?dia\s+(\d{1,2})\s+de\s+([a-záéíóúâêôãõç]+)\s+de\s+(\d{4})/i,
  );
  if (m1) {
    const mes = MESES[m1[2].toLowerCase()];
    if (mes) return `${m1[3]}-${mes}-${m1[1].padStart(2, "0")}`;
  }
  const matchDates = [
    ...texto.matchAll(/(?:até|a)\s+(\d{2})\/(\d{2})\/(\d{4})/gi),
  ];
  if (matchDates.length > 0) {
    const last = matchDates[matchDates.length - 1];
    return `${last[3]}-${last[2]}-${last[1]}`;
  }
  return null;
}

function extractLocalLargada(texto: string): string | null {
  const m = texto.match(
    /largada\s+(?:e\s+chegada\s+)?(?:n[oa]\s+|será\s+n[oa]\s+)(.+?)(?:\.|,|\n)/i,
  );
  if (m) {
    const local = m[1].trim().replace(/\s*[-–]\s*SP\s*$/, "");
    return local || null;
  }
  const m2 = texto.match(/LARGADA\s+E\s+CHEGADA\s*\n(.+)/i);
  if (m2) {
    const line = m2[1].trim();
    // Skip lines about timing/date — we want location, not schedule
    if (!/\bprevista\s+para\b/i.test(line)) return line;
  }
  return null;
}

function extractLinkInscricao(html: string): string | null {
  const m = html.match(/href="(https?:\/\/www\.sympla\.com\.br\/[^"]+)"/i);
  return m ? m[1] : null;
}

function extractDescricao(texto: string): string | null {
  const m1 = texto.match(/OBJETIVO[.\s]*\n([\s\S]+?)(?:\n[A-Z]|\n\d+)/);
  if (m1) {
    const desc = m1[1].trim().substring(0, 500);
    if (desc.length > 20) return desc;
  }
  const m2 = texto.match(
    /O EVENTO\s*\n([\s\S]+?)(?:\n[A-Z]{3,}|\n\d+\s*[–\-.]\s)/,
  );
  if (m2) {
    const desc = m2[1].trim().substring(0, 500);
    if (desc.length > 20) return desc;
  }
  return null;
}

function extractPrizeInfo(texto: string): {
  type: "money" | "trophy" | "both" | "none";
  details: string | null;
} {
  const hasMoney = /R\$\s*\d+[\s\S]*(?:1º|primeiro|geral)/i.test(texto);
  const hasTrophy = /trof[ée]u/i.test(texto);
  if (hasMoney && hasTrophy) return { type: "both", details: null };
  if (hasMoney) return { type: "money", details: null };
  if (hasTrophy) return { type: "trophy", details: null };
  return { type: "none", details: null };
}

function extractRouteDescription(texto: string): string | null {
  const m = texto.match(
    /PERCURSO\s*\n([\s\S]+?)(?:\n[A-Z]{3,}|\n\d+\s*[–\-.])/,
  );
  if (m) return m[1].trim().substring(0, 300);
  return null;
}

function extractImageFromHTML(html: string): string | null {
  const og = html.match(/<meta\s+property="og:image"\s+content="([^"]+)"/i);
  if (og && !og[1].includes("favicon")) return og[1];
  const img = html.match(
    /<img[^>]+src="(https?:\/\/equilibrio\.esp\.br\/wp-content\/uploads\/[^"]+)"/i,
  );
  if (img && !img[1].includes("favicon")) return img[1];
  return null;
}

export async function scrapeEquilibrio(): Promise<ScrapedRace[]> {
  const corridasRes = await fetchWithTimeout(
    `${BASE_URL}/wp-json/wp/v2/corridas-proximos?per_page=100`,
  );
  if (!corridasRes.ok) throw new Error(`WP API error: ${corridasRes.status}`);
  const corridasAPI: WPCorridaProxima[] = await corridasRes.json();

  const produtosPorSlug: Record<string, WPProduct> = {};
  try {
    const produtosRes = await fetchWithTimeout(
      `${BASE_URL}/wp-json/wp/v2/product?per_page=100&_embed`,
    );
    if (produtosRes.ok) {
      const produtos: WPProduct[] = await produtosRes.json();
      for (const p of produtos) produtosPorSlug[p.slug] = p;
    }
  } catch (err) {
    console.warn(
      "[equilibrio] Falha ao buscar produtos WooCommerce:",
      err instanceof Error ? err.message : err,
    );
  }

  async function processRace(corridaAPI: WPCorridaProxima): Promise<ScrapedRace> {
    const titulo = stripHTML(corridaAPI.title.rendered);
    const slug = corridaAPI.slug;
    const pageURL = `${BASE_URL}/${slug}/`;
    let htmlDetalhe = "";
    let textoDetalhe = "";
    try {
      const res = await fetchWithTimeout(pageURL);
      if (res.ok) {
        htmlDetalhe = await res.text();
        textoDetalhe = stripHTML(htmlDetalhe);
      } else {
        console.warn(`[equilibrio] HTTP ${res.status} ao acessar ${pageURL}`);
      }
    } catch (err) {
      console.warn(
        `[equilibrio] Falha ao acessar ${pageURL}:`,
        err instanceof Error ? err.message : err,
      );
      try {
        const altSlug = slug.replace(/-sp$/, "-s");
        if (altSlug !== slug) {
          const res = await fetchWithTimeout(`${BASE_URL}/${altSlug}/`);
          if (res.ok) {
            htmlDetalhe = await res.text();
            textoDetalhe = stripHTML(htmlDetalhe);
          }
        }
      } catch (err2) {
        console.warn(
          `[equilibrio] Fallback também falhou para ${slug}:`,
          err2 instanceof Error ? err2.message : err2,
        );
      }
    }

    const { cidade, estado } = extractCidadeEstado(titulo);
    const data = extractDataEvento(textoDetalhe);
    const startTime = extractHorarioLargada(textoDetalhe);
    const distancias = extractDistancias(textoDetalhe);
    const valorInscricao = extractValorInscricao(textoDetalhe);
    const dataLimite = extractDataLimiteInscricao(textoDetalhe);
    const localLargada = extractLocalLargada(textoDetalhe);
    const linkInscricao = extractLinkInscricao(htmlDetalhe);
    const descricao = extractDescricao(textoDetalhe);
    const { type: prizeType } = extractPrizeInfo(textoDetalhe);
    const routeDescription = extractRouteDescription(textoDetalhe);

    let image_url: string | null = null;
    const produto =
      produtosPorSlug[slug] ??
      Object.values(produtosPorSlug).find((p) => {
        const shorter = slug.length < p.slug.length ? slug : p.slug;
        return (
          shorter.length >= 6 &&
          (slug.includes(p.slug) || p.slug.includes(slug))
        );
      });
    if (produto?.uagb_featured_image_src?.full?.[0])
      image_url = produto.uagb_featured_image_src.full[0];
    if (!image_url) image_url = extractImageFromHTML(htmlDetalhe);

    let address = localLargada;
    if (address && cidade) address = `${address}, ${cidade}-${estado || "SP"}`;
    else if (cidade) address = `${cidade}-${estado || "SP"}`;

    return {
      name: titulo,
      slug,
      date: data,
      startTime: startTime || "07:00",
      city: cidade,
      state: estado || "SP",
      address,
      distances: distancias,
      registrationPrice: valorInscricao,
      registrationLink: linkInscricao || pageURL,
      registrationDeadline: dataLimite,
      prizeType,
      prizeDetails: null,
      image_url,
      routeDescription,
      organizer: "Equilíbrio Esportes",
      description: descricao,
      link: pageURL,
    };
  }

  // Process races in parallel batches (CONCURRENCY at a time)
  const races: ScrapedRace[] = [];
  for (let i = 0; i < corridasAPI.length; i += CONCURRENCY) {
    const batch = corridasAPI.slice(i, i + CONCURRENCY);
    const results = await Promise.allSettled(batch.map(processRace));
    for (const result of results) {
      if (result.status === "fulfilled") {
        races.push(result.value);
      } else {
        console.warn("[equilibrio] Race processing failed:", result.reason);
      }
    }
  }
  return races;
}

export const equilibrioScraper: Scraper = {
  name: "Equilíbrio Esportes",
  scrape: scrapeEquilibrio,
};
