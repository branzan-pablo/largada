// ============================================================================
// AbacatePay HTTP Client
// ============================================================================
// Base HTTP client with automatic auth, retry with exponential backoff,
// timeout, and structured error handling.
// ============================================================================

import type { AbacatePayResponse } from "@/types/payments";
import { AbacatePayApiError, AbacatePayError } from "./errors";
import { getPaymentEnv, ABACATEPAY_API_BASE_URL } from "./env";

const DEFAULT_TIMEOUT_MS = 15_000;
const MAX_RETRIES = 3;
const INITIAL_RETRY_DELAY_MS = 500;

interface RequestOptions {
    timeout?: number;
    retries?: number;
}

function getAuthHeaders(): HeadersInit {
    const env = getPaymentEnv();
    return {
        Authorization: `Bearer ${env.ABACATEPAY_API_KEY}`,
        "Content-Type": "application/json",
    };
}

async function sleep(ms: number): Promise<void> {
    return new Promise((resolve) => setTimeout(resolve, ms));
}

async function fetchWithRetry(
    url: string,
    init: RequestInit,
    options: RequestOptions = {}
): Promise<Response> {
    const maxRetries = options.retries ?? MAX_RETRIES;
    const timeout = options.timeout ?? DEFAULT_TIMEOUT_MS;

    let lastError: Error | null = null;

    for (let attempt = 0; attempt <= maxRetries; attempt++) {
        try {
            const controller = new AbortController();
            const timeoutId = setTimeout(() => controller.abort(), timeout);

            const response = await fetch(url, {
                ...init,
                signal: controller.signal,
            });

            clearTimeout(timeoutId);

            // Don't retry on client errors (4xx), only on server errors (5xx)
            if (!response.ok) {
                const rawBody = await response.text().catch(() => "");
                let parsedBody: unknown;
                try {
                    parsedBody = rawBody ? JSON.parse(rawBody) : undefined;
                } catch {
                    // Non-JSON error body (plain text, HTML, etc.) — keep as string
                    parsedBody = rawBody || undefined;
                }

                if (response.status < 500) {
                    throw new AbacatePayApiError(
                        `AbacatePay API error: ${response.status} ${response.statusText}`,
                        response.status,
                        parsedBody
                    );
                }

                // Server error — retry if we have attempts left
                lastError = new AbacatePayApiError(
                    `AbacatePay server error: ${response.status}`,
                    response.status,
                    parsedBody
                );

                if (attempt < maxRetries) {
                    const delay = INITIAL_RETRY_DELAY_MS * Math.pow(2, attempt);
                    console.warn(
                        `[AbacatePay] Retry ${attempt + 1}/${maxRetries} after ${delay}ms for ${url}`
                    );
                    await sleep(delay);
                    continue;
                }
            }

            return response;
        } catch (error) {
            if (error instanceof AbacatePayApiError && error.statusCode < 500) {
                throw error; // Don't retry client errors
            }

            lastError =
                error instanceof Error
                    ? error
                    : new AbacatePayError("Unknown error", error);

            if (attempt < maxRetries) {
                const delay = INITIAL_RETRY_DELAY_MS * Math.pow(2, attempt);
                console.warn(
                    `[AbacatePay] Retry ${attempt + 1}/${maxRetries} after ${delay}ms for ${url}: ${lastError.message}`
                );
                await sleep(delay);
            }
        }
    }

    throw lastError ?? new AbacatePayError("Request failed after all retries");
}

// --------------------------------------------------------------------------
// Public API
// --------------------------------------------------------------------------

export async function apiGet<T>(
    path: string,
    params?: Record<string, string>,
    options?: RequestOptions
): Promise<AbacatePayResponse<T>> {
    const url = new URL(`${ABACATEPAY_API_BASE_URL}${path}`);
    if (params) {
        Object.entries(params).forEach(([key, value]) =>
            url.searchParams.set(key, value)
        );
    }

    const response = await fetchWithRetry(
        url.toString(),
        { method: "GET", headers: getAuthHeaders() },
        options
    );

    return response.json() as Promise<AbacatePayResponse<T>>;
}

export async function apiPost<T>(
    path: string,
    body: unknown,
    options?: RequestOptions
): Promise<AbacatePayResponse<T>> {
    const response = await fetchWithRetry(
        `${ABACATEPAY_API_BASE_URL}${path}`,
        {
            method: "POST",
            headers: getAuthHeaders(),
            body: JSON.stringify(body),
        },
        options
    );

    return response.json() as Promise<AbacatePayResponse<T>>;
}
