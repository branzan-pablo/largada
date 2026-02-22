// ============================================================================
// AbacatePay Environment Validation
// ============================================================================

import { z } from "zod/v4";

const envSchema = z.object({
    ABACATEPAY_API_KEY: z.string().min(1, "ABACATEPAY_API_KEY is required"),
    ABACATEPAY_WEBHOOK_SECRET: z.string().min(1, "ABACATEPAY_WEBHOOK_SECRET is required"),
});

let validatedEnv: z.infer<typeof envSchema> | null = null;

export function getPaymentEnv() {
    if (validatedEnv) return validatedEnv;

    const result = envSchema.safeParse({
        ABACATEPAY_API_KEY: process.env.ABACATEPAY_API_KEY,
        ABACATEPAY_WEBHOOK_SECRET: process.env.ABACATEPAY_WEBHOOK_SECRET,
    });

    if (!result.success) {
        const errors = z.prettifyError(result.error);
        throw new Error(
            `[AbacatePay] Missing or invalid environment variables:\n${JSON.stringify(errors, null, 2)}`
        );
    }

    validatedEnv = result.data;
    return validatedEnv;
}

// Public key for HMAC verification (from AbacatePay docs)
export const ABACATEPAY_PUBLIC_KEY =
    "t9dXRhHHo3yDEj5pVDYz0frf7q6bMKyMRmxxCPIPp3RCplBfXRxqlC6ZpiWmOqj4L63qEaeUOtrCI8P0VMUgo6iIga2ri9ogaHFs0WIIywSMg0q7RmBfybe1E5XJcfC4IW3alNqym0tXoAKkzvfEjZxV6bE0oG2zJrNNYmUCKZyV0KZ3JS8Votf9EAWWYdiDkMkpbMdPggfh1EqHlVkMiTady6jOR3hyzGEHrIz2Ret0xHKMbiqkr9HS1JhNHDX9";

export const ABACATEPAY_API_BASE_URL = "https://api.abacatepay.com/v1";
