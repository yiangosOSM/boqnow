// src/lib/rate-limit.ts
// Rate limiting via Upstash Redis
// npm install @upstash/ratelimit @upstash/redis

import { Ratelimit } from '@upstash/ratelimit'
import { Redis } from '@upstash/redis'
import { NextRequest, NextResponse } from 'next/server'

const isMock = process.env.MOCK_AUTH === 'true'

const noopLimiter = {
  limit: async () => ({ success: true, limit: 999, remaining: 999, reset: Date.now() + 60_000 }),
} as unknown as Ratelimit

// One Redis client, reused across requests
const redis = isMock
  ? null
  : new Redis({
      url: process.env.UPSTASH_REDIS_URL!,
      token: process.env.UPSTASH_REDIS_TOKEN!,
    })

// Different limiters for different endpoints
export const limiters = isMock
  ? { boq: noopLimiter, auth: noopLimiter, waitlist: noopLimiter, api: noopLimiter }
  : {
  // BOQ generation — expensive, strict limit
  boq: new Ratelimit({
    redis: redis!,
    limiter: Ratelimit.slidingWindow(10, '1 h'), // 10 per hour per user
    analytics: true,
    prefix: 'measur:boq',
  }),

  // Auth endpoints — prevent brute force
  auth: new Ratelimit({
    redis: redis!,
    limiter: Ratelimit.slidingWindow(20, '15 m'),
    prefix: 'measur:auth',
  }),

  // Waitlist — prevent spam
  waitlist: new Ratelimit({
    redis: redis!,
    limiter: Ratelimit.slidingWindow(3, '1 h'),
    prefix: 'measur:waitlist',
  }),

  // General API
  api: new Ratelimit({
    redis: redis!,
    limiter: Ratelimit.slidingWindow(100, '1 m'),
    prefix: 'measur:api',
  }),
}

// Helper: get identifier (userId or IP)
export function getIdentifier(req: NextRequest, userId?: string): string {
  if (userId) return `user:${userId}`
  const forwarded = req.headers.get('x-forwarded-for')
  const ip = forwarded ? forwarded.split(',')[0].trim() : 'unknown'
  return `ip:${ip}`
}

// Helper: apply rate limit and return error response if exceeded
export async function applyRateLimit(
  limiter: Ratelimit,
  identifier: string
): Promise<{ blocked: boolean; response?: NextResponse }> {
  const { success, limit, remaining, reset } = await limiter.limit(identifier)

  if (!success) {
    const retryAfter = Math.ceil((reset - Date.now()) / 1000)
    return {
      blocked: true,
      response: NextResponse.json(
        {
          error: 'Πάρα πολλά αιτήματα. Δοκίμασε ξανά σε λίγο.',
          retryAfter,
        },
        {
          status: 429,
          headers: {
            'X-RateLimit-Limit': limit.toString(),
            'X-RateLimit-Remaining': remaining.toString(),
            'X-RateLimit-Reset': reset.toString(),
            'Retry-After': retryAfter.toString(),
          },
        }
      ),
    }
  }

  return { blocked: false }
}
