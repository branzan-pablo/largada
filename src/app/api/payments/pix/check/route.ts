// GET /api/payments/pix/check?id=xxx
// Checks the status of a PIX QR Code payment and updates the local database.

import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { checkPixStatus } from "@/lib/payments/pix";
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

    // 2. Get PIX ID from query params
    const pixId = request.nextUrl.searchParams.get("id");
    if (!pixId) {
      return NextResponse.json(
        { error: "Parâmetro 'id' é obrigatório" },
        { status: 400 },
      );
    }

    // 3. Verify the order belongs to this user
    const { data: order } = await supabase
      .from("payment_orders")
      .select("id, status")
      .eq("abacatepay_id", pixId)
      .eq("user_id", user.id)
      .single();

    if (!order) {
      return NextResponse.json(
        { error: "Pedido não encontrado" },
        { status: 404 },
      );
    }

    // 4. Check status on AbacatePay
    const statusResult = await checkPixStatus(pixId);

    if (statusResult.error) {
      return NextResponse.json(
        { error: "Falha ao verificar status", details: statusResult.error },
        { status: 502 },
      );
    }

    const pixStatus = statusResult.data;

    // 5. Update local status if it changed
    if (pixStatus.status !== order.status) {
      const admin = createAdminClient();
      await admin
        .from("payment_orders")
        .update({
          status: pixStatus.status,
          ...(pixStatus.status === "PAID" ? { paid_at: utcNow() } : {}),
        })
        .eq("id", order.id);
    }

    return NextResponse.json({
      orderId: order.id,
      pixId,
      status: pixStatus.status,
      expiresAt: pixStatus.expiresAt,
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
