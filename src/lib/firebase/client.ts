import { initializeApp, getApps, getApp, type FirebaseApp } from "firebase/app";
import { getMessaging, getToken, isSupported, onMessage } from "firebase/messaging";

const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
};

function getFirebaseApp(): FirebaseApp | null {
  if (!firebaseConfig.projectId) return null;
  return getApps().length === 0 ? initializeApp(firebaseConfig) : getApp();
}

let foregroundListenerRegistered = false;

/**
 * Set up foreground message listener.
 * When the tab is active, FCM delivers messages via onMessage instead of the SW.
 * We use the Notification API directly so the user still sees a popup.
 */
export function setupForegroundMessaging() {
  if (foregroundListenerRegistered) return;

  const app = getFirebaseApp();
  if (!app) return;

  isSupported().then((supported) => {
    if (!supported) return;
    const messaging = getMessaging(app);
    onMessage(messaging, (payload) => {
      const title =
        payload.notification?.title ?? payload.data?.title ?? "Largada";
      const body =
        payload.notification?.body ?? payload.data?.body ?? "";

      if (Notification.permission === "granted") {
        new Notification(title, {
          body,
          icon: "/icons/icon.svg",
          data: payload.data,
        });
      }
    });
    foregroundListenerRegistered = true;
  });
}

export async function getFCMToken(): Promise<string | null> {
  try {
    const app = getFirebaseApp();
    if (!app) return null;

    const supported = await isSupported();
    if (!supported) return null;

    // Register the service worker and wait for it to be ready
    // before requesting the FCM token — Firebase needs an active SW
    const swRegistration = await navigator.serviceWorker.register(
      "/firebase-messaging-sw.js"
    );
    await navigator.serviceWorker.ready;

    const messaging = getMessaging(app);
    const token = await getToken(messaging, {
      vapidKey: process.env.NEXT_PUBLIC_FIREBASE_VAPID_KEY,
      serviceWorkerRegistration: swRegistration,
    });

    return token || null;
  } catch {
    return null;
  }
}
