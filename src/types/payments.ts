// ============================================================================
// AbacatePay Payment Types — Largada
// ============================================================================
// Complete type definitions for the AbacatePay API surface + internal models.
// All monetary values are in centavos (R$10.00 = 1000).
// ============================================================================

import { z } from "zod/v4";

// --------------------------------------------------------------------------
// Enums
// --------------------------------------------------------------------------
export const PaymentMethod = {
    PIX: "PIX",
    CARD: "CARD",
} as const;
export type PaymentMethod = (typeof PaymentMethod)[keyof typeof PaymentMethod];

export const BillingFrequency = {
    ONE_TIME: "ONE_TIME",
    MULTIPLE_PAYMENTS: "MULTIPLE_PAYMENTS",
} as const;
export type BillingFrequency =
    (typeof BillingFrequency)[keyof typeof BillingFrequency];

export const PaymentStatus = {
    PENDING: "PENDING",
    PAID: "PAID",
    EXPIRED: "EXPIRED",
    CANCELLED: "CANCELLED",
    REFUNDED: "REFUNDED",
    FAILED: "FAILED",
} as const;
export type PaymentStatus =
    (typeof PaymentStatus)[keyof typeof PaymentStatus];

export const OrderType = {
    RACE_PROMOTION: "race_promotion",
    PREMIUM_SUBSCRIPTION: "premium_subscription",
    RACE_REGISTRATION: "race_registration",
    EXTRA_SERVICE: "extra_service",
    OTHER: "other",
} as const;
export type OrderType = (typeof OrderType)[keyof typeof OrderType];

export const WebhookEventType = {
    BILLING_PAID: "billing.paid",
    WITHDRAW_DONE: "withdraw.done",
    WITHDRAW_FAILED: "withdraw.failed",
} as const;
export type WebhookEventType =
    (typeof WebhookEventType)[keyof typeof WebhookEventType];

// --------------------------------------------------------------------------
// AbacatePay API — Standard Response Wrapper
// --------------------------------------------------------------------------
export interface AbacatePayResponse<T> {
    data: T;
    error: string | null;
}

// --------------------------------------------------------------------------
// AbacatePay API — Customer
// --------------------------------------------------------------------------
export interface AbacatePayCustomer {
    id: string;
    metadata: {
        name: string;
        cellphone: string;
        email: string;
        taxId: string;
    };
}

export interface CreateCustomerParams {
    name: string;
    cellphone: string;
    email: string;
    taxId: string;
}

// --------------------------------------------------------------------------
// AbacatePay API — Product (for billing)
// --------------------------------------------------------------------------
export interface BillingProduct {
    externalId: string;
    name: string;
    description?: string;
    quantity: number;
    price: number; // centavos
}

export interface BillingProductResponse {
    id: string;
    externalId: string;
    quantity: number;
}

// --------------------------------------------------------------------------
// AbacatePay API — Billing
// --------------------------------------------------------------------------
export interface CreateBillingParams {
    frequency: BillingFrequency;
    methods: PaymentMethod[];
    products: BillingProduct[];
    returnUrl: string;
    completionUrl: string;
    customerId?: string;
    customer?: CreateCustomerParams;
    allowCoupons?: boolean;
    coupons?: string[];
    externalId?: string;
    metadata?: Record<string, string>;
}

export interface BillingResponse {
    id: string;
    url: string;
    status: string;
    devMode: boolean;
    methods: PaymentMethod[];
    products: BillingProductResponse[];
    frequency: BillingFrequency;
    amount: number; // centavos
    nextBilling: string | null;
    customer: AbacatePayCustomer;
    allowCoupons: boolean;
    coupons: string[];
}

// --------------------------------------------------------------------------
// AbacatePay API — PIX QR Code
// --------------------------------------------------------------------------
export interface CreatePixQrCodeParams {
    amount: number; // centavos
    expiresIn?: number; // seconds
    description?: string; // max 37 chars
    customer?: CreateCustomerParams;
    metadata?: Record<string, string>;
}

export interface PixQrCodeResponse {
    id: string;
    amount: number;
    status: string;
    devMode: boolean;
    brCode: string;
    brCodeBase64: string;
    platformFee: number;
    createdAt: string;
    updatedAt: string;
    expiresAt: string;
}

export interface PixStatusResponse {
    status: string;
    expiresAt: string;
}

// --------------------------------------------------------------------------
// AbacatePay API — Webhook Payloads
// --------------------------------------------------------------------------
export interface WebhookPayload {
    id: string; // "log_xxx" — used for idempotency
    event: string;
    devMode: boolean;
    data: WebhookBillingPaidData | WebhookPixPaidData | WebhookWithdrawData;
}

export interface WebhookPaymentInfo {
    amount: number;
    fee: number;
    method: string;
}

export interface WebhookBillingPaidData {
    payment: WebhookPaymentInfo;
    billing: {
        id: string;
        amount: number;
        paidAmount: number;
        status: string;
        frequency: string;
        kind: string[];
        customer: AbacatePayCustomer;
        products: BillingProductResponse[];
        couponsUsed: string[];
    };
}

export interface WebhookPixPaidData {
    payment: WebhookPaymentInfo;
    pixQrCode: {
        id: string;
        amount: number;
        kind: string;
        status: string;
    };
}

export interface WebhookWithdrawData {
    transaction: {
        id: string;
        status: string;
        devMode: boolean;
        receiptUrl: string;
        kind: string;
        amount: number;
        platformFee: number;
        externalId: string;
        createdAt: string;
        updatedAt: string;
    };
}

// --------------------------------------------------------------------------
// Internal Types — Database Models
// --------------------------------------------------------------------------
export interface PaymentCustomerRecord {
    id: string;
    user_id: string;
    abacatepay_id: string;
    email: string | null;
    name: string | null;
    cellphone: string | null;
    tax_id: string | null;
    metadata: Record<string, unknown>;
    created_at: string;
    updated_at: string;
}

export interface PaymentOrderRecord {
    id: string;
    user_id: string;
    customer_id: string | null;
    abacatepay_id: string | null;
    payment_url: string | null;
    payment_method: PaymentMethod[];
    frequency: BillingFrequency;
    order_type: OrderType;
    status: PaymentStatus;
    amount: number;
    paid_amount: number;
    currency: string;
    description: string | null;
    products: Record<string, unknown>[];
    external_id: string | null;
    metadata: Record<string, unknown>;
    br_code: string | null;
    br_code_base64: string | null;
    allow_coupons: boolean;
    coupons_used: string[];
    paid_at: string | null;
    expires_at: string | null;
    created_at: string;
    updated_at: string;
}

export interface PaymentEventRecord {
    id: string;
    event_id: string;
    event_type: string;
    order_id: string | null;
    raw_payload: Record<string, unknown>;
    dev_mode: boolean;
    processed: boolean;
    processed_at: string | null;
    error_message: string | null;
    created_at: string;
}

// --------------------------------------------------------------------------
// Zod Schemas — API Route Input Validation
// --------------------------------------------------------------------------
const productSchema = z.object({
    externalId: z.string().min(1),
    name: z.string().min(1),
    description: z.string().optional(),
    quantity: z.number().int().min(1),
    price: z.number().int().min(1), // centavos, must be > 0
});

const customerSchema = z.object({
    name: z.string().min(1),
    cellphone: z.string().min(1),
    email: z.email(),
    taxId: z.string().min(11).max(18),
});

export const createBillingSchema = z.object({
    frequency: z.enum(["ONE_TIME", "MULTIPLE_PAYMENTS"]),
    methods: z
        .array(z.enum(["PIX", "CARD"]))
        .min(1)
        .max(2),
    products: z.array(productSchema).min(1),
    returnUrl: z.url(),
    completionUrl: z.url(),
    customerId: z.string().optional(),
    customer: customerSchema.optional(),
    allowCoupons: z.boolean().optional(),
    coupons: z.array(z.string()).optional(),
    externalId: z.string().optional(),
    orderType: z.enum([
        "race_promotion",
        "premium_subscription",
        "race_registration",
        "extra_service",
        "other",
    ]).default("other"),
    metadata: z.record(z.string(), z.string()).optional(),
});
export type CreateBillingInput = z.infer<typeof createBillingSchema>;

export const createPixQrCodeSchema = z.object({
    amount: z.number().int().min(1),
    expiresIn: z.number().int().min(60).optional(), // min 60 seconds
    description: z.string().max(37).optional(),
    customer: customerSchema.optional(),
    orderType: z.enum([
        "race_promotion",
        "premium_subscription",
        "race_registration",
        "extra_service",
        "other",
    ]).default("other"),
    metadata: z.record(z.string(), z.string()).optional(),
});
export type CreatePixQrCodeInput = z.infer<typeof createPixQrCodeSchema>;

export const checkPixStatusSchema = z.object({
    id: z.string().min(1),
});
export type CheckPixStatusInput = z.infer<typeof checkPixStatusSchema>;
