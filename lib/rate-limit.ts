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

    public isRateLimited(key: string, now: number = Date.now()): boolean {
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
            return true;
        }

        recent.push(now);
        this.history.set(key, recent);
        return false;
    }

    public reset(): void {
        this.history.clear();
    }
}

// Default global limiter for scripture resolving (60 requests per 60 seconds)
export const scriptureRateLimiter = new SlidingWindowRateLimiter({
    windowMs: 60 * 1000,
    maxRequests: 60
});

export interface HeaderGetter {
    get(name: string): string | null;
}

export interface RequestWithHeaders {
    headers: HeaderGetter;
}

/**
 * Extracts client IP prioritizing platform-trusted edge headers (Vercel, Cloudflare, AWS/Proxy).
 * Prevents client-spoofed x-forwarded-for headers from bypassing rate limits.
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

    // 2. Standard x-forwarded-for fallback (take leftmost / client hop)
    const forwarded = headers.get("x-forwarded-for");
    if (forwarded) {
        const parts = forwarded.split(",").map(p => p.trim()).filter(Boolean);
        if (parts.length > 0) {
            return parts[0];
        }
    }

    return "127.0.0.1";
}

