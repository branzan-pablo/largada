"use client";

import { createContext, useCallback, useContext, useState } from "react";
import { useAuth } from "@/contexts/auth-context";
import { useLoginModal } from "@/contexts/login-modal-context";
import {
  Avatar,
  AvatarFallback,
  AvatarImage,
  AvatarGroup,
  AvatarGroupCount,
} from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Users, Check, ExternalLink, ChevronDown, ChevronUp } from "lucide-react";
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

function getInitials(name: string | null): string {
  if (!name) return "?";
  const parts = name.trim().split(/\s+/);
  if (parts.length === 1) return parts[0][0].toUpperCase();
  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
}

export function ParticipantsSection() {
  const { count, participants } = useRsvpContext();
  const [showAll, setShowAll] = useState(false);
  const maxCollapsed = 3;
  const hasMore = participants.length > maxCollapsed;
  const visibleParticipants = showAll ? participants : participants.slice(0, maxCollapsed);

  if (count === 0) return null;

  return (
    <section className="rounded-xl border border-gray-200 bg-card p-5">
      <h2 className="mb-3 text-sm font-semibold text-muted-foreground uppercase tracking-wide">
        Participantes ({count})
      </h2>
      {participants.length > 0 && (
        <div className="space-y-3">
          <div className="flex items-center gap-2">
            <AvatarGroup>
              {participants.slice(0, 5).map((p) => (
                <Avatar key={p.id} size="default">
                  {p.avatar_url && <AvatarImage src={p.avatar_url} alt={p.full_name ?? "Corredor"} />}
                  <AvatarFallback>{getInitials(p.full_name)}</AvatarFallback>
                </Avatar>
              ))}
              {count > 5 && <AvatarGroupCount>+{count - 5}</AvatarGroupCount>}
            </AvatarGroup>
            <span className="text-sm text-muted-foreground">
              {count === 1 ? "1 confirmado" : `${count} confirmados`}
            </span>
          </div>
          <div className={showAll && hasMore ? "max-h-60 overflow-y-auto" : ""}>
            {visibleParticipants.map((p) => (
              <div key={p.id} className="flex items-center gap-2 py-1.5">
                <Avatar size="sm">
                  {p.avatar_url && <AvatarImage src={p.avatar_url} alt={p.full_name ?? "Corredor"} />}
                  <AvatarFallback>{getInitials(p.full_name)}</AvatarFallback>
                </Avatar>
                <span className="text-sm font-medium text-[#0D1B2A] truncate">
                  {p.full_name ?? "Corredor"}
                </span>
              </div>
            ))}
          </div>
          {hasMore && (
            <button
              onClick={() => setShowAll(!showAll)}
              className="inline-flex items-center gap-1 text-sm font-medium text-primary hover:underline cursor-pointer"
            >
              {showAll ? (
                <>
                  Ver menos
                  <ChevronUp className="h-4 w-4" />
                </>
              ) : (
                <>
                  Ver todos ({count})
                  <ChevronDown className="h-4 w-4" />
                </>
              )}
            </button>
          )}
        </div>
      )}
    </section>
  );
}


export function RsvpCard({ deadlinePassed = false }: { deadlinePassed?: boolean }) {
  const { rsvped, count, isToggling, toggle } = useRsvpContext();

  return (
    <div className="rounded-xl border border-gray-200 bg-gray-50 p-5 space-y-3">
      <div className="flex items-center justify-between">
        <h3 className="font-semibold text-[#0D1B2A]">Vou nessa!</h3>
        {count > 0 && (
          <span className="text-sm text-muted-foreground">
            {count === 1 ? "1 confirmado" : `${count} confirmados`}
          </span>
        )}
      </div>
      <Button
        onClick={toggle}
        disabled={isToggling || deadlinePassed}
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

interface StickyActionBarProps {
  registrationSlug: string;
  deadlinePassed: boolean;
}

export function StickyActionBar({ registrationSlug, deadlinePassed }: StickyActionBarProps) {
  const { rsvped, isToggling, toggle } = useRsvpContext();

  return (
    <div className="fixed bottom-0 inset-x-0 z-50 md:hidden border-t border-gray-200 bg-white/80 backdrop-blur-lg px-4 py-3 pb-[max(0.75rem,env(safe-area-inset-bottom))]">
      <div className="flex gap-3">
        {deadlinePassed ? (
          <Button variant="secondary" disabled className="flex-1">
            Inscrições encerradas
          </Button>
        ) : (
          <Button className="flex-1" asChild>
            <a
              href={`/api/r/${registrationSlug}`}
              target="_blank"
              rel="noopener noreferrer"
            >
              Inscreva-se
              <ExternalLink className="ml-2 h-4 w-4" />
            </a>
          </Button>
        )}
        <Button
          onClick={toggle}
          disabled={isToggling || deadlinePassed}
          variant={rsvped ? "default" : "outline"}
          className="flex-1 cursor-pointer"
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
    </div>
  );
}

interface ExpandableDescriptionProps {
  text: string;
  maxLines?: number;
}

export function ExpandableDescription({ text, maxLines = 4 }: ExpandableDescriptionProps) {
  const [expanded, setExpanded] = useState(false);
  const isLong = text.length > 200;

  const clampClass = maxLines === 3 ? "line-clamp-3" : "line-clamp-4";

  return (
    <div>
      <p className={`text-muted-foreground whitespace-pre-line ${!expanded && isLong ? clampClass : ""}`}>
        {text}
      </p>
      {isLong && (
        <button
          onClick={() => setExpanded(!expanded)}
          className="mt-2 inline-flex items-center gap-1 text-sm font-medium text-primary hover:underline cursor-pointer"
        >
          {expanded ? (
            <>
              Ler menos
              <ChevronUp className="h-4 w-4" />
            </>
          ) : (
            <>
              Ler mais
              <ChevronDown className="h-4 w-4" />
            </>
          )}
        </button>
      )}
    </div>
  );
}

interface ExpandableTextProps {
  text: string;
  maxLength?: number;
}

export function ExpandableText({ text, maxLength = 100 }: ExpandableTextProps) {
  const [expanded, setExpanded] = useState(false);
  const isLong = text.length > maxLength;

  if (!text) return null;

  if (!isLong) return <p className="text-sm">{text}</p>;

  return (
    <div>
      <p className="text-sm">
        {expanded ? text : `${text.slice(0, maxLength).trimEnd()}…`}
      </p>
      <button
        onClick={() => setExpanded(!expanded)}
        className="mt-1 text-xs text-primary hover:underline cursor-pointer font-medium"
      >
        {expanded ? "ver menos" : "ver mais"}
      </button>
    </div>
  );
}
