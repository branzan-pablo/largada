// POST /api/promotions/checkout
// Creates an AbacatePay billing for a single-race promotion (express/standard).
// Race is selected post-payment on the success page.

import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { createBilling } from "@/lib/payments/billing";
import { createCustomer } from "@/lib/payments/customer";
import { AbacatePayApiError } from "@/lib/payments/errors";
import { PROMOTION_TIERS, type PromotionTier } from "@/lib/promotions";

const VALID_TIERS: PromotionTier[] = ["express", "standard"];

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      return NextResponse.json({ error: "Não autorizado" }, { status: 401 });
    }

    const body = await request.json().catch(() => ({}));
    const tier = body.tier as PromotionTier;

    if (!tier || !VALID_TIERS.includes(tier)) {
      return NextResponse.json({ error: "Tier inválido" }, { status: 400 });
    }

    const admin = createAdminClient();
    const config = PROMOTION_TIERS[tier];
    const appUrl = process.env.NEXT_PUBLIC_APP_URL || "https://largada.app";

    let abacatepayCustomerId: string | undefined;
    let internalCustomerId: string | undefined;

    const { data: existingCustomer } = await admin
      .from("payment_customers")
      .select("id, abacatepay_id")
      .eq("user_id", user.id)
      .single();

    if (existingCustomer) {
      abacatepayCustomerId = existingCustomer.abacatepay_id;
      internalCustomerId = existingCustomer.id;
    } else {
      const customerInput = body.customer as
        | { name: string; email: string; taxId: string; cellphone: string }
        | undefined;

      if (!customerInput?.name || !customerInput?.email || !customerInput?.taxId || !customerInput?.cellphone) {
        return NextResponse.json({ error: "customer_required" }, { status: 422 });
      }

      const customerResult = await createCustomer(customerInput);
      if (customerResult.error) {
        return NextResponse.json({ error: "Falha ao registrar dados do cliente" }, { status: 502 });
      }
      abacatepayCustomerId = customerResult.data.id;
      const { data: newCustomer } = await admin
        .from("payment_customers")
        .insert({
          user_id: user.id,
          abacatepay_id: customerResult.data.id,
          email: customerInput.email,
          name: customerInput.name,
          cellphone: customerInput.cellphone,
          tax_id: customerInput.taxId,
        })
        .select("id")
        .single();
      internalCustomerId = newCustomer?.id;
    }

    const billingResult = await createBilling({
      frequency: "ONE_TIME",
      methods: ["PIX"],
      products: [{
        externalId: `promotion-${tier}-${user.id}-${Date.now()}`,
        name: `Destaque ${config.label}`,
        description: `1 corrida em destaque por ${config.durationDays} dias`,
        quantity: 1,
        price: config.priceCentavos,
      }],
      returnUrl: `${appUrl}/para-organizadores`,
      completionUrl: `${appUrl}/checkout/sucesso?tier=${tier}`,
      customerId: abacatepayCustomerId,
      metadata: { tier, userId: user.id, orderType: "promotion_reservation" },
    });

    if (billingResult.error) {
      return NextResponse.json({ error: "Falha ao criar cobrança", details: billingResult.error }, { status: 502 });
    }

    const billing = billingResult.data;

    await admin.from("payment_orders").insert({
      user_id: user.id,
      customer_id: internalCustomerId ?? null,
      abacatepay_id: billing.id,
      payment_url: billing.url,
      payment_method: billing.methods,
      frequency: billing.frequency,
      order_type: "promotion_reservation",
      status: "PENDING",
      amount: billing.amount,
      description: `Destaque ${config.label}`,
      products: [{
        externalId: `promotion-${tier}-${user.id}`,
        name: `Destaque ${config.label}`,
        quantity: 1,
        price: config.priceCentavos,
      }],
      external_id: user.id,
      metadata: { tier, userId: user.id },
    });

    return NextResponse.json({ url: billing.url });
  } catch (error) {
    if (error instanceof AbacatePayApiError) {
      console.error("[Promotions/Checkout] AbacatePay API error", {
        status: error.statusCode,
        message: error.message,
        body: error.responseBody,
      });
      return NextResponse.json(
        { error: "Erro no gateway de pagamento", details: error.message },
        { status: error.statusCode >= 500 ? 502 : error.statusCode }
      );
    }
    console.error("[Promotions/Checkout] Unexpected error:", error);
    return NextResponse.json({ error: "Erro interno do servidor" }, { status: 500 });
  }
}
