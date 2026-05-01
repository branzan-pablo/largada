"use client";

import { useEffect } from "react";

const SESSION_KEY_PREFIX = "raceView:";

export function RaceViewTracker({ raceId }: { raceId: string }) {
  useEffect(() => {
    const key = `${SESSION_KEY_PREFIX}${raceId}`;
    if (typeof window === "undefined") return;
    if (window.sessionStorage.getItem(key)) return;
    window.sessionStorage.setItem(key, "1");

    const controller = new AbortController();
    fetch("/api/views", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ raceId }),
      keepalive: true,
      signal: controller.signal,
    }).catch(() => {
      // Best-effort beacon — ignore failures.
    });

    return () => controller.abort();
  }, [raceId]);

  return null;
}
