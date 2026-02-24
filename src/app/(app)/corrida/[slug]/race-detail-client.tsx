"use client";

import { createContext, useCallback, useContext, useState } from "react";
import { useAuth } from "@/contexts/auth-context";
import { useLoginModal } from "@/contexts/login-modal-context";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Users, Check } from "lucide-react";
import { toast } from "sonner";

interface Participant {
  id: string;
  full_name: string | null;
  avatar_url: string | null;
}

interface RsvpContextValue {
  rsvped: boolean;
  count: number;
  participants: Participant[];
  isToggling: boolean;
  toggle: () => void;
}

const RsvpContext = createContext<RsvpContextValue | null>(null);

function useRsvpContext() {
  const ctx = useContext(RsvpContext);
  if (!ctx) throw new Error("useRsvpContext must be used within RsvpProvider");
  return ctx;
}

interface RsvpProviderProps {
  raceId: string;
  initialRsvped: boolean;
  initialCount: number;
  initialParticipants: Participant[];
  children: React.ReactNode;
}

export function RsvpProvider({
  raceId,
  initialRsvped,
  initialCount,
  initialParticipants,
  children,
}: RsvpProviderProps) {
  const { user, profile } = useAuth();
  const { openLogin } = useLoginModal();
  const [rsvped, setRsvped] = useState(initialRsvped);
  const [count, setCount] = useState(initialCount);
  const [participants, setParticipants] = useState(initialParticipants);
  const [isToggling, setIsToggling] = useState(false);

  const toggle = useCallback(async () => {
    if (isToggling) return;

    if (!user) {
      openLogin();
      return;
    }

    const prevRsvped = rsvped;
    const prevCount = count;
    const prevParticipants = participants;

    const newRsvped = !rsvped;
    setRsvped(newRsvped);
    setCount(newRsvped ? count + 1 : count - 1);

    if (newRsvped) {
      setParticipants((prev) => [
        ...prev,
        { id: user.id, full_name: profile?.full_name ?? null, avatar_url: profile?.avatar_url ?? null },
      ]);
    } else {
      setParticipants((prev) => prev.filter((p) => p.id !== user.id));
    }

    setIsToggling(true);

    try {
      const res = await fetch("/api/rsvp", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ raceId }),
      });

      if (!res.ok) {
        setRsvped(prevRsvped);
        setCount(prevCount);
        setParticipants(prevParticipants);
        toast.error("Erro ao atualizar confirmação. Tente novamente.");
      }
    } catch {
      setRsvped(prevRsvped);
      setCount(prevCount);
      setParticipants(prevParticipants);
      toast.error("Erro ao atualizar confirmação. Tente novamente.");
    } finally {
      setIsToggling(false);
    }
  }, [raceId, rsvped, count, participants, isToggling, user, profile, openLogin]);

  return (
    <RsvpContext.Provider value={{ rsvped, count, participants, isToggling, toggle }}>
      {children}
    </RsvpContext.Provider>
  );
}

export function ParticipantsSection() {
  const { count, participants } = useRsvpContext();

  return (
    <section>
      <h2 className="mb-3 text-sm font-semibold text-muted-foreground uppercase tracking-wide">
        Participantes ({count})
      </h2>
      {participants.length > 0 ? (
        <div className="flex flex-wrap gap-2">
          {participants.slice(0, 10).map((p) => (
            <Badge key={p.id} variant="secondary" className="gap-1.5 px-3 py-1">
              <Users className="h-3 w-3" />
              {p.full_name ?? "Corredor"}
            </Badge>
          ))}
          {count > 10 && (
            <Badge variant="secondary" className="px-3 py-1">
              +{count - 10} mais
            </Badge>
          )}
        </div>
      ) : (
        <p className="text-sm text-muted-foreground">
          Ninguém confirmou presença ainda. Seja o primeiro!
        </p>
      )}
    </section>
  );
}

export function RsvpCard() {
  const { rsvped, count, isToggling, toggle } = useRsvpContext();

  return (
    <div className="rounded-xl border border-gray-200 bg-gray-50 p-5 space-y-3">
      <h3 className="font-semibold text-[#0D1B2A]">Vou nessa!</h3>
      <p className="text-sm text-muted-foreground">
        {count} {count === 1 ? "pessoa confirmou" : "pessoas confirmaram"}
      </p>
      <Button
        onClick={toggle}
        disabled={isToggling}
        variant={rsvped ? "default" : "outline"}
        className="w-full cursor-pointer"
      >
        {rsvped ? (
          <>
            <Check className="mr-2 h-4 w-4" />
            Confirmado!
          </>
        ) : (
          <>
            <Users className="mr-2 h-4 w-4" />
            Vou nessa
          </>
        )}
      </Button>
    </div>
  );
}
