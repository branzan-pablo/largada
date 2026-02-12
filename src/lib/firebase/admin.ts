import { initializeApp, getApps, cert, type App } from "firebase-admin/app";
import { getMessaging } from "firebase-admin/messaging";

function formatPrivateKey(key: string | undefined): string | undefined {
  if (!key) return undefined;

  // Handle escaped newlines (common when copying from JSON)
  let formatted = key.replace(/\\n/g, "\n");

  // If still no real newlines (raw single-line paste), fix PEM structure
  if (!formatted.includes("\n")) {
    formatted = formatted
      .replace("-----BEGIN PRIVATE KEY-----", "-----BEGIN PRIVATE KEY-----\n")
      .replace("-----END PRIVATE KEY-----", "\n-----END PRIVATE KEY-----\n");
  }

  return formatted;
}

function getAdminApp(): App {
  if (getApps().length > 0) return getApps()[0];

  return initializeApp({
    credential: cert({
      projectId: process.env.FIREBASE_PROJECT_ID,
      clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
      privateKey: formatPrivateKey(process.env.FIREBASE_PRIVATE_KEY),
    }),
  });
}

export function getAdminMessaging() {
  return getMessaging(getAdminApp());
}
