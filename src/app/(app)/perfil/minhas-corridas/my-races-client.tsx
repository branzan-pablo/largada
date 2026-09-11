"use client";

import { useEffect, useState, useRef, useCallback } from "react";
import { useAuth } from "@/contexts/auth-context";
import { useLoginModal } from "@/contexts/login-modal-context";
import Link from "next/link";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { RaceCard } from "@/components/races/race-card";
import { PromoteRaceCard } from "@/components/races/promote-race-card";
import { Skeleton } from "@/components/ui/skeleton";
import { Trophy, CalendarDays, Star, BarChart3 } from "lucide-react";
import { todayInBrazil } from "@/lib/date";
import { toast } from "sonner";
import type { Race } from "@/types/race";
import type { OrganizerSubscription } from "@/types/subscription";

export function MyRacesClient({ initialTab }: { initialTab?: string }) {
  const { user, isLoading: authLoading } = useAuth();
  const { openLogin } = useLoginModal();
  const [upcoming, setUpcoming] = useState<Race[]>([]);
  const [past, setPast] = useState<Race[]>([]);
  const [created, setCreated] = useState<Race[]>([]);
  const [subscription, setSubscription] = useState<OrganizerSubscription | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const fetchedRef = useRef(false);

  const fetchRaces = useCallback(async (userId: string) => {
    setIsLoading(true);
    const { createClient } = await import("@/lib/supabase/client");
    const supabase = createClient();
    const today = todayInBrazil();

    try {
      // Fetch subscription status in parallel with races
      const subPromise = fetch("/api/subscriptions/status")
        .then((r) => (r.ok ? r.json() : null))
        .then((d) => d?.subscription ?? null)
        .catch(() => null);

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
        const [{ data: createdData }, sub] = await Promise.all([
          createdQuery,
          subPromise,
        ]);
        setUpcoming([]);
        setPast([]);
        setCreated((createdData as Race[]) ?? []);
        setSubscription(sub);
        return;
      }

      const [upcomingRes, pastRes, createdRes, sub] = await Promise.all([
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
        subPromise,
      ]);

      setUpcoming((upcomingRes.data as Race[]) ?? []);
      setPast((pastRes.data as Race[]) ?? []);
      setCreated((createdRes.data as Race[]) ?? []);
      setSubscription(sub);
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
    <Tabs defaultValue={initialTab === "created" ? "created" : "upcoming"}>
      <TabsList className="w-full">
        <TabsTrigger value="upcoming">
          <CalendarDays className="mr-1.5 hidden h-4 w-4 sm:inline-block" />
          Próximas
          <span className="ml-1 inline-flex h-5 min-w-5 items-center justify-center rounded-full bg-[#FF4D00]/10 px-1.5 text-xs font-semibold text-[#FF4D00]">
            {upcoming.length}
          </span>
        </TabsTrigger>
        <TabsTrigger value="past">
          <Trophy className="mr-1.5 hidden h-4 w-4 sm:inline-block" />
          Passadas
          <span className="ml-1 inline-flex h-5 min-w-5 items-center justify-center rounded-full bg-gray-100 px-1.5 text-xs font-semibold text-[#6B7280]">
            {past.length}
          </span>
        </TabsTrigger>
        {created.length > 0 && (
          <TabsTrigger value="created">
            <Star className="mr-1.5 hidden h-4 w-4 sm:inline-block" />
            Criadas
            <span className="ml-1 inline-flex h-5 min-w-5 items-center justify-center rounded-full bg-gray-100 px-1.5 text-xs font-semibold text-[#6B7280]">
              {created.length}
            </span>
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
                <div className="flex flex-wrap items-center justify-end gap-2 px-1">
                  <Link
                    href={`/perfil/minhas-corridas/${race.id}/analytics`}
                    className="inline-flex items-center gap-1.5 rounded-full border border-gray-200 bg-white px-3 py-1.5 text-xs font-medium text-[#0D1B2A] hover:border-[#FF4D00]/40 hover:text-[#FF4D00] transition-colors"
                  >
                    <BarChart3 className="h-3.5 w-3.5" />
                    Analytics
                  </Link>
                  <PromoteRaceCard
                    raceId={race.id}
                    raceName={race.name}
                    isPromoted={race.is_promoted}
                    registrationDeadline={race.registration_deadline}
                    variant="button"
                    subscription={subscription}
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
