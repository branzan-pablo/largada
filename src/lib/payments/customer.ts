// ============================================================================
// AbacatePay Customer Module
// ============================================================================

import type {
    CreateCustomerParams,
    AbacatePayCustomer,
    AbacatePayResponse,
} from "@/types/payments";
import { apiPost, apiGet } from "./abacatepay-client";

/**
 * Creates a new customer on AbacatePay.
 */
export async function createCustomer(
    params: CreateCustomerParams
): Promise<AbacatePayResponse<AbacatePayCustomer>> {
    return apiPost<AbacatePayCustomer>("/customer/create", params);
}

/**
 * Lists all customers for the authenticated store.
 */
export async function listCustomers(): Promise<
    AbacatePayResponse<AbacatePayCustomer[]>
> {
    return apiGet<AbacatePayCustomer[]>("/customer/list");
}
