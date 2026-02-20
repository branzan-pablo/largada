"use client";

import { createContext, useContext, useEffect, useState, useCallback, useRef } from "react";
import { createClient } from "@/lib/supabase/client";
import type { User } from "@supabase/supabase-js";
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
  const supabaseRef = useRef(createClient());

  const fetchProfile = useCallback(async (userId: string) => {
    const { data } = await supabaseRef.current
      .from("profiles")
      .select("id, full_name, avatar_url, city, city_id, state, latitude, longitude, notifications_enabled, notification_radius_km, onboarding_completed, role, created_at, updated_at")
      .eq("id", userId)
      .single();
    setProfile(data as UserProfile | null);
  }, []);

  useEffect(() => {
    const supabase = supabaseRef.current;

    console.log("[auth] useEffect mounted, subscribing to onAuthStateChange");

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(async (_event, session) => {
      console.log("[auth] onAuthStateChange fired:", _event, "user:", session?.user?.id ?? null);
      try {
        const currentUser = session?.user ?? null;
        setUser(currentUser);
        if (currentUser) {
          console.log("[auth] fetching profile for", currentUser.id);
          await fetchProfile(currentUser.id);
          console.log("[auth] fetchProfile completed");
        } else {
          setProfile(null);
        }
      } catch (err) {
        console.error("[auth] error in onAuthStateChange callback:", err);
      } finally {
        console.log("[auth] setIsLoading(false)");
        setIsLoading(false);
      }
    });

    return () => {
      console.log("[auth] useEffect cleanup, unsubscribing");
      subscription.unsubscribe();
    };
  }, [fetchProfile]);

  const signOut = useCallback(async () => {
    await supabaseRef.current.auth.signOut();
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
