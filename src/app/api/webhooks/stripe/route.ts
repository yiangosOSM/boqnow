// src/app/api/webhooks/stripe/route.ts
import { NextRequest, NextResponse } from 'next/server'
import { stripe } from '@/lib/stripe'
import { prisma } from '@/lib/prisma'
import { logger } from '@/lib/logger'
import Stripe from 'stripe'

export async function POST(req: NextRequest) {
  const body = await req.text()
  const sig = req.headers.get('stripe-signature')!

  let event: Stripe.Event
  try {
    event = stripe.webhooks.constructEvent(body, sig, process.env.STRIPE_WEBHOOK_SECRET!)
  } catch (err) {
    logger.error('Stripe webhook signature failed', err)
    return NextResponse.json({ error: 'Invalid signature' }, { status: 400 })
  }

  // ── Idempotency check ─────────────────────────────────────
  const existing = await prisma.webhookEvent.findUnique({ where: { eventId: event.id } })
  if (existing) {
    logger.info('Stripe webhook already processed', { eventId: event.id })
    return NextResponse.json({ received: true, duplicate: true })
  }

  // Mark as processing immediately
  await prisma.webhookEvent.create({
    data: { eventId: event.id, source: 'stripe', type: event.type },
  })

  const PLAN_MAP: Record<string, string> = {
    [process.env.STRIPE_PRICE_STARTER!]: 'STARTER',
    [process.env.STRIPE_PRICE_PRO!]:     'PRO',
    [process.env.STRIPE_PRICE_AGENCY!]:  'AGENCY',
  }

  try {
    switch (event.type) {
      case 'checkout.session.completed': {
        const session = event.data.object as Stripe.Checkout.Session
        const subscription = await stripe.subscriptions.retrieve(session.subscription as string)
        const priceId = subscription.items.data[0].price.id
        await prisma.subscription.updateMany({
          where: { stripeCustomerId: session.customer as string },
          data: {
            stripeSubscriptionId: subscription.id,
            stripePriceId: priceId,
            plan: (PLAN_MAP[priceId] || 'STARTER') as any,
            status: subscription.status,
            currentPeriodEnd: new Date(subscription.current_period_end * 1000),
          },
        })
        logger.stripeEvent('checkout.session.completed', { customerId: session.customer as string })
        break
      }
      case 'invoice.payment_succeeded': {
        const invoice = event.data.object as Stripe.Invoice
        const subscription = await stripe.subscriptions.retrieve(invoice.subscription as string)
        const priceId = subscription.items.data[0].price.id
        await prisma.subscription.updateMany({
          where: { stripeCustomerId: invoice.customer as string },
          data: { plan: (PLAN_MAP[priceId] || 'STARTER') as any, status: 'active', currentPeriodEnd: new Date(subscription.current_period_end * 1000) },
        })
        break
      }
      case 'customer.subscription.deleted': {
        const sub = event.data.object as Stripe.Subscription
        await prisma.subscription.updateMany({
          where: { stripeSubscriptionId: sub.id },
          data: { plan: 'FREE', status: 'canceled' },
        })
        break
      }
      case 'invoice.payment_failed': {
        const invoice = event.data.object as Stripe.Invoice
        await prisma.subscription.updateMany({
          where: { stripeCustomerId: invoice.customer as string },
          data: { status: 'past_due' },
        })
        break
      }
    }
  } catch (err) {
    logger.error('Stripe webhook processing error', err, { eventId: event.id, type: event.type })
    // Don't mark as failed — let Stripe retry
    await prisma.webhookEvent.update({
      where: { eventId: event.id },
      data: { status: 'error' },
    })
    return NextResponse.json({ error: 'Processing error' }, { status: 500 })
  }

  return NextResponse.json({ received: true })
}
