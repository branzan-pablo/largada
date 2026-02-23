// POST /api/races/[id]/promote
// Creates a billing charge to promote a race.
// Only the race creator can promote their own race.

import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { createBilling } from "@/lib/payments/billing";
import { createCustomer } from "@/lib/payments/customer";
import { AbacatePayApiError } from "@/lib/payments/errors";

const PROMOTION_PRICE_CENTAVOS = 2990; // R$ 29,90
const PROMOTION_DAYS = 30;

export async function POST(
    request: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const { id: raceId } = await params;

        // 1. Authenticate user
        const supabase = await createClient();
        const {
            data: { user },
            error: authError,
        } = await supabase.auth.getUser();

        if (authError || !user) {
            return NextResponse.json({ error: "Não autorizado" }, { status: 401 });
        }

        // 2. Fetch race and verify ownership
        const { data: race } = await supabase
            .from("races")
            .select("id, name, slug, created_by, is_promoted")
            .eq("id", raceId)
            .single();

        if (!race) {
            return NextResponse.json({ error: "Corrida não encontrada" }, { status: 404 });
        }

        if (race.created_by !== user.id) {
            return NextResponse.json({ error: "Sem permissão" }, { status: 403 });
        }

        if (race.is_promoted) {
            return NextResponse.json(
                { error: "Esta corrida já está em destaque" },
                { status: 409 }
            );
        }

        // 3. Parse optional customer info from body
        const body = await request.json().catch(() => ({}));
        const customerInput = body.customer as
            | { name: string; email: string; taxId: string; cellphone: string }
            | undefined;

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
        } else if (customerInput?.name && customerInput?.email && customerInput?.taxId && customerInput?.cellphone) {
            const customerResult = await createCustomer(customerInput);
            if (customerResult.error) {
                return NextResponse.json(
                    { error: "Falha ao registrar dados do cliente", details: customerResult.error },
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
        } else {
            return NextResponse.json(
                { error: "Dados do cliente obrigatórios (nome, e-mail, CPF, celular)" },
                { status: 400 }
            );
        }

        // 5. Build URLs
        const appUrl = process.env.NEXT_PUBLIC_APP_URL || "https://largada.app";
        const returnUrl = `${appUrl}/corrida/${race.slug}`;
        const completionUrl = `${appUrl}/corrida/${race.slug}?destaque=sucesso`;

        console.info("[Promote Race] Creating billing", {
            raceId,
            customerId: abacatepayCustomerId,
            returnUrl,
            completionUrl,
        });

        // 6. Create billing on AbacatePay
        const billingResult = await createBilling({
            frequency: "ONE_TIME",
            methods: ["PIX", "CARD"],
            products: [
                {
                    externalId: `race-promotion-${raceId}`,
                    name: `Destaque: ${race.name}`,
                    description: `Corrida em destaque por ${PROMOTION_DAYS} dias`,
                    quantity: 1,
                    price: PROMOTION_PRICE_CENTAVOS,
                },
            ],
            returnUrl,
            completionUrl,
            customerId: abacatepayCustomerId,
            metadata: {
                raceId,
                raceSlug: race.slug,
                orderType: "race_promotion",
            },
        });

        if (billingResult.error) {
            return NextResponse.json(
                { error: "Falha ao criar cobrança", details: billingResult.error },
                { status: 502 }
            );
        }

        const billing = billingResult.data;

        // 7. Persist order in database
        const promotionExpiresAt = new Date(
            Date.now() + PROMOTION_DAYS * 24 * 60 * 60 * 1000
        ).toISOString();

        const { data: order } = await admin
            .from("payment_orders")
            .insert({
                user_id: user.id,
                customer_id: internalCustomerId ?? null,
                abacatepay_id: billing.id,
                payment_url: billing.url,
                payment_method: billing.methods,
                frequency: billing.frequency,
                order_type: "race_promotion",
                status: "PENDING",
                amount: billing.amount,
                description: `Destaque: ${race.name}`,
                products: [
                    {
                        externalId: `race-promotion-${raceId}`,
                        name: `Destaque: ${race.name}`,
                        quantity: 1,
                        price: PROMOTION_PRICE_CENTAVOS,
                    },
                ],
                external_id: raceId,
                expires_at: promotionExpiresAt,
                metadata: { raceId, raceName: race.name, raceSlug: race.slug },
            })
            .select("id")
            .single();

        return NextResponse.json({
            orderId: order?.id ?? null,
            url: billing.url,
        });
    } catch (error) {
        if (error instanceof AbacatePayApiError) {
            console.error("[Promote Race] AbacatePay API error:", {
                status: error.statusCode,
                message: error.message,
                body: error.responseBody,
            });
            return NextResponse.json(
                { error: "Erro no gateway de pagamento", details: error.message },
                { status: error.statusCode >= 500 ? 502 : error.statusCode }
            );
        }
        console.error("[Promote Race] Unexpected error:", error);
        return NextResponse.json({ error: "Erro interno do servidor" }, { status: 500 });
    }
}
