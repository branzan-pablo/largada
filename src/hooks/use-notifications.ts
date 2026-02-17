"use client";

import { useState, useCallback, useEffect } from "react";

/**
 * Hook for the profile page notifications toggle.
 * Token auto-registration is handled centrally by NotificationPrompt —
 * this hook only exposes permission state and a requestPermission action.
 */
export function useNotifications() {
  const [permission, setPermission] =
    useState<NotificationPermission>("default");
  const [isRegistering, setIsRegistering] = useState(false);

  useEffect(() => {
    if (typeof window !== "undefined" && "Notification" in window) {
      setPermission(Notification.permission);
    }
  }, []);

  const requestPermission = useCallback(async () => {
    if (!("Notification" in window)) return false;

    setIsRegistering(true);
    try {
      const result = await Notification.requestPermission();
      setPermission(result);
      return result === "granted";
    } catch {
      return false;
    } finally {
      setIsRegistering(false);
    }
  }, []);

  return {
    permission,
    isRegistering,
    isSupported: typeof window !== "undefined" && "Notification" in window,
    requestPermission,
  };
}
