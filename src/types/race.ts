export interface DistancePrize {
  distance: string;
  total: number | null;
  top_prize: number | null;
  top_n: number | null;
}

export interface PrizeStructured {
  by_distance: DistancePrize[];
  by_category: boolean;
  has_money: boolean;
  has_trophy: boolean;
  notes: string | null;
}

export interface RegistrationBatchItem {
  label: string;
  price: string;
}

export interface RegistrationBatch {
  name: string;
  deadline?: string;
  items: RegistrationBatchItem[];
}

export interface Race {
  id: string;
  name: string;
  slug: string;
  date: string;
  start_time: string;
  city: string;
  state: string;
  address: string;
  latitude: number;
  longitude: number;
  distances: string[];
  registration_price: string;
  registration_prices: Record<string, string> | null;
  registration_batches: RegistrationBatch[] | null;
  registration_link: string;
  registration_deadline: string;
  prize_type: "money" | "trophy" | "both" | "none";
  prize_details: string | null;
  prize_structured: PrizeStructured | null;
  /**
   * Per-user explanation of why this race was recommended. Populated server-side
   * only for the authenticated viewer (joined from race_recommendation_logs).
   * Null when the user has no recommendation log for this race.
   */
  match_reason?: string | null;
  image_url: string | null;
  route_description: string | null;
  route_image_url: string | null;
  organizer: string | null;
  description: string | null;
  status: "confirmed" | "postponed" | "cancelled" | "pending_review";
  notes: string | null;
  link: string | null;
  is_promoted: boolean;
  rsvp_count: number;
  created_by: string;
  origin: "admin" | "approved_suggestion" | "scraper";
  created_at: string;
  updated_at: string;
}

export interface RaceFilters {
  city?: string;
  dateFrom?: string;
  dateTo?: string;
  distances?: string[];
  prizeType?: string[];
  search?: string;
  lat?: number;
  lng?: number;
  radius?: number;
  page?: number;
  limit?: number;
  /**
   * When true, the listing query routes through semantic search instead of
   * ILIKE: the user's free-text query is embedded with gemini-embedding-001
   * and ranked by cosine similarity against race embeddings.
   */
  semantic?: boolean;
}

export interface RaceSuggestion {
  id: string;
  user_id: string;
  name: string;
  date: string | null;
  city: string;
  state: string;
  link: string | null;
  notes: string | null;
  status: "pending" | "approved" | "rejected";
  reviewed_by: string | null;
  reviewed_at: string | null;
  created_at: string;
}
