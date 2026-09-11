import { RADAR_WHATSAPP_NUMBER } from "@/lib/constants";

export interface RadarFormData {
  pace: string;
  distance: string;
  category: string;
  sex: string;
  city: string;
  cityId: string | null;
  state: string | null;
  latitude: number | null;
  longitude: number | null;
}

export type RadarStep = "form" | "confirm" | "customer" | "verifying" | "paid" | "success";
export const RADAR_BILLING_STORAGE_KEY = "radar:lastBillingId";
export const EMPTY_RADAR_FORM: RadarFormData = {
  pace: "", distance: "", category: "", sex: "", city: "",
  cityId: null, state: null, latitude: null, longitude: null,
};

export function formatRadarPace(value: string): string {
  const digits = value.replace(/\D/g, "");
  return digits.length <= 2 ? digits : `${digits.slice(0, 2)}:${digits.slice(2, 4)}`;
}

export function isValidRadarPace(pace: string): boolean {
  return /^\d{2}:\d{2}$/.test(pace);
}

export function buildRadarWhatsAppUrl(form: Pick<RadarFormData, "pace" | "distance" | "category" | "sex" | "city">): string {
  const sexLabel = form.sex === "masculino" ? "Masculino" : "Feminino";
  const message = [
    "Olá! Acabei de pagar a *Curadoria de Corridas* (Radar de Pódio).", "",
    `Pace: ${form.pace}/km`, `Distância: ${form.distance}`, `Sexo: ${sexLabel}`,
    `Faixa etária: ${form.category}`, `Cidade: ${form.city}`, "",
    "Aguardo o retorno com as recomendações.",
  ].join("\n");
  return `https://wa.me/${RADAR_WHATSAPP_NUMBER}?text=${encodeURIComponent(message)}`;
}
