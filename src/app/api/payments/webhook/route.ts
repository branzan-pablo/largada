// POST /api/payments/webhook
// Receives webhook events from AbacatePay.
// NO Supabase auth — called by AbacatePay servers.
// Security via HMAC signature + URL secret.
// Idempotent via UNIQUE event_id constraint.

import { NextRequest, NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { verifyWebhook } from "@/lib/payments/webhook";
import { AbacatePayWebhookError } from "@/lib/payments/errors";
import { utcNow, futureUtc } from "@/lib/date";
import type { Json } from "@/types/database";
import type {
  WebhookPayload,
  WebhookBillingPaidData,
  WebhookPixPaidData,
} from "@/types/payments";
import { createSubscription } from "@/lib/subscriptions";
import { SUBSCRIPTION_TIERS, type SubscriptionTier } from "@/types/subscription";

export async function POST(request: NextRequest) {
  let rawBody: string;

  try {
    // 1. Read raw body for HMAC verification
    rawBody = await request.text();
  } catch {
    return NextResponse.json(
      { error: "Failed to read request body" },
      { status: 400 },
    );
  }

  try {
    // 2. Verify webhook security (secret + HMAC)
    // Secret must be in Authorization: Bearer header (query param no longer accepted)
    const authHeader = request.headers.get("authorization");
    const secretParam = authHeader?.startsWith("Bearer ") ? authHeader.slice(7) : null;
    const signatureHeader = request.headers.get("x-webhook-signature");

    console.info("[Webhook] Incoming request —", {
      method: request.method,
      hasSecret: !!secretParam,
      hasSignature: !!signatureHeader,
      contentType: request.headers.get("content-type"),
      bodyLength: rawBody.length,
    });

    verifyWebhook(rawBody, signatureHeader, secretParam);
  } catch (error) {
    if (error instanceof AbacatePayWebhookError) {
      return NextResponse.json(
        { error: "Webhook verification failed", detail: error.message },
        { status: 401 },
      );
    }
    return NextResponse.json(
      { error: "Internal error during verification" },
      { status: 500 },
    );
  }

  try {
    // 3. Parse payload
    const payload: WebhookPayload = JSON.parse(rawBody);
    const admin = createAdminClient();

    // 4. Idempotency check — if event already exists, skip
    const { data: existingEvent } = await admin
      .from("payment_events")
      .select("event_id")
      .eq("event_id", payload.id)
      .maybeSingle();

    if (existingEvent) {
      console.info("[Webhook] Duplicate event, skipping:", payload.id);
      return NextResponse.json({ received: true, duplicate: true });
    }

    // 5. Process event by type
    let orderId: string | null = null;

    switch (payload.event) {
      case "billing.paid": {
        const data = payload.data as
          | WebhookBillingPaidData
          | WebhookPixPaidData;

        // Determine the AbacatePay reference ID
        let abacatePayRefId: string | null = null;
        let paidAmount: number | undefined;

        if ("billing" in data) {
          const billingData = data as WebhookBillingPaidData;
          abacatePayRefId = billingData.billing.id;
          paidAmount = billingData.billing.paidAmount;
        } else if ("pixQrCode" in data) {
          const pixData = data as WebhookPixPaidData;
          abacatePayRefId = pixData.pixQrCode.id;
          paidAmount = pixData.payment.amount;
        }

        if (abacatePayRefId) {
          // Update order status — only transition PENDING → PAID (C3 fix)
          const { data: updatedOrderData, error: orderError } = await admin
            .from("payment_orders")
            .update({
              status: "PAID",
              paid_amount: paidAmount ?? 0,
              paid_at: utcNow(),
            })
            .eq("abacatepay_id", abacatePayRefId)
            .eq("status", "PENDING")
            .select("id, user_id, order_type, metadata, amount")
            .single();

          let updatedOrder = updatedOrderData;

          if (orderError && orderError.code !== "PGRST116") {
            console.error("[Webhook] Failed to update order:", orderError);
          }

          // C4 fix: Validate paid amount against expected order amount
          if (updatedOrder && typeof updatedOrder.amount === "number" && paidAmount !== undefined) {
            if (paidAmount < updatedOrder.amount) {
              console.error("[Webhook] AMOUNT MISMATCH — paid less than expected", {
                orderId: updatedOrder.id,
                expectedAmount: updatedOrder.amount,
                paidAmount,
                difference: updatedOrder.amount - paidAmount,
              });
            }
          }

          // Fallback: if order not found by abacatepay_id, try metadata match
          // Constrained by order_type + status + external_id to avoid race conditions
          if (!updatedOrder) {
            const webhookMeta = payload.data as unknown as Record<string, unknown>;
            const billingMeta = webhookMeta.billing as Record<string, unknown> | undefined;
            const metaRaceId = billingMeta?.metadata
              ? (billingMeta.metadata as Record<string, unknown>)?.raceId as string | undefined
              : undefined;

            if (metaRaceId) {
              const { data: fallbackOrder } = await admin
                .from("payment_orders")
                .update({
                  status: "PAID",
                  paid_amount: paidAmount ?? 0,
                  paid_at: utcNow(),
                })
                .eq("external_id", metaRaceId)
                .eq("order_type", "race_promotion")
                .eq("status", "PENDING")
                .order("created_at", { ascending: false })
                .limit(1)
                .select("id, user_id, order_type, metadata, amount")
                .single();

              if (fallbackOrder) {
                updatedOrder = fallbackOrder;
                console.warn(
                  `[Webhook] Order found via external_id fallback (raceId: ${metaRaceId}), not by abacatepay_id: ${abacatePayRefId}`
                );
              }
            }
          }

          orderId = updatedOrder?.id ?? null;

          // C5 fix: Only proceed with side-effects if order was successfully updated
          if (!updatedOrder) {
            console.warn("[Webhook] No order updated for abacatepay_id:", abacatePayRefId);
            break;
          }

          // Persist payment_customers if user doesn't have one yet
          if (updatedOrder.user_id && "billing" in data) {
            const billingData = data as WebhookBillingPaidData;
            const customer = billingData.billing.customer;
            if (customer?.id && customer?.metadata) {
              const { data: existingPc } = await admin
                .from("payment_customers")
                .select("id")
                .eq("user_id", updatedOrder.user_id)
                .maybeSingle();

              if (!existingPc) {
                const { error: pcError } = await admin
                  .from("payment_customers")
                  .insert({
                    user_id: updatedOrder.user_id,
                    abacatepay_id: customer.id,
                    email: customer.metadata.email,
                    name: customer.metadata.name,
                    cellphone: customer.metadata.cellphone,
                    tax_id: customer.metadata.taxId,
                  });
                if (pcError) {
                  console.error("[Webhook] Failed to create payment_customers:", pcError);
                } else {
                  console.info(
                    `[Webhook] Created payment_customers for user ${updatedOrder.user_id} from billing.paid`,
                  );
                }
              }
            }
          }

          // Handle race promotion: mark race as promoted with expiry
          if (updatedOrder.order_type === "race_promotion") {
            const meta = updatedOrder.metadata as Record<
              string,
              unknown
            > | null;
            const raceId = meta?.raceId as string | undefined;
            if (raceId) {
              const promotedUntil = futureUtc(30);
              const { data: promotedRace, error: raceError } = await admin
                .from("races")
                .update({ is_promoted: true, promoted_until: promotedUntil })
                .eq("id", raceId)
                .eq("created_by", updatedOrder.user_id)
                .select("id")
                .maybeSingle();
              if (raceError) {
                throw new Error(`Failed to promote race ${raceId}: ${raceError.message}`);
              }
              if (!promotedRace) {
                console.error(
                  `[Webhook] Race promotion blocked — user ${updatedOrder.user_id} is not the creator of race ${raceId}`,
                );
              } else {
                console.info(
                  `[Webhook] Race ${raceId} promoted until ${promotedUntil}`,
                );
              }
            }
          }

          // Handle subscription activation
          if (updatedOrder.order_type === "premium_subscription") {
            const meta = updatedOrder.metadata as Record<string, unknown> | null;
            const tier = meta?.tier as SubscriptionTier | undefined;
            const userId = (updatedOrder as { user_id: string }).user_id;

            if (tier && userId && SUBSCRIPTION_TIERS[tier]) {
              try {
                await createSubscription(userId, tier, updatedOrder.id);
                console.info(
                  `[Webhook] Subscription ${tier} activated for user ${userId}`,
                );
              } catch (subError) {
                console.error("[Webhook] Failed to create subscription:", {
                  error: subError,
                  tier,
                  userId,
                  orderId: updatedOrder.id,
                });
                // Don't throw — order is already PAID. Log for manual recovery.
              }
            } else {
              console.error("[Webhook] Missing tier or userId for subscription:", {
                tier,
                userId,
                orderId: updatedOrder.id,
              });
            }
          }
        }
        break;
      }

      case "withdraw.done":
      case "withdraw.failed":
        console.info(`[Webhook] ${payload.event}:`, payload.id);
        break;

      default:
        console.warn("[Webhook] Unknown event type:", payload.event);
    }

    // 6. Persist event after successful processing (idempotency record)
    const { error: insertError } = await admin.from("payment_events").insert({
      event_id: payload.id,
      event_type: payload.event,
      raw_payload: payload as unknown as Json,
      dev_mode: payload.devMode,
      order_id: orderId,
      processed: true,
      processed_at: utcNow(),
    });

    if (insertError) {
      // UNIQUE constraint = concurrent retry already processed it
      if (insertError.code === "23505") {
        return NextResponse.json({ received: true, duplicate: true });
      }
      console.error("[Webhook] Failed to persist event:", insertError);
    }

    return NextResponse.json({ received: true });
  } catch (error) {
    console.error("[Webhook] Processing error:", error);
    return NextResponse.json(
      { error: "Webhook processing failed" },
      { status: 500 },
    );
  }
}
