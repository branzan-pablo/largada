"use client";

import { useEffect } from "react";
import { useAuth } from "@/contexts/auth-context";
import { useNotifications } from "@/hooks/use-notifications";

export function NotificationPrompt() {
  const { user, profile } = useAuth();
  const { permission, isSupported } = useNotifications();

  // Register service worker on mount
  useEffect(() => {
    if (!isSupported || !("serviceWorker" in navigator)) return;

    navigator.serviceWorker
      .register("/firebase-messaging-sw.js")
      .catch(() => {
        // Silent fail
      });
  }, [isSupported]);

  // Nothing to render — auto-registration happens in the hook
  // The permission request is triggered from the profile page toggle
  if (!user || !profile || permission !== "granted") return null;

  return null;
}
