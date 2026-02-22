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
