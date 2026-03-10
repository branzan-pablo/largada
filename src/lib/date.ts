/**
 * Global Date Helper — Padrão oficial do projeto Largada
 *
 * REGRAS:
 * 1. Armazenamento: sempre UTC (timestamptz, ISO com Z)
 * 2. Timezone de exibição: America/Sao_Paulo
 * 3. Formato brasileiro: dd/MM/yyyy, dd/MM/yyyy HH:mm
 * 4. Locale: pt-BR
 *
 * USO:
 * - Backend (timestamps): utcNow(), todayInBrazil()
 * - Frontend (exibição): formatDate(), formatDateFull(), formatDateShort(), formatDateTime()
 */

import { format } from "date-fns";
import { ptBR } from "date-fns/locale";

const BRAZIL_TZ = "America/Sao_Paulo";

// ─── Internals ───────────────────────────────────────────

/**
 * Extrai os componentes de data/hora em America/Sao_Paulo
 * usando Intl.DateTimeFormat (nativo, sem dependência extra).
 */
function getBrazilParts(date: Date): Record<string, string> {
  const formatter = new Intl.DateTimeFormat("en-US", {
    timeZone: BRAZIL_TZ,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
    hour12: false,
  });

  const parts: Record<string, string> = {};
  for (const { type, value } of formatter.formatToParts(date)) {
    parts[type] = value;
  }
  return parts;
}

/**
 * Converte um Date UTC para um Date "fake local" com os componentes
 * correspondentes a America/Sao_Paulo. Útil para passar ao date-fns
 * que opera em local time.
 */
function toFakeBrazilDate(date: Date): Date {
  const p = getBrazilParts(date);
  // hour "24" → "0" (Intl quirk at midnight)
  const hour = p.hour === "24" ? "0" : p.hour;
  return new Date(
    parseInt(p.year),
    parseInt(p.month) - 1,
    parseInt(p.day),
    parseInt(hour),
    parseInt(p.minute),
    parseInt(p.second),
  );
}

// ─── Backend: geração de timestamps UTC ──────────────────

/** Retorna o instante atual em ISO 8601 UTC (ex: "2026-03-15T14:30:00.000Z") */
export function utcNow(): string {
  return new Date().toISOString();
}

/**
 * Retorna a data de "hoje" no fuso de São Paulo (YYYY-MM-DD).
 * Seguro para comparações com colunas DATE do banco.
 *
 * Exemplo: às 23h SP (02h UTC do dia seguinte), retorna o dia correto de SP.
 */
export function todayInBrazil(): string {
  const p = getBrazilParts(new Date());
  return `${p.year}-${p.month}-${p.day}`;
}

/**
 * Retorna uma data futura no fuso de São Paulo (YYYY-MM-DD).
 * Útil para crons e filtros (ex: "daqui a 3 dias").
 */
export function futureDateInBrazil(days: number): string {
  const now = new Date();
  const brazilNow = toFakeBrazilDate(now);
  brazilNow.setDate(brazilNow.getDate() + days);
  const y = brazilNow.getFullYear();
  const m = String(brazilNow.getMonth() + 1).padStart(2, "0");
  const d = String(brazilNow.getDate()).padStart(2, "0");
  return `${y}-${m}-${d}`;
}

/**
 * Retorna um timestamp UTC ISO 8601 para daqui a N dias.
 * Útil para calcular expirações (ex: promoted_until).
 */
export function futureUtc(days: number): string {
  return new Date(Date.now() + days * 24 * 60 * 60 * 1000).toISOString();
}

/**
 * Retorna um timestamp UTC ISO 8601 para N dias atrás.
 * Útil para filtros de janela temporal (ex: rate limiting por dia).
 */
export function pastUtc(days: number): string {
  return new Date(Date.now() - days * 24 * 60 * 60 * 1000).toISOString();
}

/**
 * Parse de campo DATE do banco ("2026-03-15") para Date local.
 * Adiciona T00:00:00 para evitar deslocamento UTC.
 */
export function parseRaceDate(dateStr: string): Date {
  return new Date(dateStr + "T00:00:00");
}

// ─── Parsing seguro ──────────────────────────────────────

/**
 * Faz parse de uma string de data para exibição no fuso de São Paulo.
 * - DATE do banco ("2026-03-15"): interpreta como meia-noite local (não UTC)
 * - TIMESTAMPTZ ("2026-03-15T14:30:00Z"): converte para horário de São Paulo
 */
function parseToBrazil(date: string | Date): Date {
  if (date instanceof Date) return toFakeBrazilDate(date);

  // Date-only string (YYYY-MM-DD): interpret as local midnight (no TZ conversion)
  if (!date.includes("T")) {
    return new Date(date + "T00:00:00");
  }

  // Full timestamp: convert UTC → Brazil for display
  return toFakeBrazilDate(new Date(date));
}

// ─── Frontend: formatação para exibição ──────────────────

/** "15 de março" */
export function formatDate(date: string | Date): string {
  return format(parseToBrazil(date), "d 'de' MMMM", { locale: ptBR });
}

/** "15 de março de 2026" */
export function formatDateFull(date: string | Date): string {
  return format(parseToBrazil(date), "d 'de' MMMM 'de' yyyy", {
    locale: ptBR,
  });
}

/** "15/03/2026" */
export function formatDateShort(date: string | Date): string {
  return format(parseToBrazil(date), "dd/MM/yyyy", { locale: ptBR });
}

/**
 * "15/03/2026 14:30"
 * Para timestamps (created_at, paid_at, etc.) — converte UTC → São Paulo.
 */
export function formatDateTime(date: string | Date): string {
  return format(parseToBrazil(date), "dd/MM/yyyy HH:mm", { locale: ptBR });
}

/** Extrai "HH:mm" de um campo TIME do banco ("14:30:00" → "14:30") */
export function formatTime(time: string): string {
  return time.slice(0, 5);
}
