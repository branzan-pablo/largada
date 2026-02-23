// POST /api/payments/webhook
// Receives webhook events from AbacatePay.
// NO Supabase auth — called by AbacatePay servers.
// Security via HMAC signature + URL secret.
// Idempotent via UNIQUE event_id constraint.

import { NextRequest, NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { verifyWebhook } from "@/lib/payments/webhook";
import { AbacatePayWebhookError } from "@/lib/payments/errors";
import type { Json } from "@/types/database";
import type {
    WebhookPayload,
    WebhookBillingPaidData,
    WebhookPixPaidData,
} from "@/types/payments";

export async function POST(request: NextRequest) {
    let rawBody: string;

    try {
        // 1. Read raw body for HMAC verification
        rawBody = await request.text();
    } catch {
        return NextResponse.json(
            { error: "Failed to read request body" },
            { status: 400 }
        );
    }

    try {
        // 2. Verify webhook security (secret + HMAC)
        const secretParam = request.nextUrl.searchParams.get("webhookSecret");
        const signatureHeader = request.headers.get("x-webhook-signature");

        verifyWebhook(rawBody, signatureHeader, secretParam);
    } catch (error) {
        if (error instanceof AbacatePayWebhookError) {
            console.warn("[Webhook] Verification failed:", error.message);
            return NextResponse.json(
                { error: "Webhook verification failed" },
                { status: 401 }
            );
        }
        return NextResponse.json(
            { error: "Internal error during verification" },
            { status: 500 }
        );
    }

    try {
        // 3. Parse payload
        const payload: WebhookPayload = JSON.parse(rawBody);
        const admin = createAdminClient();

        // 4. Idempotency check — try to insert event
        const { error: insertError } = await admin
            .from("payment_events")
            .insert({
                event_id: payload.id,
                event_type: payload.event,
                raw_payload: payload as unknown as Json,
                dev_mode: payload.devMode,
            });

        if (insertError) {
            // UNIQUE constraint violation = already processed
            if (insertError.code === "23505") {
                console.info("[Webhook] Duplicate event, skipping:", payload.id);
                return NextResponse.json({ received: true, duplicate: true });
            }

            console.error("[Webhook] Failed to insert event:", insertError);
            return NextResponse.json(
                { error: "Failed to persist event" },
                { status: 500 }
            );
        }

        // 5. Process event by type
        let orderId: string | null = null;

        switch (payload.event) {
            case "billing.paid": {
                const data = payload.data as WebhookBillingPaidData | WebhookPixPaidData;

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
                    // Update order status
                    const { data: updatedOrder } = await admin
                        .from("payment_orders")
                        .update({
                            status: "PAID",
                            paid_amount: paidAmount ?? 0,
                            paid_at: new Date().toISOString(),
                        })
                        .eq("abacatepay_id", abacatePayRefId)
                        .select("id, order_type, metadata")
                        .single();

                    orderId = updatedOrder?.id ?? null;

                    // Handle race promotion: mark race as promoted
                    if (updatedOrder?.order_type === "race_promotion") {
                        const meta = updatedOrder.metadata as Record<string, unknown> | null;
                        const raceId = meta?.raceId as string | undefined;
                        if (raceId) {
                            await admin
                                .from("races")
                                .update({ is_promoted: true })
                                .eq("id", raceId);
                            console.info(`[Webhook] Race ${raceId} marked as promoted`);
                        }
                    }
                }
                break;
            }

            case "withdraw.done":
            case "withdraw.failed":
                // Log only — no order to update for withdrawals
                console.info(`[Webhook] ${payload.event}:`, payload.id);
                break;

            default:
                console.warn("[Webhook] Unknown event type:", payload.event);
        }

        // 6. Update event record with order linkage and processed status
        await admin
            .from("payment_events")
            .update({
                order_id: orderId,
                processed: true,
                processed_at: new Date().toISOString(),
            })
            .eq("event_id", payload.id);

        return NextResponse.json({ received: true });
    } catch (error) {
        console.error("[Webhook] Processing error:", error);
        return NextResponse.json(
            { error: "Webhook processing failed" },
            { status: 500 }
        );
    }
}
