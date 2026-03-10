import { describe, it, expect } from "vitest";
import { canPromoteWithSubscription } from "@/lib/subscriptions";
import type { OrganizerSubscription } from "@/types/subscription";

function makeSub(
    overrides: Partial<OrganizerSubscription> = {}
): OrganizerSubscription {
    return {
        id: "sub-1",
        user_id: "user-1",
        tier: "organizador",
        status: "active",
        payment_order_id: "order-1",
        amount: 34900,
        promotions_limit: 3,
        promotions_used: 0,
        current_period_start: "2026-03-01T00:00:00.000Z",
        current_period_end: "2026-03-31T00:00:00.000Z",
        created_at: "2026-03-01T00:00:00.000Z",
        updated_at: "2026-03-01T00:00:00.000Z",
        ...overrides,
    };
}

// ─── canPromoteWithSubscription ──────────────────────────

describe("canPromoteWithSubscription", () => {
    it("returns true when no promotions have been used", () => {
        const sub = makeSub({ promotions_used: 0, promotions_limit: 3 });
        expect(canPromoteWithSubscription(sub)).toBe(true);
    });

    it("returns true when some promotions are still available", () => {
        const sub = makeSub({ promotions_used: 2, promotions_limit: 3 });
        expect(canPromoteWithSubscription(sub)).toBe(true);
    });

    it("returns false when all promotions have been used", () => {
        const sub = makeSub({ promotions_used: 3, promotions_limit: 3 });
        expect(canPromoteWithSubscription(sub)).toBe(false);
    });

    it("returns false when promotions_used exceeds limit (edge case)", () => {
        const sub = makeSub({ promotions_used: 5, promotions_limit: 3 });
        expect(canPromoteWithSubscription(sub)).toBe(false);
    });

    it("works with organizador_pro tier (8 promotions)", () => {
        const sub = makeSub({
            tier: "organizador_pro",
            promotions_used: 7,
            promotions_limit: 8,
        });
        expect(canPromoteWithSubscription(sub)).toBe(true);
    });

    it("returns false when organizador_pro limit is reached", () => {
        const sub = makeSub({
            tier: "organizador_pro",
            promotions_used: 8,
            promotions_limit: 8,
        });
        expect(canPromoteWithSubscription(sub)).toBe(false);
    });
});
