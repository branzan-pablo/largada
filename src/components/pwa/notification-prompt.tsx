"use client";

import { useEffect, useRef } from "react";
import { useAuth } from "@/contexts/auth-context";

export function NotificationPrompt() {
  const { user, profile } = useAuth();
  const registeredRef = useRef(false);

  useEffect(() => {
    if (
      !user ||
      !profile?.notifications_enabled ||
      typeof window === "undefined" ||
      !("serviceWorker" in navigator) ||
      !("Notification" in window) ||
      !process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID ||
      registeredRef.current
    ) {
      return;
    }

    // Already denied — can't ask again
    if (Notification.permission === "denied") return;

    registeredRef.current = true;

    (async () => {
      try {
        // Ask for permission if not yet granted
        let permission = Notification.permission;
        if (permission === "default") {
          permission = await Notification.requestPermission();
        }
        if (permission !== "granted") return;

        const { getFCMToken } = await import("@/lib/firebase/client");
        const token = await getFCMToken();
        if (!token) return;

        await fetch("/api/notifications/register", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ token }),
        });
      } catch {
        // Silent fail
      }
    })();
  }, [user, profile?.notifications_enabled]);

  return null;
}
