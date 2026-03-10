// POST /api/races/[id]/promote
// Creates a billing charge to promote a race.
// Only the race creator can promote their own race.

import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { createBilling } from "@/lib/payments/billing";
import { createCustomer } from "@/lib/payments/customer";
import { AbacatePayApiError } from "@/lib/payments/errors";
import {
    getActiveSubscription,
    canPromoteWithSubscription,
    useSubscriptionPromotion,
} from "@/lib/subscriptions";
import { futureUtc } from "@/lib/date";

const PROMOTION_PRICE_CENTAVOS = 14900; // R$ 149,00
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

        // 3. Check for subscription-based promotion
        const body = await request.json().catch(() => ({}));

        if (body.useSubscription) {
            const subscription = await getActiveSubscription(user.id);
            if (!subscription) {
                return NextResponse.json(
                    { error: "Nenhum plano ativo encontrado" },
                    { status: 404 }
                );
            }
            if (!canPromoteWithSubscription(subscription)) {
                return NextResponse.json(
                    { error: "Limite de destaques do plano atingido" },
                    { status: 403 }
                );
            }

            const used = await useSubscriptionPromotion(subscription.id, raceId);
            if (!used) {
                return NextResponse.json(
                    { error: "Não foi possível usar crédito do plano" },
                    { status: 409 }
                );
            }

            const admin = createAdminClient();
            const promotedUntil = futureUtc(PROMOTION_DAYS);
            const { error: raceError } = await admin
                .from("races")
                .update({ is_promoted: true, promoted_until: promotedUntil })
                .eq("id", raceId);

            if (raceError) {
                throw new Error(`Failed to promote race ${raceId}: ${raceError.message}`);
            }

            console.info(`[Promote Race] Race ${raceId} promoted via subscription ${subscription.tier}`);

            return NextResponse.json({
                promoted: true,
                source: "subscription",
                promotedUntil,
            });
        }

        // 4. Parse optional customer info from body (one-time payment flow)
        const customerInput = body.customer as
            | { name: string; email: string; taxId: string; cellphone: string }
            | undefined;

        const admin = createAdminClient();

        // 4. Resolve or create AbacatePay customer
        let abacatepayCustomerId: string | undefined;

        const { data: existingCustomer } = await admin
            .from("payment_customers")
            .select("id, abacatepay_id")
            .eq("user_id", user.id)
            .single();

        if (existingCustomer) {
            abacatepayCustomerId = existingCustomer.abacatepay_id;
        } else if (customerInput?.name && customerInput?.email && customerInput?.taxId && customerInput?.cellphone) {
            const customerResult = await createCustomer(customerInput);
            if (customerResult.error) {
                return NextResponse.json(
                    { error: "Falha ao registrar dados do cliente", details: customerResult.error },
                    { status: 502 }
                );
            }
            abacatepayCustomerId = customerResult.data.id;
            await admin
                .from("payment_customers")
                .insert({
                    user_id: user.id,
                    abacatepay_id: customerResult.data.id,
                    email: customerInput.email,
                    name: customerInput.name,
                    cellphone: customerInput.cellphone,
                    tax_id: customerInput.taxId,
                });
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

        console.info("[Promote Race] Billing created on AbacatePay:", {
            billingId: billing.id,
            status: billing.status,
            devMode: billing.devMode,
            methods: billing.methods,
            amount: billing.amount,
            url: billing.url,
        });

        // 7. Persist order in database
        const promotionExpiresAt = futureUtc(PROMOTION_DAYS);

        const { data: order, error: orderInsertError } = await admin
            .from("payment_orders")
            .insert({
                user_id: user.id,
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

        if (orderInsertError) {
            console.error("[Promote Race] Failed to persist order:", orderInsertError);
            // Still return billing URL — payment was created on AbacatePay
        }

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
