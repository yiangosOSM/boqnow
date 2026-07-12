// src/middleware.ts — BOQNOW Security Middleware
import { clerkMiddleware, createRouteMatcher } from '@clerk/nextjs/server'
import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'
import { MOCK_CLERK_ID } from '@/lib/dev/mock-data'

const isProtectedRoute = createRouteMatcher([
  '/dashboard(.*)',
  '/api/boq(.*)',
  '/api/export(.*)',
  '/api/stripe(.*)',
  '/api/admin(.*)',
  '/admin(.*)',
])

const isAdminRoute = createRouteMatcher([
  '/admin(.*)',
  '/api/admin(.*)',
])

function securityHeaders(response: NextResponse) {
  response.headers.set('X-Frame-Options', 'DENY')
  response.headers.set('X-Content-Type-Options', 'nosniff')
  response.headers.set('Referrer-Policy', 'strict-origin-when-cross-origin')
  response.headers.set('Permissions-Policy', 'camera=(), microphone=(), geolocation=()')
  response.headers.set(
    'Content-Security-Policy',
    "default-src 'self'; script-src 'self' 'unsafe-inline' https://clerk.com https://*.clerk.accounts.dev; style-src 'self' 'unsafe-inline'; img-src 'self' data: https:; connect-src 'self' https://api.anthropic.com https://*.supabase.co https://api.stripe.com https://clerk.com;"
  )
  return response
}

function mockMiddleware(req: NextRequest) {
  const path = req.nextUrl.pathname

  if (path.startsWith('/sign-in') || path.startsWith('/sign-up')) {
    return securityHeaders(NextResponse.redirect(new URL('/dashboard', req.url)))
  }

  if (isAdminRoute(req)) {
    const adminId = process.env.ADMIN_CLERK_USER_ID || MOCK_CLERK_ID
    if (adminId !== MOCK_CLERK_ID) {
      if (path.startsWith('/api/')) {
        return securityHeaders(NextResponse.json({ error: 'Forbidden' }, { status: 403 }))
      }
      return securityHeaders(NextResponse.redirect(new URL('/dashboard', req.url)))
    }
  }

  return securityHeaders(NextResponse.next())
}

const clerkHandler = clerkMiddleware(async (auth, req: NextRequest) => {
  if (isProtectedRoute(req)) {
    const { userId, redirectToSignIn } = await auth()
    if (!userId) return redirectToSignIn({ returnBackUrl: req.url })
  }

  if (isAdminRoute(req)) {
    const { userId } = await auth()
    const adminId = process.env.ADMIN_CLERK_USER_ID
    if (!userId || userId !== adminId) {
      if (req.nextUrl.pathname.startsWith('/api/')) {
        return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
      }
      return NextResponse.redirect(new URL('/dashboard', req.url))
    }
  }

  return securityHeaders(NextResponse.next())
})

export default process.env.MOCK_AUTH === 'true' ? mockMiddleware : clerkHandler

export const config = {
  matcher: ['/((?!.*\\..*|_next).*)', '/', '/(api|trpc)(.*)'],
}
