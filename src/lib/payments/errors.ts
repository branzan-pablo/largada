// ============================================================================
// AbacatePay Error Classes
// ============================================================================

export class AbacatePayError extends Error {
    constructor(message: string, public readonly cause?: unknown) {
        super(message);
        this.name = "AbacatePayError";
    }
}

export class AbacatePayApiError extends AbacatePayError {
    constructor(
        message: string,
        public readonly statusCode: number,
        public readonly responseBody?: unknown
    ) {
        super(message);
        this.name = "AbacatePayApiError";
    }
}

export function isInvalidCustomerReferenceError(
    error: unknown
): error is AbacatePayApiError {
    if (!(error instanceof AbacatePayApiError) || error.statusCode !== 400) {
        return false;
    }

    const body = typeof error.responseBody === "string"
        ? error.responseBody
        : JSON.stringify(error.responseBody ?? "");

    return /(customer|cliente)/i.test(body)
        && /(not found|n[aã]o encontr|invalid|inv[aá]lid|does not exist|n[aã]o existe)/i.test(body);
}

export class AbacatePayValidationError extends AbacatePayError {
    constructor(
        message: string,
        public readonly errors: Record<string, string[]>
    ) {
        super(message);
        this.name = "AbacatePayValidationError";
    }
}

export class AbacatePayWebhookError extends AbacatePayError {
    constructor(message: string) {
        super(message);
        this.name = "AbacatePayWebhookError";
    }
}
