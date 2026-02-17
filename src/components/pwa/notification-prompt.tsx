"use client";

import { useEffect, useRef, useState } from "react";
import { useAuth } from "@/contexts/auth-context";
import { fetchToken, messaging } from "@/lib/firebase/client";
import { onMessage, type Unsubscribe } from "firebase/messaging";
import { useRouter } from "next/navigation";
import { toast } from "sonner";

async function getNotificationPermissionAndToken() {
  if (!("Notification" in window)) {
    console.info("This browser does not support desktop notification");
    return null;
  }

  if (Notification.permission === "granted") {
    return await fetchToken();
  }

  if (Notification.permission !== "denied") {
    const permission = await Notification.requestPermission();
    if (permission === "granted") {
      return await fetchToken();
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
  const registeredRef = useRef(false);

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
    if (!token || !user || registeredRef.current) return;

    (async () => {
      try {
        const res = await fetch("/api/notifications/register", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ token }),
        });
        if (!res.ok) {
          console.error("[NotificationPrompt] Token register failed:", await res.text());
          return;
        }
        registeredRef.current = true;
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

        // Also show native notification
        const n = new Notification(
          payload.notification?.title || "Largada",
          {
            body: payload.notification?.body || "",
            icon: "/icons/icon.svg",
            data: link ? { url: link } : undefined,
          }
        );

        n.onclick = (event) => {
          event.preventDefault();
          const clickUrl = (event.target as unknown as { data?: { url?: string } })?.data?.url;
          if (clickUrl) {
            router.push(clickUrl);
          }
        };
      });
    };

    setupListener();

    return () => unsubscribe?.();
  }, [token, router]);

  return null;
}