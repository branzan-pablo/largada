export interface UserProfile {
  id: string;
  full_name: string | null;
  avatar_url: string | null;
  city: string | null;
  city_id: string | null;
  state: string | null;
  latitude: number | null;
  longitude: number | null;
  notifications_enabled: boolean;
  notification_radius_km: number;
  onboarding_completed: boolean;
  role: "user" | "admin";
  created_at: string;
  updated_at: string;
}
