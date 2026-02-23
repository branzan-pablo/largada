"use client";

import { useEffect } from "react";

const SW_PATH = "/sw.js";
const UPDATE_INTERVAL_MS = 60 * 1000; // check every 60s

export function SwRegister() {
  useEffect(() => {
    if (typeof window === "undefined" || !("serviceWorker" in navigator)) return;

    let updateInterval: ReturnType<typeof setInterval>;

    async function register() {
      try {
        const reg = await navigator.serviceWorker.register(SW_PATH, {
          scope: "/",
        });

        // Periodically check for SW updates
        updateInterval = setInterval(() => {
          reg.update().catch(() => {});
        }, UPDATE_INTERVAL_MS);
      } catch (err) {
        console.error("[SW] registration failed:", err);
      }
    }

    register();

    return () => {
      clearInterval(updateInterval);
    };
  }, []);

  return null;
}
