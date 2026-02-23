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
 * Fetches a specific billing by its AbacatePay ID.
 *
 * AbacatePay doesn't offer a /billing/get endpoint, so we list all
 * billings and filter client-side.  Returns null when the billing is
 * not found or the API call fails.
 */
export async function getBillingById(
    billingId: string
): Promise<BillingResponse | null> {
    const result = await listBillings();
    if (result.error || !result.data) return null;
    return result.data.find((b) => b.id === billingId) ?? null;
}

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
