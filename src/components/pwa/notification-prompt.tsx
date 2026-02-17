"use client";

import { useEffect, useRef, useState } from "react";
import { useAuth } from "@/contexts/auth-context";
import { fetchToken, messaging } from "@/lib/firebase/client";
import { onMessage, type Unsubscribe } from "firebase/messaging";
import { useRouter } from "next/navigation";
import { toast } from "sonner";

async function ensureServiceWorker(): Promise<ServiceWorkerRegistration | null> {
  if (!("serviceWorker" in navigator)) return null;

  try {
    // Register (or update) the SW
    await navigator.serviceWorker.register("/firebase-messaging-sw.js", {
      scope: "/",
    });
    // Wait until a SW controls this page
    const registration = await navigator.serviceWorker.ready;
    return registration;
  } catch (error) {
    console.error("[NotificationPrompt] SW registration failed:", error);
    return null;
  }
}

function isIOSWithoutStandalone(): boolean {
  const isIOS = /iPad|iPhone|iPod/.test(navigator.userAgent);
  if (!isIOS) return false;

  const isStandalone =
    window.matchMedia("(display-mode: standalone)").matches ||
    ("standalone" in navigator && (navigator as unknown as { standalone: boolean }).standalone);

  return !isStandalone;
}

async function getNotificationPermissionAndToken() {
  if (!("Notification" in window)) {
    console.info("This browser does not support desktop notification");
    return null;
  }

  // iOS Safari only supports Web Push when installed as PWA (iOS 16.4+)
  if (isIOSWithoutStandalone()) {
    console.info("[NotificationPrompt] iOS detected without standalone mode — push not available");
    return null;
  }

  // Ensure SW is registered and controlling the page before requesting token
  const registration = await ensureServiceWorker();
  if (!registration) {
    console.error("[NotificationPrompt] No active SW registration — cannot get FCM token");
    return null;
  }

  if (Notification.permission === "granted") {
    return await fetchToken(registration);
  }

  if (Notification.permission !== "denied") {
    const permission = await Notification.requestPermission();
    if (permission === "granted") {
      return await fetchToken(registration);
    }
  }

  console.log("Notification permission not granted.");
  return null;
}

export function NotificationPrompt() {
  const { user, profile } = useAuth();
  const router = useRouter();
  const [token, setToken] = useState<string | null>(null);
  const retryLoadToken = useRef(0);
  const isLoading = useRef(false);

  const loadToken = async () => {
    if (isLoading.current) return;

    isLoading.current = true;
    const fcmToken = await getNotificationPermissionAndToken();

    if (Notification.permission === "denied") {
      console.info("Push Notifications permission denied");
      isLoading.current = false;
      return;
    }

    if (!fcmToken) {
      if (retryLoadToken.current >= 3) {
        console.info("Unable to load FCM token after 3 retries");
        isLoading.current = false;
        return;
      }

      retryLoadToken.current += 1;
      console.error("An error occurred while retrieving token. Retrying...");
      isLoading.current = false;
      // Delay before retry to allow recovery
      await new Promise((r) => setTimeout(r, 2000));
      await loadToken();
      return;
    }

    setToken(fcmToken);
    isLoading.current = false;
  };

  // Load token when user is logged in and has notifications enabled
  useEffect(() => {
    if (
      !user ||
      !profile?.notifications_enabled ||
      typeof window === "undefined" ||
      !("Notification" in window) ||
      !process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID
    ) {
      return;
    }

    loadToken();
  }, [user, profile?.notifications_enabled]); // eslint-disable-line react-hooks/exhaustive-deps

  // Register token with backend when token is available
  useEffect(() => {
    if (!token || !user) return;

    // Skip if already registered this session
    if (sessionStorage.getItem("fcm_registered") === token) return;

    (async () => {
      try {
        // Delete previous token from this device to prevent duplicate notifications
        const previousToken = localStorage.getItem("fcm_token");
        if (previousToken && previousToken !== token) {
          await fetch("/api/notifications/register", {
            method: "DELETE",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ token: previousToken }),
          }).catch(() => {});
        }

        const res = await fetch("/api/notifications/register", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ token }),
        });
        if (!res.ok) {
          console.error("[NotificationPrompt] Token register failed:", await res.text());
          return;
        }
        localStorage.setItem("fcm_token", token);
        sessionStorage.setItem("fcm_registered", token);
      } catch (error) {
        console.error("[NotificationPrompt] Token register error:", error);
      }
    })();
  }, [token, user]);

  // Set up foreground message listener
  useEffect(() => {
    if (!token) return;

    let unsubscribe: Unsubscribe | null = null;

    const setupListener = async () => {
      const m = await messaging();
      if (!m) return;

      unsubscribe = onMessage(m, (payload) => {
        if (Notification.permission !== "granted") return;

        console.log("Foreground push notification received:", payload);
        const link = payload.fcmOptions?.link || payload.data?.link || payload.data?.url;

        if (link) {
          toast.info(
            `${payload.notification?.title}: ${payload.notification?.body}`,
            {
              action: {
                label: "Ver",
                onClick: () => {
                  if (link) {
                    router.push(link);
                  }
                },
              },
            }
          );
        } else {
          toast.info(
            `${payload.notification?.title}: ${payload.notification?.body}`
          );
        }
      });
    };

    setupListener();

    return () => unsubscribe?.();
  }, [token, router]);

  return null;
}
