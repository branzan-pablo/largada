"use client";

import { useEffect, useRef } from "react";
import { useAuth } from "@/contexts/auth-context";
import { usePushNotifications } from "@/hooks/use-push-notifications";

function isIOSWithoutStandalone(): boolean {
  if (typeof navigator === "undefined") return false;
  const isIOS = /iPad|iPhone|iPod/.test(navigator.userAgent);
  if (!isIOS) return false;

  const isStandalone =
    window.matchMedia("(display-mode: standalone)").matches ||
    ("standalone" in navigator &&
      (navigator as unknown as { standalone: boolean }).standalone);

  return !isStandalone;
}

export function NotificationPrompt() {
  const { user, profile } = useAuth();
  const { isSupported, syncSubscription } = usePushNotifications();
  const hasAttempted = useRef(false);

  useEffect(() => {
    if (
      !user ||
      !profile?.notifications_enabled ||
      !isSupported ||
      hasAttempted.current
    ) {
      return;
    }

    if (typeof window !== "undefined" && isIOSWithoutStandalone()) {
      return;
    }

    // Only auto-sync if permission was already granted
    if (Notification.permission !== "granted") {
      return;
    }

    hasAttempted.current = true;
    syncSubscription();
  }, [user, profile?.notifications_enabled, isSupported, syncSubscription]);

  return null;
}
