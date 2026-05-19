export interface PrizeStructured {
  total_money_brl: number | null;
  top_n: number | null;
  by_category: boolean;
  max_per_position: number | null;
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
