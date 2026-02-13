import { getApp, getApps, initializeApp } from "firebase/app";
import {
  getMessaging,
  getToken,
  isSupported,
  onMessage,
} from "firebase/messaging";

const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
  measurementId: process.env.NEXT_PUBLIC_FIREBASE_MEASUREMENT_ID,
};

const app = getApps().length === 0 ? initializeApp(firebaseConfig) : getApp();

const messaging = async () => {
  const supported = await isSupported();
  return supported ? getMessaging(app) : null;
};

export const fetchToken = async () => {
  try {
    const fcmMessaging = await messaging();
    if (fcmMessaging) {
      const token = await getToken(fcmMessaging, {
        vapidKey: process.env.NEXT_PUBLIC_FIREBASE_VAPID_KEY,
      });
      return token;
    }
    return null;
  } catch (err) {
    console.error("An error occurred while fetching the token:", err);
    return null;
  }
};

export { app, messaging };

// Legacy exports for backward compatibility with existing code
export async function getFCMToken(): Promise<string | null> {
  return fetchToken();
}

let foregroundListenerRegistered = false;

export function setupForegroundMessaging() {
  if (foregroundListenerRegistered) return;

  messaging().then((m) => {
    if (!m) return;
    onMessage(m, (payload) => {
      const title =
        payload.notification?.title ?? payload.data?.title ?? "Largada";
      const body = payload.notification?.body ?? payload.data?.body ?? "";

      if (Notification.permission === "granted") {
        // Show native notification for foreground messages
        const link =
          payload.fcmOptions?.link || payload.data?.link || payload.data?.url;
        new Notification(title, {
          body,
          icon: "/icons/icon.svg",
          data: link ? { url: link } : undefined,
        });
      }
    });
    foregroundListenerRegistered = true;
  });
}
