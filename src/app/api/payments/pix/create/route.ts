// POST /api/payments/pix/create
// Generic PIX creation. Admin only: trusted callers may decide the amount.
// Regular user flows must go through the typed wrappers
// (e.g. /api/races/[id]/promote, /api/subscriptions/create) which derive
// the amount server-side from PROMOTION_TIERS / SUBSCRIPTION_TIERS.

import { NextRequest, NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { requireAdmin } from "@/lib/auth";
import { createPixQrCode } from "@/lib/payments/pix";
import { createPixQrCodeSchema } from "@/types/payments";
import { AbacatePayApiError } from "@/lib/payments/errors";

export async function POST(request: NextRequest) {
    try {
        // 1. Authenticate as admin (regular users use typed wrappers)
        const authResult = await requireAdmin();
        if (authResult instanceof NextResponse) return authResult;
        const { user } = authResult;

        // 2. Validate input
        const body = await request.json();
        const parsed = createPixQrCodeSchema.safeParse(body);

        if (!parsed.success) {
            return NextResponse.json(
                { error: "Dados inválidos", details: parsed.error.issues },
                { status: 400 }
            );
        }

        const input = parsed.data;

        // 3. Create PIX QR Code on AbacatePay
        const pixResult = await createPixQrCode({
            amount: input.amount,
            expiresIn: input.expiresIn,
            description: input.description,
            customer: input.customer,
            metadata: input.metadata,
        });

        if (pixResult.error) {
            return NextResponse.json(
                { error: "Falha ao criar PIX", details: pixResult.error },
                { status: 502 }
            );
        }

        const pix = pixResult.data;

        // 4. Persist order in database
        const admin = createAdminClient();
        const { data: order, error: insertError } = await admin
            .from("payment_orders")
            .insert({
                user_id: user.id,
                abacatepay_id: pix.id,
                payment_method: ["PIX"],
                frequency: "ONE_TIME",
                order_type: input.orderType,
                status: "PENDING",
                amount: pix.amount,
                description: input.description ?? null,
                br_code: pix.brCode,
                br_code_base64: pix.brCodeBase64,
                expires_at: pix.expiresAt,
                metadata: input.metadata ?? {},
            })
            .select("id")
            .single();

        if (insertError) {
            console.error("[Payments] Failed to persist PIX order:", insertError);
        }

        return NextResponse.json({
            orderId: order?.id ?? null,
            pixId: pix.id,
            brCode: pix.brCode,
            brCodeBase64: pix.brCodeBase64,
            amount: pix.amount,
            status: pix.status,
            expiresAt: pix.expiresAt,
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
