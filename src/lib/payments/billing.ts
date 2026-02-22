// ============================================================================
// AbacatePay Billing Module
// ============================================================================
// Create and list billing charges (cobranças).
// Supports ONE_TIME and MULTIPLE_PAYMENTS frequencies.
// ============================================================================

import type {
    CreateBillingParams,
    BillingResponse,
    AbacatePayResponse,
} from "@/types/payments";
import { apiPost, apiGet } from "./abacatepay-client";

/**
 * Creates a new billing charge on AbacatePay.
 *
 * The returned `url` can be used to redirect the customer to the payment page.
 * Methods can be ['PIX'], ['CARD'], or ['PIX', 'CARD'].
 */
export async function createBilling(
    params: CreateBillingParams
): Promise<AbacatePayResponse<BillingResponse>> {
    return apiPost<BillingResponse>("/billing/create", params);
}

/**
 * Lists all billing charges for the authenticated store.
 */
export async function listBillings(): Promise<
    AbacatePayResponse<BillingResponse[]>
> {
    return apiGet<BillingResponse[]>("/billing/list");
}
