export interface RateLimitResult {
  allowed: boolean;
  retryAfterSeconds: number;
}

export interface SlidingWindowRateLimiterOptions {
  now?: () => number;
  maxKeys?: number;
}

export class SlidingWindowRateLimiter {
  private readonly requests = new Map<string, number[]>();
  private readonly now: () => number;
  private readonly maxKeys: number;

  constructor(options: SlidingWindowRateLimiterOptions = {}) {
    this.now = options.now ?? Date.now;
    this.maxKeys = options.maxKeys ?? 10_000;
  }

  consume(key: string, limit: number, windowMs: number): RateLimitResult {
    const currentTime = this.now();
    const active = (this.requests.get(key) ?? []).filter((time) => currentTime - time < windowMs);
    if (active.length >= limit) {
      this.requests.set(key, active);
      return {
        allowed: false,
        retryAfterSeconds: Math.max(1, Math.ceil((active[0] + windowMs - currentTime) / 1000)),
      };
    }
    active.push(currentTime);
    this.requests.set(key, active);
    if (this.requests.size > this.maxKeys) {
      for (const [storedKey, times] of this.requests) {
        if (times.every((time) => currentTime - time >= windowMs)) {
          this.requests.delete(storedKey);
        }
        if (this.requests.size <= this.maxKeys) {
          break;
        }
      }
    }
    return { allowed: true, retryAfterSeconds: 0 };
  }
}
