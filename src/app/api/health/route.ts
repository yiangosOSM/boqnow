// src/app/api/health/route.ts
import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function GET() {
  const start = Date.now()
  const checks: Record<string, string> = {}

  // DB check
  try {
    await prisma.$queryRaw`SELECT 1`
    checks.database = 'ok'
  } catch {
    checks.database = 'error'
  }

  // Anthropic key present
  checks.anthropic = process.env.ANTHROPIC_API_KEY ? 'configured' : 'missing'

  // Stripe key present
  checks.stripe = process.env.STRIPE_SECRET_KEY ? 'configured' : 'missing'

  // Clerk key present
  checks.clerk = process.env.CLERK_SECRET_KEY ? 'configured' : 'missing'

  const allOk = checks.database === 'ok' && checks.anthropic === 'configured'

  return NextResponse.json(
    {
      status: allOk ? 'ok' : 'degraded',
      latencyMs: Date.now() - start,
      checks,
      version: process.env.npm_package_version || '0.1.0',
      env: process.env.NODE_ENV,
    },
    { status: allOk ? 200 : 503 }
  )
}
