"use client";

import { useState, useCallback } from "react";
import { toast } from "sonner";

interface UseRsvpOptions {
  raceId: string;
  initialRsvped: boolean;
  initialCount: number;
}

export function useRsvp({ raceId, initialRsvped, initialCount }: UseRsvpOptions) {
  const [rsvped, setRsvped] = useState(initialRsvped);
  const [count, setCount] = useState(initialCount);
  const [isToggling, setIsToggling] = useState(false);

  const toggle = useCallback(async () => {
    if (isToggling) return;

    // Optimistic update
    const prevRsvped = rsvped;
    const prevCount = count;
    setRsvped(!rsvped);
    setCount(rsvped ? count - 1 : count + 1);
    setIsToggling(true);

    try {
      const res = await fetch("/api/rsvp", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ raceId }),
      });

      if (!res.ok) {
        // Rollback
        setRsvped(prevRsvped);
        setCount(prevCount);
        toast.error("Erro ao atualizar presença. Tente novamente.");
      }
    } catch {
      // Rollback
      setRsvped(prevRsvped);
      setCount(prevCount);
      toast.error("Erro ao atualizar presença. Tente novamente.");
    } finally {
      setIsToggling(false);
    }
  }, [raceId, rsvped, count, isToggling]);

  return { rsvped, count, isToggling, toggle };
}
