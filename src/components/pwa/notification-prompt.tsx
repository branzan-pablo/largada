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
  const { isSupported, syncSubscription, subscribe } = usePushNotifications();
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

    const permission = Notification.permission;

    if (permission === "granted") {
      syncSubscription().finally(() => {
        hasAttempted.current = true;
      });
    } else if (permission === "default") {
      subscribe().finally(() => {
        hasAttempted.current = true;
      });
    } else {
      // "denied" — nothing can be done
      hasAttempted.current = true;
    }
  }, [user, profile?.notifications_enabled, isSupported, syncSubscription, subscribe]);

  return null;
}
