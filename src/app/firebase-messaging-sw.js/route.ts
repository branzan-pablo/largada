import { NextResponse } from "next/server";

export async function GET() {
  const firebaseConfig = {
    apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY ?? "",
    authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN ?? "",
    projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID ?? "",
    messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID ?? "",
    appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID ?? "",
  };

  const js = `
importScripts("https://www.gstatic.com/firebasejs/12.9.0/firebase-app-compat.js");
importScripts("https://www.gstatic.com/firebasejs/12.9.0/firebase-messaging-compat.js");

const firebaseConfig = ${JSON.stringify(firebaseConfig)};

if (firebaseConfig.projectId) {
  firebase.initializeApp(firebaseConfig);

  const messaging = firebase.messaging();

  // We only receive data-only messages (no "notification" key)
  // so onBackgroundMessage always fires and we control the display.
  messaging.onBackgroundMessage((payload) => {
    const title = payload.data?.title ?? "Largada";
    const body  = payload.data?.body  ?? "";
    const icon  = payload.data?.icon  ?? "/icons/icon.svg";

    self.registration.showNotification(title, {
      body,
      icon,
      data: payload.data,
    });
  });
}

self.addEventListener("notificationclick", (event) => {
  event.notification.close();
  const url = event.notification.data?.url ?? "/corridas";
  event.waitUntil(clients.openWindow(url));
});
`.trim();

  return new NextResponse(js, {
    headers: {
      "Content-Type": "application/javascript",
      "Cache-Control": "public, max-age=3600, s-maxage=86400",
      "Service-Worker-Allowed": "/",
    },
  });
}
