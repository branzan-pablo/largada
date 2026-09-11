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

interface ProcessPaymentResult {
  duplicate?: boolean;
  processed?: boolean;
  underpaid?: boolean;
  orderId?: string;
  userId?: string;
  orderType?: string;
}

export async function POST(request: NextRequest) {
  let rawBody: string;
  try {
    rawBody = await request.text();
  } catch {
    return NextResponse.json({ error: "Failed to read request body" }, { status: 400 });
  }

  try {
    // AbacatePay sends both the configured URL secret and an HMAC signature.
    verifyWebhook(
      rawBody,
      request.headers.get("x-webhook-signature"),
      request.nextUrl.searchParams.get("webhookSecret"),
    );
  } catch (error) {
    if (error instanceof AbacatePayWebhookError) {
      return NextResponse.json(
        { error: "Webhook verification failed", detail: error.message },
        { status: 401 },
      );
    }
    return NextResponse.json({ error: "Internal error during verification" }, { status: 500 });
  }

  try {
    const payload = JSON.parse(rawBody) as WebhookPayload;
    const admin = createAdminClient();
    let abacatePayId: string | null = null;
    let paidAmount: number | null = null;
    let billingData: WebhookBillingPaidData | null = null;

    if (payload.event === "billing.paid") {
      const data = payload.data as WebhookBillingPaidData | WebhookPixPaidData;
      if ("billing" in data) {
        billingData = data;
        abacatePayId = data.billing.id;
        paidAmount = data.billing.paidAmount;
      } else if ("pixQrCode" in data) {
        abacatePayId = data.pixQrCode.id;
        paidAmount = data.payment.amount;
      }
    }

    const { data, error } = await admin.rpc("process_payment_event", {
      p_event_id: payload.id,
      p_event_type: payload.event,
      p_raw_payload: payload as unknown as Json,
      p_dev_mode: payload.devMode,
      p_abacatepay_id: abacatePayId,
      p_paid_amount: paidAmount,
    });

    if (error) throw new Error(`Atomic payment processing failed: ${error.message}`);
    const result = (data ?? {}) as ProcessPaymentResult;

    // Customer details are ancillary. The paid order, entitlement and event
    // have already committed atomically before this best-effort cache update.
    const customer = billingData?.billing.customer;
    if (!result.duplicate && result.userId && customer?.id && customer.metadata) {
      const { error: customerError } = await admin.from("payment_customers").upsert(
        {
          user_id: result.userId,
          abacatepay_id: customer.id,
          email: customer.metadata.email,
          name: customer.metadata.name,
          cellphone: customer.metadata.cellphone,
          tax_id: customer.metadata.taxId,
        },
        { onConflict: "user_id" },
      );
      if (customerError) console.error("[Webhook] Customer cache update failed:", customerError);
    }

    return NextResponse.json({
      received: true,
      duplicate: result.duplicate === true,
      underpaid: result.underpaid === true,
    });
  } catch (error) {
    console.error("[Webhook] Processing failed; transaction rolled back:", error);
    return NextResponse.json({ error: "Webhook processing failed" }, { status: 500 });
  }
}
