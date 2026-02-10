"use client";

import { useEffect, useState, useRef, useCallback } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/contexts/auth-context";
import { createClient } from "@/lib/supabase/client";
import { Badge } from "@/components/ui/badge";
import { formatDate } from "@/lib/utils";
import { MessageSquarePlus, CalendarDays, MapPin } from "lucide-react";
import type { RaceSuggestion } from "@/types/race";

const STATUS_MAP = {
  pending: { label: "Pendente", variant: "outline" as const },
  approved: { label: "Aprovada", variant: "default" as const },
  rejected: { label: "Rejeitada", variant: "destructive" as const },
};

export function MySuggestionsClient() {
  const { user, isLoading: authLoading } = useAuth();
  const router = useRouter();
  const [suggestions, setSuggestions] = useState<RaceSuggestion[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const supabaseRef = useRef(createClient());

  const fetchSuggestions = useCallback(async (userId: string) => {
    const { data } = await supabaseRef.current
      .from("race_suggestions")
      .select("*")
      .eq("user_id", userId)
      .order("created_at", { ascending: false });

    setSuggestions((data as RaceSuggestion[]) ?? []);
    setIsLoading(false);
  }, []);

  useEffect(() => {
    if (authLoading) return;
    if (!user) {
      router.replace("/login");
      return;
    }
    fetchSuggestions(user.id);
  }, [user, authLoading, router, fetchSuggestions]);

  if (authLoading || isLoading) return null;

  if (suggestions.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-16 text-center">
        <MessageSquarePlus className="mb-4 h-12 w-12 text-muted-foreground/50" />
        <p className="text-sm text-muted-foreground">
          Você ainda não enviou nenhuma sugestão de corrida.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {suggestions.map((s) => {
        const status = STATUS_MAP[s.status as keyof typeof STATUS_MAP];
        return (
          <div
            key={s.id}
            className="flex items-start justify-between gap-3 rounded-lg border p-4"
          >
            <div className="space-y-1">
              <p className="font-medium">{s.name}</p>
              <div className="flex flex-wrap gap-3 text-sm text-muted-foreground">
                {s.date && (
                  <span className="flex items-center gap-1">
                    <CalendarDays className="h-3.5 w-3.5" />
                    {formatDate(s.date)}
                  </span>
                )}
                {s.city && (
                  <span className="flex items-center gap-1">
                    <MapPin className="h-3.5 w-3.5" />
                    {s.city}
                  </span>
                )}
              </div>
              {s.notes && (
                <p className="text-sm text-muted-foreground">{s.notes}</p>
              )}
            </div>
            <Badge variant={status.variant}>{status.label}</Badge>
          </div>
        );
      })}
    </div>
  );
}
