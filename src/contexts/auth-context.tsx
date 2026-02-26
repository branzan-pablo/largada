"use client";

import { createContext, useContext, useEffect, useState, useCallback, useRef } from "react";
import type { User, SupabaseClient } from "@supabase/supabase-js";
import type { UserProfile } from "@/types/user";

interface AuthContextValue {
  user: User | null;
  profile: UserProfile | null;
  isLoading: boolean;
  signOut: () => Promise<void>;
  refetchProfile: (userId: string) => Promise<void>;
  updateProfile: (data: UserProfile) => void;
}

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const supabaseRef = useRef<SupabaseClient | null>(null);

  const fetchProfile = useCallback(async (userId: string) => {
    const supabase = supabaseRef.current;
    if (!supabase) return;
    const { data } = await supabase
      .from("profiles")
      .select("id, full_name, avatar_url, city, city_id, state, latitude, longitude, notifications_enabled, notification_radius_km, onboarding_completed, role, created_at, updated_at")
      .eq("id", userId)
      .single();
    setProfile(data as UserProfile | null);
  }, []);

  useEffect(() => {
    let cancelled = false;
    let subscription: { unsubscribe: () => void } | undefined;

    // Lazy-load Supabase client — keeps ~80-100 KiB out of the critical JS parse path.
    // The auth listener is set up as soon as the module resolves (typically <100ms).
    import("@/lib/supabase/client").then(({ createClient }) => {
      if (cancelled) return;
      const supabase = createClient();
      supabaseRef.current = supabase;

      const { data: { subscription: sub } } = supabase.auth.onAuthStateChange((_event, session) => {
        const currentUser = session?.user ?? null;
        setUser(currentUser);
        if (currentUser) {
          // setTimeout defers the fetch to after the auth lock is released,
          // preventing a deadlock when querying Supabase inside onAuthStateChange.
          setTimeout(() => fetchProfile(currentUser.id), 0);
        } else {
          setProfile(null);
        }
        setIsLoading(false);
      });
      subscription = sub;
    });

    return () => {
      cancelled = true;
      subscription?.unsubscribe();
    };
  }, [fetchProfile]);

  const signOut = useCallback(async () => {
    await supabaseRef.current?.auth.signOut();
    setUser(null);
    setProfile(null);
  }, []);

  const updateProfile = useCallback((data: UserProfile) => {
    setProfile(data);
  }, []);

  return (
    <AuthContext.Provider value={{ user, profile, isLoading, signOut, refetchProfile: fetchProfile, updateProfile }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
}
