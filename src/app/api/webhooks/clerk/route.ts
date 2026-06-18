// src/app/api/webhooks/clerk/route.ts
import { NextRequest, NextResponse } from 'next/server'
import { Webhook } from 'svix'
import { prisma } from '@/lib/prisma'

const WEBHOOK_SECRET = process.env.CLERK_WEBHOOK_SECRET

export async function POST(req: NextRequest) {
  // ── Signature verification (Svix) ────────────────────────
  if (!WEBHOOK_SECRET) {
    console.error('CLERK_WEBHOOK_SECRET not set')
    return NextResponse.json({ error: 'Webhook secret not configured' }, { status: 500 })
  }

  const svixId        = req.headers.get('svix-id')
  const svixTimestamp = req.headers.get('svix-timestamp')
  const svixSignature = req.headers.get('svix-signature')

  if (!svixId || !svixTimestamp || !svixSignature) {
    return NextResponse.json({ error: 'Missing svix headers' }, { status: 400 })
  }

  const body = await req.text()
  const wh = new Webhook(WEBHOOK_SECRET)

  let payload: { type: string; data: any }
  try {
    payload = wh.verify(body, {
      'svix-id':        svixId,
      'svix-timestamp': svixTimestamp,
      'svix-signature': svixSignature,
    }) as { type: string; data: any }
  } catch (err) {
    console.error('Clerk webhook verification failed:', err)
    return NextResponse.json({ error: 'Invalid signature' }, { status: 400 })
  }

  // ── Handle events ─────────────────────────────────────────
  const { type, data } = payload

  try {
    if (type === 'user.created') {
      await prisma.user.upsert({
        where: { clerkId: data.id },
        create: {
          clerkId: data.id,
          email: data.email_addresses?.[0]?.email_address ?? '',
          name: [data.first_name, data.last_name].filter(Boolean).join(' ') || null,
        },
        update: {},
      })
    }

    if (type === 'user.updated') {
      await prisma.user.update({
        where: { clerkId: data.id },
        data: {
          email: data.email_addresses?.[0]?.email_address ?? '',
          name: [data.first_name, data.last_name].filter(Boolean).join(' ') || null,
        },
      })
    }

    if (type === 'user.deleted') {
      await prisma.user.delete({ where: { clerkId: data.id } }).catch(() => null)
    }
  } catch (err) {
    console.error('Clerk webhook DB error:', err)
    return NextResponse.json({ error: 'DB error' }, { status: 500 })
  }

  return NextResponse.json({ received: true })
}
