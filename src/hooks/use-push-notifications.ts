"use client";

import { useState, useEffect, useCallback } from "react";

function urlBase64ToUint8Array(base64String: string): Uint8Array<ArrayBuffer> {
  const padding = "=".repeat((4 - (base64String.length % 4)) % 4);
  const base64 = (base64String + padding)
    .replace(/-/g, "+")
    .replace(/_/g, "/");
  const raw = window.atob(base64);
  const buffer = new ArrayBuffer(raw.length);
  const array = new Uint8Array(buffer);
  for (let i = 0; i < raw.length; i++) array[i] = raw.charCodeAt(i);
  return array;
}

export function usePushNotifications() {
  const [permission, setPermission] =
    useState<NotificationPermission>("default");
  const [isSupported, setIsSupported] = useState(false);
  const [isSubscribed, setIsSubscribed] = useState(false);
  const [isRegistering, setIsRegistering] = useState(false);

  useEffect(() => {
    if (typeof window === "undefined") return;

    const supported =
      "serviceWorker" in navigator &&
      "PushManager" in window &&
      "Notification" in window;
    setIsSupported(supported);
    if (!supported) return;

    setPermission(Notification.permission);

    navigator.serviceWorker.ready.then(async (reg) => {
      const sub = await reg.pushManager.getSubscription();
      setIsSubscribed(!!sub);
    });
  }, []);

  const subscribe = useCallback(async (): Promise<boolean> => {
    if (!isSupported) return false;
    setIsRegistering(true);
    try {
      const perm = await Notification.requestPermission();
      setPermission(perm);
      if (perm !== "granted") return false;

      const reg = await navigator.serviceWorker.ready;

      // Remove stale subscription with a different VAPID key (e.g. leftover from Firebase)
      const existingSub = await reg.pushManager.getSubscription();
      if (existingSub) {
        await existingSub.unsubscribe();
      }

      const sub = await reg.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: urlBase64ToUint8Array(
          process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY!
        ),
      });

      const res = await fetch("/api/push/subscribe", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(sub.toJSON()),
      });

      if (!res.ok) {
        const errBody = await res.json().catch(() => ({}));
        console.error("[usePushNotifications] subscribe server error:", res.status, errBody);
        return false;
      }

      setIsSubscribed(true);
      return true;
    } catch (err) {
      console.error("[usePushNotifications] subscribe failed:", err);
      return false;
    } finally {
      setIsRegistering(false);
    }
  }, [isSupported]);

  /**
   * Re-sync the current browser subscription to the server.
   * Creates a new subscription if the browser's expired.
   * Does NOT unsubscribe first — safe for background calls.
   */
  const syncSubscription = useCallback(async () => {
    if (!isSupported) return;
    try {
      const reg = await navigator.serviceWorker.ready;
      let sub = await reg.pushManager.getSubscription();

      if (!sub && Notification.permission === "granted") {
        sub = await reg.pushManager.subscribe({
          userVisibleOnly: true,
          applicationServerKey: urlBase64ToUint8Array(
            process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY!
          ),
        });
      }

      if (sub) {
        const res = await fetch("/api/push/subscribe", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(sub.toJSON()),
        });
        if (!res.ok) {
          const errBody = await res.json().catch(() => ({}));
          console.error("[usePushNotifications] sync server error:", res.status, errBody);
        } else {
          setIsSubscribed(true);
        }
      }
    } catch (err) {
      console.error("[usePushNotifications] sync failed:", err);
    }
  }, [isSupported]);

  const unsubscribe = useCallback(async () => {
    if (!isSupported) return;
    try {
      const reg = await navigator.serviceWorker.ready;
      const sub = await reg.pushManager.getSubscription();
      if (sub) {
        await sub.unsubscribe();
        await fetch("/api/push/unsubscribe", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ endpoint: sub.endpoint }),
        });
      }
      setIsSubscribed(false);
    } catch (err) {
      console.error("[usePushNotifications] unsubscribe failed:", err);
    }
  }, [isSupported]);

  const requestPermission = useCallback(async (): Promise<boolean> => {
    return subscribe();
  }, [subscribe]);

  return {
    permission,
    isSupported,
    isSubscribed,
    isRegistering,
    subscribe,
    unsubscribe,
    syncSubscription,
    requestPermission,
  };
}
