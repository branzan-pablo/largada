import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

// Parse date string safely: "2026-03-15" → local midnight (not UTC)
function parseDate(date: string | Date): Date {
  if (date instanceof Date) return date;
  // Append T00:00:00 to prevent UTC midnight interpretation in Brazilian timezone (UTC-3)
  return new Date(date.includes("T") ? date : date + "T00:00:00");
}

export function formatDate(date: string | Date): string {
  return format(parseDate(date), "d 'de' MMMM", { locale: ptBR });
}

export function formatDateFull(date: string | Date): string {
  return format(parseDate(date), "d 'de' MMMM 'de' yyyy", { locale: ptBR });
}

export function formatDateShort(date: string | Date): string {
  return format(parseDate(date), "dd/MM/yyyy", { locale: ptBR });
}

export function formatTime(time: string): string {
  return time.slice(0, 5);
}

export function slugify(text: string): string {
  return text
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "");
}

export function formatCurrency(value: number): string {
  return new Intl.NumberFormat("pt-BR", {
    style: "currency",
    currency: "BRL",
  }).format(value);
}
