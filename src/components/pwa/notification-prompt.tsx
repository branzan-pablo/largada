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
      Notification.permission !== "granted" ||
      !process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID ||
      registeredRef.current
    ) {
      return;
    }

    registeredRef.current = true;

    // Register service worker
    navigator.serviceWorker
      .register("/firebase-messaging-sw.js")
      .catch(() => {});

    // Register FCM token
    (async () => {
      try {
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
