"use client";

import { useEffect, useState, useRef, useCallback } from "react";
import { useAuth } from "@/contexts/auth-context";
import { useLoginModal } from "@/contexts/login-modal-context";
import { createClient } from "@/lib/supabase/client";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { RaceCard } from "@/components/races/race-card";
import { PromoteRaceCard } from "@/components/races/promote-race-card";
import { Skeleton } from "@/components/ui/skeleton";
import { Trophy, CalendarDays, Star } from "lucide-react";
import { todayInBrazil } from "@/lib/date";
import { toast } from "sonner";
import type { Race } from "@/types/race";

export function MyRacesClient() {
  const { user, isLoading: authLoading } = useAuth();
  const { openLogin } = useLoginModal();
  const [upcoming, setUpcoming] = useState<Race[]>([]);
  const [past, setPast] = useState<Race[]>([]);
  const [created, setCreated] = useState<Race[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const supabaseRef = useRef(createClient());
  const fetchedRef = useRef(false);

  const fetchRaces = useCallback(async (userId: string) => {
    setIsLoading(true);
    const supabase = supabaseRef.current;
    const today = todayInBrazil();

    try {
      const { data: rsvps, error: rsvpsError } = await supabase
        .from("rsvps")
        .select("race_id")
        .eq("user_id", userId);

      if (rsvpsError) {
        throw rsvpsError;
      }

      const raceIds = (rsvps ?? []).map((r) => r.race_id);

      const createdQuery = supabase
        .from("races")
        .select("*")
        .eq("created_by", userId)
        .order("date", { ascending: false });

      if (raceIds.length === 0) {
        const { data: createdData } = await createdQuery;
        setUpcoming([]);
        setPast([]);
        setCreated((createdData as Race[]) ?? []);
        return;
      }

      const [upcomingRes, pastRes, createdRes] = await Promise.all([
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
        createdQuery,
      ]);

      setUpcoming((upcomingRes.data as Race[]) ?? []);
      setPast((pastRes.data as Race[]) ?? []);
      setCreated((createdRes.data as Race[]) ?? []);
    } catch {
      toast.error("Erro ao carregar suas corridas.");
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    if (authLoading) return;

    if (!user) {
      openLogin();
      return;
    }

    // Prevent double-fetch
    if (fetchedRef.current) return;
    fetchedRef.current = true;
    fetchRaces(user.id);
  }, [user, authLoading, openLogin, fetchRaces]);

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
        {created.length > 0 && (
          <TabsTrigger value="created">
            <Star className="mr-1.5 h-4 w-4" />
            Criadas ({created.length})
          </TabsTrigger>
        )}
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

      <TabsContent value="created" className="mt-4">
        {created.length === 0 ? (
          <EmptyState message="Você ainda não criou nenhuma corrida." />
        ) : (
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {created.map((race) => (
              <div key={race.id} className="flex flex-col gap-2">
                <RaceCard race={race} />
                <div className="flex justify-end px-1">
                  <PromoteRaceCard
                    raceId={race.id}
                    raceName={race.name}
                    isPromoted={race.is_promoted}
                    variant="button"
                  />
                </div>
              </div>
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
