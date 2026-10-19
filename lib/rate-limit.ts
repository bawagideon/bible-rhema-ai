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
