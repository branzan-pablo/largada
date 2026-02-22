// ============================================================================
// AbacatePay PIX Module
// ============================================================================
// Create PIX QR Codes (copia-e-cola + base64) and check payment status.
// ============================================================================

import type {
    CreatePixQrCodeParams,
    PixQrCodeResponse,
    PixStatusResponse,
    AbacatePayResponse,
} from "@/types/payments";
import { apiPost, apiGet } from "./abacatepay-client";

/**
 * Creates a new PIX QR Code charge.
 *
 * Returns brCode (copia-e-cola string) and brCodeBase64 (QR image).
 * Amount is in centavos. Description max 37 chars.
 */
export async function createPixQrCode(
    params: CreatePixQrCodeParams
): Promise<AbacatePayResponse<PixQrCodeResponse>> {
    return apiPost<PixQrCodeResponse>("/pixQrCode/create", params);
}

/**
 * Checks the payment status of a PIX QR Code charge.
 */
export async function checkPixStatus(
    id: string
): Promise<AbacatePayResponse<PixStatusResponse>> {
    return apiGet<PixStatusResponse>("/pixQrCode/check", { id });
}
