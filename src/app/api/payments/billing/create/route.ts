// POST /api/payments/billing/create
// Generic billing creation. Admin only: trusted callers may decide the products
// and amount. Regular user flows must go through the typed wrappers
// (e.g. /api/races/[id]/promote, /api/subscriptions/create, /api/radar/checkout)
// which derive amount server-side from PROMOTION_TIERS / SUBSCRIPTION_TIERS.

import { NextRequest, NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { requireAdmin } from "@/lib/auth";
import { createBilling } from "@/lib/payments/billing";
import { createCustomer } from "@/lib/payments/customer";
import { createBillingSchema } from "@/types/payments";
import { AbacatePayApiError } from "@/lib/payments/errors";

export async function POST(request: NextRequest) {
    try {
        // 1. Authenticate as admin (regular users use typed wrappers)
        const authResult = await requireAdmin();
        if (authResult instanceof NextResponse) return authResult;
        const { user } = authResult;

        // 2. Validate input
        const body = await request.json();
        const parsed = createBillingSchema.safeParse(body);

        if (!parsed.success) {
            return NextResponse.json(
                { error: "Dados inválidos", details: parsed.error.issues },
                { status: 400 }
            );
        }

        const input = parsed.data;
        const admin = createAdminClient();

        // 3. Resolve or create AbacatePay customer
        let abacatepayCustomerId = input.customerId;

        if (!abacatepayCustomerId) {
            // Check if user already has a payment customer record
            const { data: existingCustomer } = await admin
                .from("payment_customers")
                .select("abacatepay_id")
                .eq("user_id", user.id)
                .single();

            if (existingCustomer) {
                abacatepayCustomerId = existingCustomer.abacatepay_id;
            } else if (input.customer) {
                // Create customer on AbacatePay
                const customerResult = await createCustomer(input.customer);

                if (customerResult.error) {
                    return NextResponse.json(
                        { error: "Falha ao criar cliente", details: customerResult.error },
                        { status: 502 }
                    );
                }

                abacatepayCustomerId = customerResult.data.id;

                // Persist customer mapping
                const { error: customerInsertError } = await admin
                    .from("payment_customers")
                    .insert({
                        user_id: user.id,
                        abacatepay_id: customerResult.data.id,
                        email: input.customer.email,
                        name: input.customer.name,
                        cellphone: input.customer.cellphone,
                        tax_id: input.customer.taxId,
                    });

                if (customerInsertError) {
                    // Log but don't fail — customer was created on AbacatePay
                    console.error("[Payments] Failed to persist customer mapping:", customerInsertError);
                }
            }
        }

        // 4. Create billing on AbacatePay
        const billingResult = await createBilling({
            frequency: input.frequency,
            methods: input.methods,
            products: input.products,
            returnUrl: input.returnUrl,
            completionUrl: input.completionUrl,
            customerId: abacatepayCustomerId,
            allowCoupons: input.allowCoupons,
            coupons: input.coupons,
            externalId: input.externalId,
            metadata: input.metadata,
        });

        if (billingResult.error) {
            return NextResponse.json(
                { error: "Falha ao criar cobrança", details: billingResult.error },
                { status: 502 }
            );
        }

        const billing = billingResult.data;

        console.info("[Payments] Billing created on AbacatePay:", {
            billingId: billing.id,
            status: billing.status,
            devMode: billing.devMode,
            methods: billing.methods,
            amount: billing.amount,
            url: billing.url,
        });

        // 5. Persist order in database
        const { data: order, error: insertError } = await admin
            .from("payment_orders")
            .insert({
                user_id: user.id,
                abacatepay_id: billing.id,
                payment_url: billing.url,
                payment_method: billing.methods,
                frequency: billing.frequency,
                order_type: input.orderType,
                status: "PENDING",
                amount: billing.amount,
                description: input.products.map((p) => p.name).join(", "),
                products: input.products,
                external_id: input.externalId ?? null,
                metadata: input.metadata ?? {},
                allow_coupons: input.allowCoupons ?? false,
            })
            .select("id")
            .single();

        if (insertError) {
            console.error("[Payments] Failed to persist order:", insertError);
            // Still return the billing URL — payment was created on AbacatePay
        }

        return NextResponse.json({
            orderId: order?.id ?? null,
            billingId: billing.id,
            url: billing.url,
            amount: billing.amount,
            status: billing.status,
        });
    } catch (error) {
        if (error instanceof AbacatePayApiError) {
            console.error("[Payments] AbacatePay API error:", error.message);
            return NextResponse.json(
                { error: "Erro no gateway de pagamento", details: error.message },
                { status: error.statusCode >= 500 ? 502 : error.statusCode }
            );
        }

        console.error("[Payments] Unexpected error:", error);
        return NextResponse.json(
            { error: "Erro interno do servidor" },
            { status: 500 }
        );
    }
}
