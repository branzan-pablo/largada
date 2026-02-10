"use client";

import { useEffect } from "react";
import { useAuth } from "@/contexts/auth-context";

export function NotificationPrompt() {
  const { user, profile } = useAuth();

  // Only register service worker when user has notifications enabled
  useEffect(() => {
    if (
      !user ||
      !profile?.notifications_enabled ||
      typeof window === "undefined" ||
      !("serviceWorker" in navigator)
    ) {
      return;
    }

    navigator.serviceWorker
      .register("/firebase-messaging-sw.js")
      .catch(() => {
        // Silent fail
      });
  }, [user, profile?.notifications_enabled]);

  return null;
}
