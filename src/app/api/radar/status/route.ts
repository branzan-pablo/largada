// GET /api/radar/status?id=<billingId>
// Verifica o status de uma cobrança Radar de Pódio. Sincroniza com AbacatePay
// se ainda PENDING. Retorna form data para reconstruir mensagem do WhatsApp.

import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { getBillingById } from "@/lib/payments/billing";
import { AbacatePayApiError } from "@/lib/payments/errors";
import { utcNow } from "@/lib/date";

export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient();
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: "Não autorizado" }, { status: 401 });
    }

    const billingId = request.nextUrl.searchParams.get("id");
    if (!billingId) {
      return NextResponse.json(
        { error: "Parâmetro 'id' é obrigatório" },
        { status: 400 }
      );
    }

    const { data: order } = await supabase
      .from("payment_orders")
      .select("id, status, metadata")
      .eq("abacatepay_id", billingId)
      .eq("user_id", user.id)
      .single();

    if (!order) {
      return NextResponse.json(
        { error: "Pedido não encontrado" },
        { status: 404 }
      );
    }

    let status = order.status;

    if (status !== "PAID") {
      const billing = await getBillingById(billingId);
      if (billing && billing.status === "PAID") {
        const admin = createAdminClient();
        await admin
          .from("payment_orders")
          .update({
            status: "PAID",
            paid_amount: billing.amount,
            paid_at: utcNow(),
          })
          .eq("id", order.id);
        status = "PAID";
      }
    }

    const meta = (order.metadata ?? {}) as Record<string, unknown>;
    const form = (meta.form ?? null) as Record<string, string> | null;

    return NextResponse.json({
      billingId,
      status,
      form,
    });
  } catch (error) {
    if (error instanceof AbacatePayApiError) {
      console.error("[Radar Status] AbacatePay API error:", error.message);
      return NextResponse.json(
        { error: "Erro no gateway de pagamento", details: error.message },
        { status: error.statusCode >= 500 ? 502 : error.statusCode }
      );
    }
    console.error("[Radar Status] Unexpected error:", error);
    return NextResponse.json(
      { error: "Erro interno do servidor" },
      { status: 500 }
    );
  }
}
