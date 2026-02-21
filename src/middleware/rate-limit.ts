import type { Context, Next } from "hono";

/**
 * Simple in-memory sliding-window rate limiter.
 * Tracks requests by key (IP or API key) with automatic cleanup.
 */
interface RateLimitEntry {
  count: number;
  resetAt: number;
}

const buckets = new Map<string, RateLimitEntry>();

// Cleanup expired entries every 60s to prevent memory growth
setInterval(() => {
  const now = Date.now();
  for (const [key, entry] of buckets) {
    if (entry.resetAt <= now) buckets.delete(key);
  }
}, 60_000);

function checkLimit(key: string, max: number, windowMs: number): { allowed: boolean; remaining: number; resetAt: number } {
  const now = Date.now();
  const entry = buckets.get(key);

  if (!entry || entry.resetAt <= now) {
    // New window
    buckets.set(key, { count: 1, resetAt: now + windowMs });
    return { allowed: true, remaining: max - 1, resetAt: now + windowMs };
  }

  entry.count++;
  const allowed = entry.count <= max;
  return { allowed, remaining: Math.max(0, max - entry.count), resetAt: entry.resetAt };
}

/**
 * General API rate limiter — per IP, applied to all routes.
 * 120 requests per 60 seconds.
 */
export async function rateLimitByIp(c: Context, next: Next) {
  const ip = c.req.header("x-forwarded-for")?.split(",")[0]?.trim()
    || c.req.header("x-real-ip")
    || "unknown";

  const { allowed, remaining, resetAt } = checkLimit(`ip:${ip}`, 1000, 60_000);

  c.header("X-RateLimit-Limit", "1000");
  c.header("X-RateLimit-Remaining", String(remaining));
  c.header("X-RateLimit-Reset", String(Math.ceil(resetAt / 1000)));

  if (!allowed) {
    return c.json({
      success: false,
      error: "Rate limit exceeded",
      hint: "Slow down. Max 1000 requests per minute.",
    }, 429);
  }

  await next();
}

/**
 * Strict registration rate limiter — per IP.
 * 5 registrations per 10 minutes to prevent agent spam.
 */
export async function rateLimitRegistration(c: Context, next: Next) {
  const ip = c.req.header("x-forwarded-for")?.split(",")[0]?.trim()
    || c.req.header("x-real-ip")
    || "unknown";

  const { allowed, remaining, resetAt } = checkLimit(`reg:${ip}`, 50, 600_000);

  c.header("X-RateLimit-Limit", "50");
  c.header("X-RateLimit-Remaining", String(remaining));
  c.header("X-RateLimit-Reset", String(Math.ceil(resetAt / 1000)));

  if (!allowed) {
    return c.json({
      success: false,
      error: "Registration rate limit exceeded",
      hint: "Max 50 registrations per 10 minutes. Try again later.",
    }, 429);
  }

  await next();
}

/**
 * Per-key write rate limiter — applied to mutation endpoints.
 * 30 writes per 60 seconds per API key.
 */
export function rateLimitByKey(max = 200, windowMs = 60_000) {
  return async (c: Context, next: Next) => {
    const auth = c.req.header("Authorization");
    const key = auth?.startsWith("Bearer ") ? auth.slice(7, 19) : null; // Use first 12 chars as bucket key
    if (!key) return next(); // No key = public endpoint, covered by IP limiter

    const { allowed, remaining, resetAt } = checkLimit(`key:${key}`, max, windowMs);

    c.header("X-RateLimit-Limit", String(max));
    c.header("X-RateLimit-Remaining", String(remaining));
    c.header("X-RateLimit-Reset", String(Math.ceil(resetAt / 1000)));

    if (!allowed) {
      return c.json({
        success: false,
        error: "Rate limit exceeded",
        hint: `Max ${max} requests per ${windowMs / 1000}s for this key.`,
      }, 429);
    }

    await next();
  };
}
