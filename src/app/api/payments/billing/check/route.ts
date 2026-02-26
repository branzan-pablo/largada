// GET /api/payments/billing/check?id=xxx
// Checks the status of a billing charge on AbacatePay and updates the local database.
// Equivalent to /api/payments/pix/check but for billing (card) payments.

import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { getBillingById } from "@/lib/payments/billing";
import { AbacatePayApiError } from "@/lib/payments/errors";
import { utcNow } from "@/lib/date";

export async function GET(request: NextRequest) {
  try {
    // 1. Authenticate user
    const supabase = await createClient();
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: "Não autorizado" }, { status: 401 });
    }

    // 2. Get billing ID from query params
    const billingId = request.nextUrl.searchParams.get("id");
    if (!billingId) {
      return NextResponse.json(
        { error: "Parâmetro 'id' é obrigatório" },
        { status: 400 },
      );
    }

    // 3. Verify the order belongs to this user
    const { data: order } = await supabase
      .from("payment_orders")
      .select("id, status, order_type, metadata")
      .eq("abacatepay_id", billingId)
      .eq("user_id", user.id)
      .single();

    if (!order) {
      return NextResponse.json(
        { error: "Pedido não encontrado" },
        { status: 404 },
      );
    }

    // 4. Check status on AbacatePay
    const billing = await getBillingById(billingId);

    if (!billing) {
      console.warn("[Payments] Billing not found on AbacatePay:", billingId);
      return NextResponse.json({
        orderId: order.id,
        billingId,
        status: order.status,
        synced: false,
      });
    }

    // 5. Update local status if it changed
    const remoteStatus = billing.status === "PAID" ? "PAID" : order.status;

    if (remoteStatus !== order.status) {
      const admin = createAdminClient();

      await admin
        .from("payment_orders")
        .update({
          status: remoteStatus,
          ...(remoteStatus === "PAID"
            ? { paid_amount: billing.amount, paid_at: utcNow() }
            : {}),
        })
        .eq("id", order.id);

      // Handle race promotion
      if (remoteStatus === "PAID" && order.order_type === "race_promotion") {
        const meta = order.metadata as Record<string, unknown> | null;
        const raceId = meta?.raceId as string | undefined;
        if (raceId) {
          const promotedUntil = new Date(
            Date.now() + 30 * 24 * 60 * 60 * 1000,
          ).toISOString();
          await admin
            .from("races")
            .update({ is_promoted: true, promoted_until: promotedUntil })
            .eq("id", raceId);
        }
      }
    }

    return NextResponse.json({
      orderId: order.id,
      billingId,
      status: remoteStatus,
      synced: true,
    });
  } catch (error) {
    if (error instanceof AbacatePayApiError) {
      console.error("[Payments] AbacatePay API error:", error.message);
      return NextResponse.json(
        { error: "Erro no gateway de pagamento", details: error.message },
        { status: error.statusCode >= 500 ? 502 : error.statusCode },
      );
    }

    console.error("[Payments] Unexpected error:", error);
    return NextResponse.json(
      { error: "Erro interno do servidor" },
      { status: 500 },
    );
  }
}
