// src/app/api/waitlist/route.ts
import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { sendWaitlistEmail } from '@/lib/email'

export async function POST(req: NextRequest) {
  const { email, company } = await req.json()
  if (!email?.trim()) return NextResponse.json({ error: 'Email required' }, { status: 400 })

  try {
    await prisma.waitlist.upsert({
      where: { email },
      create: { email, company: company || null },
      update: {},
    })
    await sendWaitlistEmail(email).catch(console.error) // don't fail if email fails
    return NextResponse.json({ success: true })
  } catch (e) {
    return NextResponse.json({ error: 'Failed' }, { status: 500 })
  }
}

export async function GET(req: NextRequest) {
  // Admin only — check for secret header
  const secret = req.headers.get('x-admin-secret')
  if (secret !== process.env.ADMIN_SECRET) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }
  const entries = await prisma.waitlist.findMany({ orderBy: { createdAt: 'desc' } })
  return NextResponse.json(entries)
}
