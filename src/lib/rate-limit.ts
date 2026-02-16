const rateMap = new Map<string, { count: number; resetAt: number }>();

/**
 * Simple in-memory rate limiter for API routes.
 * Returns { limited: true } if the caller exceeded `max` requests within `windowMs`.
 *
 * NOTE: Works per-instance — resets on redeploy / cold-start.
 * For production at scale, swap with @upstash/ratelimit + Redis.
 */
export function rateLimit(
  key: string,
  { max, windowMs }: { max: number; windowMs: number }
): { limited: boolean } {
  const now = Date.now();
  const entry = rateMap.get(key);

  if (!entry || now > entry.resetAt) {
    rateMap.set(key, { count: 1, resetAt: now + windowMs });
    return { limited: false };
  }

  entry.count++;
  if (entry.count > max) {
    return { limited: true };
  }

  return { limited: false };
}
