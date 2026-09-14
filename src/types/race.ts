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
  image_url: string | null;
  route_description: string | null;
  route_image_url: string | null;
  organizer: string | null;
  description: string | null;
  status: "confirmed" | "postponed" | "cancelled" | "pending_review" | "rejected";
  notes: string | null;
  link: string | null;
}

export type RaceSummary = Pick<
  Race,
  | "id"
  | "name"
  | "slug"
  | "date"
  | "start_time"
  | "city"
  | "state"
  | "distances"
  | "prize_type"
  | "prize_structured"
  | "image_url"
>;

export interface RaceFilters {
  city?: string;
  dateFrom?: string;
  dateTo?: string;
  distances?: string[];
  prizeType?: string[];
  search?: string;
  page?: number;
  limit?: number;
}
