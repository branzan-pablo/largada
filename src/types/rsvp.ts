export interface Rsvp {
  id: string;
  user_id: string;
  race_id: string;
  created_at: string;
}

export interface RsvpWithProfile {
  id: string;
  user_id: string;
  race_id: string;
  created_at: string;
  profiles: {
    full_name: string | null;
    avatar_url: string | null;
  };
}
