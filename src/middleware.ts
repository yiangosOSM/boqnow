// src/middleware.ts — BOQNOW Security Middleware
import { clerkMiddleware, createRouteMatcher } from '@clerk/nextjs/server'
import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

// ── Protected routes (require auth) ──────────────────────────
const isProtectedRoute = createRouteMatcher([
  '/dashboard(.*)',
  '/api/boq(.*)',
  '/api/export(.*)',
  '/api/stripe(.*)',
  '/api/admin(.*)',
  '/admin(.*)',
])

// ── Admin-only routes ─────────────────────────────────────────
const isAdminRoute = createRouteMatcher([
  '/admin(.*)',
  '/api/admin(.*)',
])

export default clerkMiddleware(async (auth, req: NextRequest) => {
  // 1. Protect all routes that require auth
  if (isProtectedRoute(req)) {
    await auth.protect()
  }

  // 2. Admin routes — verify admin claim
  if (isAdminRoute(req)) {
    const { userId } = await auth()
    const adminId = process.env.ADMIN_CLERK_USER_ID
    if (!userId || userId !== adminId) {
      // Return 403 for API, redirect for pages
      if (req.nextUrl.pathname.startsWith('/api/')) {
        return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
      }
      return NextResponse.redirect(new URL('/dashboard', req.url))
    }
  }

  // 3. Security headers on every response
  const response = NextResponse.next()
  response.headers.set('X-Frame-Options', 'DENY')
  response.headers.set('X-Content-Type-Options', 'nosniff')
  response.headers.set('Referrer-Policy', 'strict-origin-when-cross-origin')
  response.headers.set('Permissions-Policy', 'camera=(), microphone=(), geolocation=()')
  response.headers.set(
    'Content-Security-Policy',
    "default-src 'self'; script-src 'self' 'unsafe-inline' https://clerk.com https://*.clerk.accounts.dev; style-src 'self' 'unsafe-inline'; img-src 'self' data: https:; connect-src 'self' https://api.anthropic.com https://*.supabase.co https://api.stripe.com https://clerk.com;"
  )
  return response
})

export const config = {
  matcher: ['/((?!.*\\..*|_next).*)', '/', '/(api|trpc)(.*)'],
}
