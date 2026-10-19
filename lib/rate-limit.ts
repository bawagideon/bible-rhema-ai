/**
 * In-memory sliding-window rate limiter.
 * Tracks requests per IP address within a rolling window.
 */
export interface RateLimitOptions {
    windowMs: number;
    maxRequests: number;
}

export class SlidingWindowRateLimiter {
    private windowMs: number;
    private maxRequests: number;
    private history: Map<string, number[]>;
    private lastPurge: number;
    private purgeIntervalMs: number;

    constructor(options: RateLimitOptions) {
        this.windowMs = options.windowMs;
        this.maxRequests = options.maxRequests;
        this.history = new Map();
        this.lastPurge = Date.now();
        this.purgeIntervalMs = 5 * 60 * 1000;
    }

    public check(key: string, now: number = Date.now()): { allowed: boolean; remaining: number; resetAt: number } {
        if (now - this.lastPurge > this.purgeIntervalMs) {
            for (const [k, timestamps] of this.history.entries()) {
                const fresh = timestamps.filter(t => now - t < this.windowMs);
                if (fresh.length === 0) {
                    this.history.delete(k);
                } else {
                    this.history.set(k, fresh);
                }
            }
            this.lastPurge = now;
        }

        const timestamps = this.history.get(key) || [];
        const recent = timestamps.filter(t => now - t < this.windowMs);

        if (recent.length >= this.maxRequests) {
            const oldest = recent[0] || now;
            return {
                allowed: false,
                remaining: 0,
                resetAt: oldest + this.windowMs
            };
        }

        recent.push(now);
        this.history.set(key, recent);
        return {
            allowed: true,
            remaining: Math.max(0, this.maxRequests - recent.length),
            resetAt: (recent[0] || now) + this.windowMs
        };
    }

    public isRateLimited(key: string, now: number = Date.now()): boolean {
        return !this.check(key, now).allowed;
    }

    public reset(): void {
        this.history.clear();
    }
}

// Fallback limiter cache for custom options
const fallbackLimiterCache = new Map<string, SlidingWindowRateLimiter>();

export function getFallbackLimiter(options: RateLimitOptions): SlidingWindowRateLimiter {
    const key = `${options.windowMs}_${options.maxRequests}`;
    let limiter = fallbackLimiterCache.get(key);
    if (!limiter) {
        limiter = new SlidingWindowRateLimiter(options);
        fallbackLimiterCache.set(key, limiter);
    }
    return limiter;
}

// Default global limiter for scripture resolving (60 requests per 60 seconds)
export const scriptureRateLimiter = getFallbackLimiter({
    windowMs: 60 * 1000,
    maxRequests: 60
});

export interface HeaderGetter {
    get(name: string): string | null;
}

export interface RequestWithHeaders {
    headers: HeaderGetter;
}

export interface DistributedRateLimitResult {
    allowed: boolean;
    remaining: number;
    resetAt: number;
    retryAfterSeconds: number;
    isDistributed: boolean;
}

/**
 * Extracts client IP prioritizing platform-trusted edge headers (Vercel, Cloudflare).
 * 
 * Defense-in-depth security rule:
 * Standard `x-forwarded-for` can be forged by any client connecting directly to an origin.
 * Therefore, untrusted forwarded headers are only accepted when TRUST_PROXY_HEADERS === 'true'.
 * Otherwise, untrusted proxy headers are tagged with an 'untrusted_proxy:' prefix so spoofed
 * addresses cannot evade limits or impersonate legitimate IP buckets.
 */
export function extractClientIp(req: RequestWithHeaders | HeaderGetter): string {
    const headers = ('headers' in req && req.headers && typeof req.headers.get === 'function')
        ? req.headers
        : (req as HeaderGetter);

    // 1. Prioritize trusted deployment platform edge headers (Vercel, Cloudflare)
    // On Vercel, x-vercel-forwarded-for and x-real-ip are stripped and securely set by edge proxies
    const vercelIp = headers.get("x-vercel-forwarded-for");
    if (vercelIp) {
        const parts = vercelIp.split(",").map(p => p.trim()).filter(Boolean);
        if (parts[0]) return parts[0];
    }

    const cfIp = headers.get("cf-connecting-ip");
    if (cfIp && cfIp.trim()) return cfIp.trim();

    const realIp = headers.get("x-real-ip");
    if (realIp && realIp.trim()) return realIp.trim();

    // 2. Standard x-forwarded-for fallback
    const forwarded = headers.get("x-forwarded-for");
    if (forwarded) {
        const parts = forwarded.split(",").map(p => p.trim()).filter(Boolean);
        if (parts.length > 0) {
            const candidateIp = parts[0];
            // Only trust untrusted x-forwarded-for when explicitly enabled by deployment config
            if (process.env.TRUST_PROXY_HEADERS === 'true') {
                return candidateIp;
            }
            // Quarantine unverified proxy header so attackers cannot cycle spoofed IPs to bypass limits
            return `untrusted_proxy:${candidateIp}`;
        }
    }

    return "127.0.0.1";
}

/**
 * Distributed rate limit evaluator.
 * Checks shared Supabase database rate limit store across serverless instances,
 * falling back gracefully to process-local sliding window if the database is unreachable.
 */
export async function checkDistributedRateLimit(
    key: string,
    options: RateLimitOptions = { windowMs: 60 * 1000, maxRequests: 60 }
): Promise<DistributedRateLimitResult> {
    const safeKey = (key || 'anonymous_client').trim().slice(0, 256);

    try {
        const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
        const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

        if (supabaseUrl && serviceKey && !supabaseUrl.includes('placeholder')) {
            const { getSupabaseServerClient } = await import('./supabase-server');
            const supabase = getSupabaseServerClient();

            const { data, error } = await supabase.rpc('check_rate_limit', {
                p_key: safeKey,
                p_window_ms: options.windowMs,
                p_max_requests: options.maxRequests
            });

            if (!error && data && typeof data.allowed === 'boolean') {
                return {
                    allowed: data.allowed,
                    remaining: typeof data.remaining === 'number' ? data.remaining : 0,
                    resetAt: typeof data.reset_at === 'number' ? data.reset_at : Date.now() + options.windowMs,
                    retryAfterSeconds: typeof data.retry_after_seconds === 'number' ? data.retry_after_seconds : 60,
                    isDistributed: true
                };
            }
        }
    } catch {
        // Fall through to memory fallback
    }

    // Process-local sliding window fallback
    const limiter = getFallbackLimiter(options);
    const now = Date.now();
    const fallbackRes = limiter.check(safeKey, now);
    return {
        allowed: fallbackRes.allowed,
        remaining: fallbackRes.remaining,
        resetAt: fallbackRes.resetAt,
        retryAfterSeconds: Math.ceil(Math.max(1000, fallbackRes.resetAt - now) / 1000),
        isDistributed: false
    };
}


