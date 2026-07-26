import { Ratelimit } from "@upstash/ratelimit";
import { Redis } from "@upstash/redis";

const redis =
  process.env.UPSTASH_REDIS_REST_URL && process.env.UPSTASH_REDIS_REST_TOKEN
    ? new Redis({
        url: process.env.UPSTASH_REDIS_REST_URL,
        token: process.env.UPSTASH_REDIS_REST_TOKEN,
      })
    : null;

// Two separate limiters with different reasoning:
// - free assets are keyed by IP: nothing but volume distinguishes requests,
//   so we cap requests-per-IP to blunt scraping.
// - paid assets are keyed by the download token itself: a leaked token
//   (screenshotted, forwarded) shouldn't allow unlimited re-downloads even
//   from different IPs within its 1-hour validity window.
export const freeDownloadLimit = redis
  ? new Ratelimit({ redis, limiter: Ratelimit.slidingWindow(20, "1 m"), prefix: "dl:free" })
  : null;

export const paidDownloadLimit = redis
  ? new Ratelimit({ redis, limiter: Ratelimit.slidingWindow(5, "1 h"), prefix: "dl:paid" })
  : null;

// The one auth entry point in the app. Keyed by email+IP together: keying
// by email alone lets an attacker lock out a legitimate admin by
// hammering their address from anywhere; keying by IP alone lets a
// botnet spread one guess per IP across the whole password space. The
// combination limits both without either failure mode.
export const loginLimit = redis
  ? new Ratelimit({ redis, limiter: Ratelimit.slidingWindow(8, "10 m"), prefix: "login" })
  : null;

// Public, unauthenticated endpoint — the obvious target for spam/abuse if
// left unlimited. Keyed by IP only (no email/account concept here).
export const contactFormLimit = redis
  ? new Ratelimit({ redis, limiter: Ratelimit.slidingWindow(5, "10 m"), prefix: "contact" })
  : null;

/** Returns true if the request should be BLOCKED. Fails open (never blocks) if Redis isn't configured. */
export async function isRateLimited(
  limiter: Ratelimit | null,
  key: string
): Promise<boolean> {
  if (!limiter) {
    console.warn("Rate limiting is not configured (missing UPSTASH_REDIS_REST_* env vars) — allowing request.");
    return false;
  }
  const { success } = await limiter.limit(key);
  return !success;
}
