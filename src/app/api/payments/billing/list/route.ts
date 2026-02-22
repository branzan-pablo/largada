// GET /api/payments/billing/list
// Lists payment orders for the authenticated user from the local database.

import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export async function GET() {
    try {
        // 1. Authenticate user
        const supabase = await createClient();
        const {
            data: { user },
            error: authError,
        } = await supabase.auth.getUser();

        if (authError || !user) {
            return NextResponse.json(
                { error: "Não autorizado" },
                { status: 401 }
            );
        }

        // 2. Fetch orders from local database (RLS enforces user_id filter)
        const { data: orders, error: queryError } = await supabase
            .from("payment_orders")
            .select("*")
            .order("created_at", { ascending: false });

        if (queryError) {
            console.error("[Payments] Failed to list orders:", queryError);
            return NextResponse.json(
                { error: "Falha ao buscar cobranças" },
                { status: 500 }
            );
        }

        return NextResponse.json({ data: orders });
    } catch (error) {
        console.error("[Payments] Unexpected error:", error);
        return NextResponse.json(
            { error: "Erro interno do servidor" },
            { status: 500 }
        );
    }
}
