"use client";

import { useEffect, useState, useRef, useCallback } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/contexts/auth-context";
import { createClient } from "@/lib/supabase/client";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { RaceCard } from "@/components/races/race-card";
import { Skeleton } from "@/components/ui/skeleton";
import { Trophy, CalendarDays } from "lucide-react";
import type { Race } from "@/types/race";

export function MyRacesClient() {
  const { user, isLoading: authLoading } = useAuth();
  const router = useRouter();
  const [upcoming, setUpcoming] = useState<Race[]>([]);
  const [past, setPast] = useState<Race[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const supabaseRef = useRef(createClient());
  const fetchedRef = useRef(false);

  const fetchRaces = useCallback(async (userId: string) => {
    const supabase = supabaseRef.current;
    const today = new Date().toISOString().split("T")[0];

    const { data: rsvps } = await supabase
      .from("rsvps")
      .select("race_id")
      .eq("user_id", userId);

    if (!rsvps || rsvps.length === 0) {
      setUpcoming([]);
      setPast([]);
      setIsLoading(false);
      return;
    }

    const raceIds = rsvps.map((r) => r.race_id);

    const [{ data: upcomingData }, { data: pastData }] = await Promise.all([
      supabase
        .from("races")
        .select("*")
        .in("id", raceIds)
        .gte("date", today)
        .order("date", { ascending: true }),
      supabase
        .from("races")
        .select("*")
        .in("id", raceIds)
        .lt("date", today)
        .order("date", { ascending: false }),
    ]);

    setUpcoming((upcomingData as Race[]) ?? []);
    setPast((pastData as Race[]) ?? []);
    setIsLoading(false);
  }, []);

  useEffect(() => {
    if (authLoading) return;

    if (!user) {
      router.replace("/login?redirect=/perfil/minhas-corridas");
      return;
    }

    // Prevent double-fetch
    if (fetchedRef.current) return;
    fetchedRef.current = true;
    fetchRaces(user.id);
  }, [user, authLoading, router, fetchRaces]);

  if (authLoading || isLoading) {
    return (
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {Array.from({ length: 3 }).map((_, i) => (
          <Skeleton key={i} className="h-40 rounded-lg" />
        ))}
      </div>
    );
  }

  return (
    <Tabs defaultValue="upcoming">
      <TabsList>
        <TabsTrigger value="upcoming">
          <CalendarDays className="mr-1.5 h-4 w-4" />
          Próximas ({upcoming.length})
        </TabsTrigger>
        <TabsTrigger value="past">
          <Trophy className="mr-1.5 h-4 w-4" />
          Passadas ({past.length})
        </TabsTrigger>
      </TabsList>

      <TabsContent value="upcoming" className="mt-4">
        {upcoming.length === 0 ? (
          <EmptyState message="Você ainda não confirmou presença em nenhuma corrida futura." />
        ) : (
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {upcoming.map((race) => (
              <RaceCard key={race.id} race={race} />
            ))}
          </div>
        )}
      </TabsContent>

      <TabsContent value="past" className="mt-4">
        {past.length === 0 ? (
          <EmptyState message="Nenhuma corrida passada encontrada." />
        ) : (
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {past.map((race) => (
              <RaceCard key={race.id} race={race} />
            ))}
          </div>
        )}
      </TabsContent>
    </Tabs>
  );
}

function EmptyState({ message }: { message: string }) {
  return (
    <div className="flex flex-col items-center justify-center py-16 text-center">
      <Trophy className="mb-4 h-12 w-12 text-muted-foreground/50" />
      <p className="text-sm text-muted-foreground">{message}</p>
    </div>
  );
}
