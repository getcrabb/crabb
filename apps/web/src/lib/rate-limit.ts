import { Ratelimit } from '@upstash/ratelimit';
import { Redis } from '@upstash/redis';

export interface RateLimitResult {
  ok: boolean;
  limit: number;
  remaining: number;
  reset: number;
}

interface Bucket {
  count: number;
  reset: number;
}

const STORE_KEY = '__crabbRateLimitStore';

function getStore(): Map<string, Bucket> {
  const globalAny = globalThis as unknown as Record<string, Map<string, Bucket> | undefined>;
  if (!globalAny[STORE_KEY]) {
    globalAny[STORE_KEY] = new Map<string, Bucket>();
  }
  return globalAny[STORE_KEY]!;
}

const upstashUrl = process.env.UPSTASH_REDIS_REST_URL;
const upstashToken = process.env.UPSTASH_REDIS_REST_TOKEN;

const redis = upstashUrl && upstashToken
  ? new Redis({ url: upstashUrl, token: upstashToken })
  : null;

const limiterCache = new Map<string, Ratelimit>();

function getUpstashLimiter(limit: number, windowMs: number): Ratelimit | null {
  if (!redis) return null;
  const key = `${limit}:${windowMs}`;
  const existing = limiterCache.get(key);
  if (existing) return existing;

  const windowSeconds = Math.max(1, Math.ceil(windowMs / 1000));
  const limiter = new Ratelimit({
    redis,
    limiter: Ratelimit.slidingWindow(limit, `${windowSeconds} s`),
    analytics: true,
    prefix: 'crabb',
  });
  limiterCache.set(key, limiter);
  return limiter;
}

export async function checkRateLimit(
  key: string,
  options?: { limit?: number; windowMs?: number }
): Promise<RateLimitResult> {
  const limit = options?.limit ?? 20;
  const windowMs = options?.windowMs ?? 60_000;
  const now = Date.now();

  const upstashLimiter = getUpstashLimiter(limit, windowMs);
  if (upstashLimiter) {
    const result = await upstashLimiter.limit(key);
    return {
      ok: result.success,
      limit: result.limit,
      remaining: result.remaining,
      reset: result.reset,
    };
  }

  // Fallback: in-memory limiter (single instance)
  const store = getStore();
  const bucket = store.get(key);

  if (!bucket || bucket.reset <= now) {
    const reset = now + windowMs;
    store.set(key, { count: 1, reset });
    return { ok: true, limit, remaining: limit - 1, reset };
  }

  if (bucket.count >= limit) {
    return { ok: false, limit, remaining: 0, reset: bucket.reset };
  }

  bucket.count += 1;
  store.set(key, bucket);

  return {
    ok: true,
    limit,
    remaining: Math.max(0, limit - bucket.count),
    reset: bucket.reset,
  };
}
