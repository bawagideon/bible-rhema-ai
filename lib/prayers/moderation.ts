/**
 * BIBLE RHEMA AI - PRAYER MODERATION & PRIVACY ENGINE
 * Centralized domain operations for prayer validation, affirmative consent,
 * author ownership checks, and atomic community moderation reports.
 */

export interface PrayerCreateInput {
    title: string;
    description?: string | null;
    scripture_ref?: string | null;
    is_community?: boolean;
    community_consent?: boolean;
    author_name?: string | null;
    ai_strategy?: any;
}

export interface PrayerUpdateInput {
    id: string;
    action?: string;
    reason?: string;
    status?: string;
    testimony?: string | null;
    is_community?: boolean;
    community_consent?: boolean;
}

export interface ValidationResult {
    isValid: boolean;
    error?: string;
}

/**
 * Validates new prayer creation payload.
 * Strictly enforces affirmative consent for community sharing.
 */
export function validatePrayerCreate(body: any): ValidationResult {
    if (!body || typeof body !== 'object') {
        return { isValid: false, error: "Request payload must be a JSON object." };
    }

    const { title, description, scripture_ref, is_community, community_consent } = body;

    if (!title || typeof title !== 'string' || title.trim().length === 0) {
        return { isValid: false, error: "Petition title is required." };
    }

    if (title.trim().length > 300) {
        return { isValid: false, error: "Petition title cannot exceed 300 characters." };
    }

    if (description !== undefined && description !== null) {
        if (typeof description !== 'string') {
            return { isValid: false, error: "Description must be a string." };
        }
        if (description.trim().length > 3000) {
            return { isValid: false, error: "Description cannot exceed 3000 characters." };
        }
    }

    if (scripture_ref !== undefined && scripture_ref !== null) {
        if (typeof scripture_ref !== 'string') {
            return { isValid: false, error: "Scripture reference must be a string." };
        }
        if (scripture_ref.trim().length > 100) {
            return { isValid: false, error: "Scripture reference cannot exceed 100 characters." };
        }
    }

    // Server-side publication consent boundary
    if (Boolean(is_community)) {
        if (community_consent !== true) {
            return {
                isValid: false,
                error: "Explicit affirmative consent (community_consent: true) is required to publish petitions to the community prayer wall."
            };
        }
    }

    return { isValid: true };
}

/**
 * Validates prayer update payload.
 * Enforces affirmative consent when transitioning a private petition to public community view.
 */
export function validatePrayerUpdate(body: any): ValidationResult {
    if (!body || typeof body !== 'object') {
        return { isValid: false, error: "Request payload must be a JSON object." };
    }

    const { id, status, testimony, is_community, community_consent } = body;

    if (!id || typeof id !== 'string' || id.trim().length === 0) {
        return { isValid: false, error: "Valid prayer ID is required." };
    }

    if (status !== undefined) {
        if (!['active', 'answered', 'archived'].includes(status)) {
            return { isValid: false, error: "Invalid status. Permitted values are 'active', 'answered', or 'archived'." };
        }
    }

    if (testimony !== undefined && testimony !== null) {
        if (typeof testimony !== 'string') {
            return { isValid: false, error: "Testimony must be a string." };
        }
        if (testimony.trim().length > 3000) {
            return { isValid: false, error: "Testimony cannot exceed 3000 characters." };
        }
    }

    // Crucial: Require affirmative consent on PATCH whenever is_community is set to true
    if (is_community === true) {
        if (community_consent !== true) {
            return {
                isValid: false,
                error: "Explicit affirmative consent (community_consent: true) is required to publish a private petition to the community prayer wall."
            };
        }
    }

    return { isValid: true };
}

/**
 * Validates prayer report reason input.
 * Rejects non-string types and lengths > 500 characters.
 */
export function validatePrayerReportReason(reason: any): ValidationResult {
    if (reason === undefined || reason === null) {
        return { isValid: true };
    }
    if (typeof reason !== 'string') {
        return { isValid: false, error: "Report reason must be a text string." };
    }
    if (reason.trim().length > 500) {
        return { isValid: false, error: "Report reason cannot exceed 500 characters." };
    }
    return { isValid: true };
}

/**
 * Validates report submission against a target prayer.
 * Prevents reporting private prayers or author self-reporting.
 */
export function validatePrayerReport(
    targetPrayer: { id: string; user_id: string; is_community: boolean } | null | undefined,
    reporterId: string,
    reason: any
): ValidationResult {
    if (!targetPrayer) {
        return { isValid: false, error: "Petition not found." };
    }

    if (!targetPrayer.is_community) {
        return { isValid: false, error: "Only active public community petitions can be reported." };
    }

    if (targetPrayer.user_id === reporterId) {
        return { isValid: false, error: "You cannot report your own petition. Use 'Make Private' to unpublish it." };
    }

    const reasonValidation = validatePrayerReportReason(reason);
    if (!reasonValidation.isValid) {
        return reasonValidation;
    }

    return { isValid: true };
}
