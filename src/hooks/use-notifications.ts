"use client";

import { useState, useCallback, useEffect, useRef } from "react";
import { useAuth } from "@/contexts/auth-context";

export function useNotifications() {
  const { user, profile } = useAuth();
  const [permission, setPermission] =
    useState<NotificationPermission>("default");
  const [isRegistering, setIsRegistering] = useState(false);
  const registeredRef = useRef(false);

  useEffect(() => {
    if (typeof window !== "undefined" && "Notification" in window) {
      setPermission(Notification.permission);
    }
  }, []);

  // Auto-register token when user is logged in, has notifications enabled, and permission is granted
  useEffect(() => {
    if (
      !user ||
      !profile?.notifications_enabled ||
      permission !== "granted" ||
      registeredRef.current
    ) {
      return;
    }

    registeredRef.current = true;
    registerToken();
  }, [user, profile?.notifications_enabled, permission]); // eslint-disable-line react-hooks/exhaustive-deps

  const registerToken = useCallback(async () => {
    try {
      const { fetchToken } = await import("@/lib/firebase/client");
      const token = await fetchToken();
      if (!token) return;

      await fetch("/api/notifications/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ token }),
      });
    } catch {
      // Silent fail — notifications are not critical
    }
  }, []);

  const requestPermission = useCallback(async () => {
    if (!("Notification" in window)) return false;

    setIsRegistering(true);
    try {
      const result = await Notification.requestPermission();
      setPermission(result);

      if (result === "granted") {
        await registerToken();
        return true;
      }
      return false;
    } catch {
      return false;
    } finally {
      setIsRegistering(false);
    }
  }, [registerToken]);

  return {
    permission,
    isRegistering,
    isSupported: typeof window !== "undefined" && "Notification" in window,
    requestPermission,
  };
}
