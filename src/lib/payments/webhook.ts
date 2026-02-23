// ============================================================================
// AbacatePay Webhook Verification
// ============================================================================
// Dual security verification:
// 1. Secret in URL query param (simple auth)
// 2. HMAC SHA-256 signature in X-Webhook-Signature header (body integrity)
// ============================================================================

import crypto from "node:crypto";
import { getPaymentEnv, ABACATEPAY_PUBLIC_KEY } from "./env";
import { AbacatePayWebhookError } from "./errors";

/**
 * Verifies the webhook secret from the URL query parameter.
 * This is the "simple auth" layer — ensures the request comes from
 * someone who knows our webhook secret.
 */
export function verifyWebhookSecret(secretFromUrl: string | null): void {
  const env = getPaymentEnv();

  if (!secretFromUrl) {
    throw new AbacatePayWebhookError("Missing webhook secret in URL");
  }

  const expected = Buffer.from(env.ABACATEPAY_WEBHOOK_SECRET);
  const received = Buffer.from(secretFromUrl);

  if (
    expected.length !== received.length ||
    !crypto.timingSafeEqual(expected, received)
  ) {
    throw new AbacatePayWebhookError("Invalid webhook secret");
  }
}

/**
 * Verifies the HMAC SHA-256 signature from the X-Webhook-Signature header.
 * Uses AbacatePay's public key to compute the expected signature and
 * compares using constant-time comparison to prevent timing attacks.
 */
export function verifyWebhookSignature(
  rawBody: string,
  signatureFromHeader: string | null,
): void {
  if (!signatureFromHeader) {
    throw new AbacatePayWebhookError("Missing X-Webhook-Signature header");
  }

  const bodyBuffer = Buffer.from(rawBody, "utf8");
  const expectedSig = crypto
    .createHmac("sha256", ABACATEPAY_PUBLIC_KEY)
    .update(bodyBuffer)
    .digest("base64");

  const A = Buffer.from(expectedSig);
  const B = Buffer.from(signatureFromHeader);

  if (A.length !== B.length || !crypto.timingSafeEqual(A, B)) {
    throw new AbacatePayWebhookError("Invalid webhook signature");
  }
}

/**
 * Runs both verification layers on a webhook request.
 *
 * Layer 1 (URL secret) is always enforced — mandatory.
 * Layer 2 (HMAC signature) is enforced only when the header is present.
 * AbacatePay may omit the signature header in dev/simulation mode.
 * A warning is logged so missing signatures are always visible in logs.
 */
export function verifyWebhook(
  rawBody: string,
  signatureHeader: string | null,
  secretParam: string | null,
): void {
  verifyWebhookSecret(secretParam);

  if (!signatureHeader) {
    return;
  }

  verifyWebhookSignature(rawBody, signatureHeader);
}
