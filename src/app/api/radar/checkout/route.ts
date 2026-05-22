// POST /api/radar/checkout
// Cria uma cobrança AbacatePay para o serviço Radar de Pódio (R$29,90).
// Persiste o formulário do usuário em payment_orders.metadata para
// reconstruir a mensagem do WhatsApp depois que o pagamento for confirmado.

import { NextRequest, NextResponse } from "next/server";
import { z } from "zod/v4";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { createBilling } from "@/lib/payments/billing";
import { createCustomer } from "@/lib/payments/customer";
import { AbacatePayApiError } from "@/lib/payments/errors";

const RADAR_PRICE_CENTAVOS = 2990; // R$ 29,90

const radarFormSchema = z.object({
  pace: z.string().regex(/^\d{2}:\d{2}$/, "Pace inválido"),
  distance: z.string().min(1),
  category: z.string().min(1),
  sex: z.enum(["masculino", "feminino"]),
  city: z.string().min(1),
});

const customerSchema = z.object({
  name: z.string().min(1),
  email: z.email(),
  taxId: z.string().min(11),
  cellphone: z.string().min(8),
});

const checkoutSchema = z.object({
  form: radarFormSchema,
  customer: customerSchema.optional(),
});

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient();
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: "Não autorizado" }, { status: 401 });
    }

    const body = await request.json().catch(() => ({}));
    const parsed = checkoutSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { error: "Dados inválidos", details: parsed.error.issues },
        { status: 400 }
      );
    }
    const { form, customer: customerInput } = parsed.data;

    const admin = createAdminClient();
    let abacatepayCustomerId: string | undefined;

    const { data: existingCustomer } = await admin
      .from("payment_customers")
      .select("id, abacatepay_id")
      .eq("user_id", user.id)
      .single();

    if (existingCustomer) {
      abacatepayCustomerId = existingCustomer.abacatepay_id;
    } else {
      if (!customerInput) {
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
      await admin.from("payment_customers").insert({
        user_id: user.id,
        abacatepay_id: customerResult.data.id,
        email: customerInput.email,
        name: customerInput.name,
        cellphone: customerInput.cellphone,
        tax_id: customerInput.taxId,
      });
    }

    const appUrl = process.env.NEXT_PUBLIC_APP_URL || "https://largada.app";
    const returnUrl = `${appUrl}/radar-de-podio`;
    const completionUrl = `${appUrl}/radar-de-podio?paid=sucesso`;

    const billingResult = await createBilling({
      frequency: "ONE_TIME",
      methods: ["PIX", "CARD"],
      products: [
        {
          externalId: "radar-de-podio",
          name: "Radar de Pódio",
          description: "Curadoria personalizada de corridas",
          quantity: 1,
          price: RADAR_PRICE_CENTAVOS,
        },
      ],
      returnUrl,
      completionUrl,
      customerId: abacatepayCustomerId,
      metadata: {
        orderType: "radar_curation",
      },
    });

    if (billingResult.error) {
      return NextResponse.json(
        { error: "Falha ao criar cobrança", details: billingResult.error },
        { status: 502 }
      );
    }

    const billing = billingResult.data;

    const { data: order, error: orderInsertError } = await admin
      .from("payment_orders")
      .insert({
        user_id: user.id,
        abacatepay_id: billing.id,
        payment_url: billing.url,
        payment_method: billing.methods,
        frequency: billing.frequency,
        order_type: "extra_service",
        status: "PENDING",
        amount: billing.amount,
        description: "Radar de Pódio | Curadoria personalizada",
        products: [
          {
            externalId: "radar-de-podio",
            name: "Radar de Pódio",
            quantity: 1,
            price: RADAR_PRICE_CENTAVOS,
          },
        ],
        metadata: {
          service: "radar_de_podio",
          form,
        },
      })
      .select("id")
      .single();

    if (orderInsertError) {
      console.error("[Radar Checkout] Failed to persist order:", orderInsertError);
    }

    return NextResponse.json({
      orderId: order?.id ?? null,
      billingId: billing.id,
      url: billing.url,
    });
  } catch (error) {
    if (error instanceof AbacatePayApiError) {
      console.error("[Radar Checkout] AbacatePay API error:", {
        status: error.statusCode,
        message: error.message,
        body: error.responseBody,
      });
      return NextResponse.json(
        { error: "Erro no gateway de pagamento", details: error.message },
        { status: error.statusCode >= 500 ? 502 : error.statusCode }
      );
    }
    console.error("[Radar Checkout] Unexpected error:", error);
    return NextResponse.json(
      { error: "Erro interno do servidor" },
      { status: 500 }
    );
  }
}
