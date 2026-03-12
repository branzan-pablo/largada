// POST /api/subscriptions/create
// Creates a billing charge for an organizer subscription package.
// If user has no payment_customers record, requires customer data (returns 422 if missing).

import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { createBilling } from "@/lib/payments/billing";
import { createCustomer } from "@/lib/payments/customer";
import { AbacatePayApiError } from "@/lib/payments/errors";
import { getActiveSubscription } from "@/lib/subscriptions";
import {
  SUBSCRIPTION_TIERS,
  type SubscriptionTier,
} from "@/types/subscription";

const VALID_TIERS: SubscriptionTier[] = ["organizador", "organizador_pro"];

export async function POST(request: NextRequest) {
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

    // 2. Parse and validate body
    const body = await request.json().catch(() => ({}));
    const tier = body.tier as SubscriptionTier;

    if (!tier || !VALID_TIERS.includes(tier)) {
      return NextResponse.json(
        { error: "Tier inválido. Use 'organizador' ou 'organizador_pro'" },
        { status: 400 }
      );
    }

    // 3. Check if user already has active subscription
    const existing = await getActiveSubscription(user.id);
    if (existing) {
      return NextResponse.json(
        {
          error: "Você já possui um plano ativo",
          subscription: {
            tier: existing.tier,
            promotions_used: existing.promotions_used,
            promotions_limit: existing.promotions_limit,
            current_period_end: existing.current_period_end,
          },
        },
        { status: 409 }
      );
    }

    const admin = createAdminClient();

    // 4. Resolve or create AbacatePay customer
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
      // No existing customer — need customer data from client
      const customerInput = body.customer as
        | { name: string; email: string; taxId: string; cellphone: string }
        | undefined;

      if (
        !customerInput?.name ||
        !customerInput?.email ||
        !customerInput?.taxId ||
        !customerInput?.cellphone
      ) {
        return NextResponse.json(
          { error: "customer_required" },
          { status: 422 }
        );
      }

      const customerResult = await createCustomer(customerInput);
      if (customerResult.error) {
        return NextResponse.json(
          {
            error: "Falha ao registrar dados do cliente",
            details: customerResult.error,
          },
          { status: 502 }
        );
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

    // 5. Build URLs
    const config = SUBSCRIPTION_TIERS[tier];
    const appUrl =
      process.env.NEXT_PUBLIC_APP_URL || "https://largada.app";
    const returnUrl = `${appUrl}/perfil/assinatura`;
    const completionUrl = `${appUrl}/perfil/assinatura?sucesso=true`;

    console.info("[Subscription] Creating billing", {
      userId: user.id,
      tier,
      price: config.priceInCentavos,
      customerId: abacatepayCustomerId,
    });

    // 6. Create billing on AbacatePay (ONE_TIME — no auto-charge)
    const billingResult = await createBilling({
      frequency: "ONE_TIME",
      methods: ["PIX", "CARD"],
      products: [
        {
          externalId: `subscription-${tier}-${user.id}`,
          name: `Plano ${config.label}`,
          description: `${config.promotionsPerMonth} corridas em destaque por 30 dias`,
          quantity: 1,
          price: config.priceInCentavos,
        },
      ],
      returnUrl,
      completionUrl,
      customerId: abacatepayCustomerId,
      metadata: {
        tier,
        userId: user.id,
        orderType: "premium_subscription",
      },
    });

    if (billingResult.error) {
      return NextResponse.json(
        { error: "Falha ao criar cobrança", details: billingResult.error },
        { status: 502 }
      );
    }

    const billing = billingResult.data;

    console.info("[Subscription] Billing created:", {
      billingId: billing.id,
      amount: billing.amount,
      url: billing.url,
    });

    // 7. Persist order
    const { data: order } = await admin
      .from("payment_orders")
      .insert({
        user_id: user.id,
        customer_id: internalCustomerId ?? null,
        abacatepay_id: billing.id,
        payment_url: billing.url,
        payment_method: billing.methods,
        frequency: billing.frequency,
        order_type: "premium_subscription",
        status: "PENDING",
        amount: billing.amount,
        description: `Plano ${config.label}`,
        products: [
          {
            externalId: `subscription-${tier}-${user.id}`,
            name: `Plano ${config.label}`,
            quantity: 1,
            price: config.priceInCentavos,
          },
        ],
        external_id: user.id,
        metadata: { tier, userId: user.id },
      })
      .select("id")
      .single();

    return NextResponse.json({
      orderId: order?.id ?? null,
      url: billing.url,
    });
  } catch (error) {
    if (error instanceof AbacatePayApiError) {
      console.error("[Subscription] AbacatePay API error:", {
        status: error.statusCode,
        message: error.message,
        body: error.responseBody,
      });
      return NextResponse.json(
        { error: "Erro no gateway de pagamento", details: error.message },
        { status: error.statusCode >= 500 ? 502 : error.statusCode }
      );
    }
    console.error("[Subscription] Unexpected error:", error);
    return NextResponse.json(
      { error: "Erro interno do servidor" },
      { status: 500 }
    );
  }
}
