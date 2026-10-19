/**
 * BIBLE RHEMA AI - COVENANT ENTITLEMENT ENGINE
 * Authoritative entitlement validator for subscription tiers.
 * Enforces tier hierarchy (MINISTER >= DISCIPLE >= SEEKER) and active subscription lifecycles.
 */

export type SubscriptionTier = 'SEEKER' | 'DISCIPLE' | 'MINISTER';

export interface UserEntitlementProfile {
    id?: string;
    tier?: string | null;
    subscription_status?: string | null;
    current_period_end?: string | null;
}

export interface EntitlementCheckResult {
    isEntitled: boolean;
    authorizedTier: SubscriptionTier;
    effectiveStatus: 'active' | 'inactive' | 'expired' | 'tier_mismatch' | 'unauthenticated';
    reason?: string;
}

const TIER_RANKS: Record<SubscriptionTier, number> = {
    'SEEKER': 0,
    'DISCIPLE': 1,
    'MINISTER': 2
};

/**
 * Validates whether a given user profile is entitled to access a feature restricted to `requiredTier`.
 * Checks both the assigned tier and active subscription lifecycle (grace period, expiry, status).
 */
export function verifyUserTierEntitlement(
    profile: UserEntitlementProfile | null | undefined,
    requiredTier: SubscriptionTier
): EntitlementCheckResult {
    if (!profile) {
        return {
            isEntitled: false,
            authorizedTier: 'SEEKER',
            effectiveStatus: 'unauthenticated',
            reason: 'User profile not found.'
        };
    }

    const rawTier = (profile.tier || 'SEEKER').toUpperCase().trim();
    const currentTier: SubscriptionTier = (rawTier === 'MINISTER' || rawTier === 'DISCIPLE') ? rawTier : 'SEEKER';

    // Free features accessible to all
    if (requiredTier === 'SEEKER') {
        return {
            isEntitled: true,
            authorizedTier: currentTier,
            effectiveStatus: 'active'
        };
    }

    // Tier rank check (e.g. DISCIPLE cannot access MINISTER feature)
    if (TIER_RANKS[currentTier] < TIER_RANKS[requiredTier]) {
        return {
            isEntitled: false,
            authorizedTier: currentTier,
            effectiveStatus: 'tier_mismatch',
            reason: `This feature requires ${requiredTier} covenant membership, but current membership tier is ${currentTier}.`
        };
    }

    // Subscription status check (cancelled, expired, unpaid, past_due)
    if (profile.subscription_status) {
        const status = profile.subscription_status.toLowerCase().trim();
        const inactiveStatuses = ['cancelled', 'expired', 'past_due', 'unpaid', 'inactive'];
        if (inactiveStatuses.includes(status)) {
            return {
                isEntitled: false,
                authorizedTier: 'SEEKER',
                effectiveStatus: 'inactive',
                reason: `Covenant membership is currently '${profile.subscription_status}'. An active subscription is required.`
            };
        }
    }

    // Billing period expiration check
    if (profile.current_period_end) {
        const periodEndTime = new Date(profile.current_period_end).getTime();
        if (!isNaN(periodEndTime) && periodEndTime < Date.now()) {
            return {
                isEntitled: false,
                authorizedTier: 'SEEKER',
                effectiveStatus: 'expired',
                reason: `Covenant membership period expired on ${new Date(periodEndTime).toISOString().split('T')[0]}. Please renew to continue.`
            };
        }
    }

    return {
        isEntitled: true,
        authorizedTier: currentTier,
        effectiveStatus: 'active'
    };
}
