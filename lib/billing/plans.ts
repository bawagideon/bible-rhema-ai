/**
 * Canonical Server-Owned Pricing Catalog for Bible Rhema AI
 * All billing amounts are authoritative here.
 * Client-submitted amounts or metadata are validated against these exact constants.
 */

export type PaidTier = 'DISCIPLE' | 'MINISTER';
export type BillingCycle = 'monthly' | 'yearly';

export interface PlanPrice {
    tier: PaidTier;
    cycle: BillingCycle;
    amountInKobo: number; // 1 NGN = 100 Kobo
    amountInNgn: number;
    currency: 'NGN';
    label: string;
}

export const PLAN_PRICING: Record<`${PaidTier}_${BillingCycle}`, PlanPrice> = {
    DISCIPLE_monthly: {
        tier: 'DISCIPLE',
        cycle: 'monthly',
        amountInKobo: 500000, // ₦5,000
        amountInNgn: 5000,
        currency: 'NGN',
        label: 'Disciple Covenant (Monthly)'
    },
    DISCIPLE_yearly: {
        tier: 'DISCIPLE',
        cycle: 'yearly',
        amountInKobo: 5000000, // ₦50,000 (2 months free)
        amountInNgn: 50000,
        currency: 'NGN',
        label: 'Disciple Covenant (Yearly)'
    },
    MINISTER_monthly: {
        tier: 'MINISTER',
        cycle: 'monthly',
        amountInKobo: 1500000, // ₦15,000
        amountInNgn: 15000,
        currency: 'NGN',
        label: 'Minister Pulpit (Monthly)'
    },
    MINISTER_yearly: {
        tier: 'MINISTER',
        cycle: 'yearly',
        amountInKobo: 15000000, // ₦150,000 (2 months free)
        amountInNgn: 150000,
        currency: 'NGN',
        label: 'Minister Pulpit (Yearly)'
    }
};

export function getExpectedPlanPrice(tier: string, cycle: string): PlanPrice | null {
    const normalizedTier = tier?.toUpperCase();
    const normalizedCycle = cycle?.toLowerCase();
    const key = `${normalizedTier}_${normalizedCycle}` as `${PaidTier}_${BillingCycle}`;
    return PLAN_PRICING[key] || null;
}
