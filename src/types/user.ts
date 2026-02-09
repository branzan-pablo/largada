export interface UserProfile {
  id: string;
  full_name: string | null;
  avatar_url: string | null;
  city: string | null;
  state: string | null;
  latitude: number | null;
  longitude: number | null;
  notifications_enabled: boolean;
  role: "user" | "admin";
  created_at: string;
  updated_at: string;
}
