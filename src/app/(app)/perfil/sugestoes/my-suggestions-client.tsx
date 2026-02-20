"use client";

import { useEffect, useState, useRef, useCallback } from "react";
import { useAuth } from "@/contexts/auth-context";
import { useLoginModal } from "@/contexts/login-modal-context";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { formatDate } from "@/lib/utils";
import { toast } from "sonner";
import { MessageSquarePlus, CalendarDays, MapPin, Trash2, Loader2 } from "lucide-react";
import type { RaceSuggestion } from "@/types/race";

const STATUS_MAP = {
  pending: { label: "Pendente", variant: "outline" as const },
  approved: { label: "Aprovada", variant: "default" as const },
  rejected: { label: "Rejeitada", variant: "destructive" as const },
};

export function MySuggestionsClient() {
  const { user, isLoading: authLoading } = useAuth();
  const { openLogin } = useLoginModal();
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
      openLogin();
      return;
    }
    fetchSuggestions(user.id);
  }, [user, authLoading, openLogin, fetchSuggestions]);

  const [deletingId, setDeletingId] = useState<string | null>(null);

  const handleDelete = async (id: string) => {
    setDeletingId(id);
    try {
      const res = await fetch(`/api/suggestions?id=${id}`, { method: "DELETE" });
      if (!res.ok) {
        const data = await res.json();
        toast.error(data.error || "Erro ao excluir sugestão.");
        return;
      }
      setSuggestions((prev) => prev.filter((s) => s.id !== id));
      toast.success("Sugestão excluída.");
    } catch {
      toast.error("Erro ao excluir sugestão.");
    } finally {
      setDeletingId(null);
    }
  };

  if (authLoading || isLoading) return null;

  if (suggestions.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-16 text-center">
        <div className="mb-4 rounded-full bg-muted p-4">
          <MessageSquarePlus className="h-8 w-8 text-muted-foreground" />
        </div>
        <h3 className="mb-2 text-lg font-semibold">Nenhuma sugestão enviada</h3>
        <p className="mb-6 max-w-sm text-sm text-muted-foreground">
          Você ainda não enviou nenhuma sugestão de corrida. Ajude a comunidade a crescer!
        </p>
        <Button asChild>
          <Link href="/sugerir">Sugerir Corrida</Link>
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex justify-end">
        <Button size="sm" variant="outline" asChild>
          <Link href="/sugerir">
            <MessageSquarePlus className="mr-2 h-4 w-4" />
            Nova Sugestão
          </Link>
        </Button>
      </div>

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
                      {`${s.city} — ${s.state}`}
                    </span>
                  )}
                </div>
                {s.notes && (
                  <p className="text-sm text-muted-foreground">{s.notes}</p>
                )}
              </div>
              <div className="flex items-center gap-2">
                <Badge variant={status.variant}>{status.label}</Badge>
                {s.status === "pending" && (
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-8 w-8 text-destructive hover:text-destructive cursor-pointer"
                    disabled={deletingId === s.id}
                    onClick={() => handleDelete(s.id)}
                  >
                    {deletingId === s.id ? (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    ) : (
                      <Trash2 className="h-4 w-4" />
                    )}
                  </Button>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
