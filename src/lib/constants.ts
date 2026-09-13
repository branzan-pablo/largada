export const DEFAULT_DISTANCES = ["5k", "10k", "21k", "42k"] as const;
export type Distance = (typeof DEFAULT_DISTANCES)[number];

export const PRIZE_TYPES = {
  money: "Dinheiro",
  trophy: "Troféu",
  both: "Dinheiro e Troféu",
  none: "Sem premiação",
} as const;
export type PrizeType = keyof typeof PRIZE_TYPES;

export const RACE_STATUSES = {
  confirmed: "Confirmada",
  postponed: "Adiada",
  cancelled: "Cancelada",
  pending_review: "Pendente",
  rejected: "Rejeitada",
} as const;
export type RaceStatus = keyof typeof RACE_STATUSES;

export const RACE_ORIGINS = {
  admin: "Admin",
  scraper: "Scraper",
  approved_suggestion: "Sugestão",
} as const;
export type RaceOrigin = keyof typeof RACE_ORIGINS;

export const RADIUS_OPTIONS = [50, 100, 150, 200] as const;

export const REGION_CITIES = [
  { name: "São José do Rio Preto", state: "SP", lat: -20.8113, lng: -49.3758 },
  { name: "Votuporanga", state: "SP", lat: -20.4218, lng: -49.9729 },
  { name: "Araçatuba", state: "SP", lat: -21.2089, lng: -50.4328 },
  { name: "Catanduva", state: "SP", lat: -21.1378, lng: -48.9726 },
  { name: "Fernandópolis", state: "SP", lat: -20.2839, lng: -50.2467 },
  { name: "Jales", state: "SP", lat: -20.269, lng: -50.546 },
  { name: "Mirassol", state: "SP", lat: -20.8186, lng: -49.5204 },
  { name: "Birigui", state: "SP", lat: -21.2883, lng: -50.34 },
  { name: "Penápolis", state: "SP", lat: -21.4173, lng: -50.0766 },
  { name: "Olímpia", state: "SP", lat: -20.7368, lng: -48.9163 },
  { name: "Novo Horizonte", state: "SP", lat: -21.4677, lng: -49.2209 },
  { name: "Tanabi", state: "SP", lat: -20.6263, lng: -49.6573 },
  { name: "Monte Aprazível", state: "SP", lat: -20.7725, lng: -49.7144 },
  { name: "José Bonifácio", state: "SP", lat: -21.0529, lng: -49.6884 },
  { name: "Bebedouro", state: "SP", lat: -20.9492, lng: -48.4791 },
  { name: "Lins", state: "SP", lat: -21.6786, lng: -49.7425 },
  { name: "Barretos", state: "SP", lat: -20.5573, lng: -48.5678 },
  { name: "Presidente Prudente", state: "SP", lat: -22.1207, lng: -51.3882 },
  { name: "Marília", state: "SP", lat: -22.2139, lng: -49.9461 },
  { name: "Araraquara", state: "SP", lat: -21.7946, lng: -48.1756 },
] as const;

export const RADAR_WHATSAPP_NUMBER = "5517996418555";

export const RADAR_AGE_CATEGORIES = [
  "16-19",
  "20-24",
  "25-29",
  "30-34",
  "35-39",
  "40-44",
  "45-49",
  "50-54",
  "55-59",
  "60-64",
  "65-69",
  "70+",
] as const;

export const ITEMS_PER_PAGE = 20;

export const SUGGESTION_DAILY_LIMIT = 5;
