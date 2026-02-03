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

export function checkRateLimit(
  key: string,
  options?: { limit?: number; windowMs?: number }
): RateLimitResult {
  const limit = options?.limit ?? 20;
  const windowMs = options?.windowMs ?? 60_000;
  const now = Date.now();

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
