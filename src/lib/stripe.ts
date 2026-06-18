// src/lib/stripe.ts
import Stripe from 'stripe'
import { prisma } from './prisma'
import { logger } from './logger'

export const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: '2024-04-10',
  typescript: true,
})

export const PLANS = {
  STARTER: { name: 'Starter', price: 89, priceId: process.env.STRIPE_PRICE_STARTER!, projectsPerMonth: 10,
    overage: { pricePerProject: 3.00, priceId: process.env.STRIPE_PRICE_STARTER_OVERAGE! },
    features: ['10 projects / μήνα', '+€3 ανά extra project', 'PDF & Excel upload', 'ΜΕΔΣΚ compliant', 'Export CSV & Excel', 'Email support'] },
  PRO: { name: 'Pro', price: 149, priceId: process.env.STRIPE_PRICE_PRO!, projectsPerMonth: 50,
    overage: { pricePerProject: 1.50, priceId: process.env.STRIPE_PRICE_PRO_OVERAGE! },
    features: ['50 projects / μήνα', '+€1.50 ανά extra project', 'PDF, Excel & DWG upload', 'ΜΕΔΣΚ compliant', 'Export CSV, Excel & PDF', 'Priority support'] },
  AGENCY: { name: 'Agency', price: 199, priceId: process.env.STRIPE_PRICE_AGENCY!, projectsPerMonth: 100,
    overage: { pricePerProject: 0.50, priceId: process.env.STRIPE_PRICE_AGENCY_OVERAGE! },
    features: ['100 projects / μήνα', '+€0.50 ανά extra project', 'Όλοι οι τύποι', 'ΜΕΔΣΚ compliant', 'Export σε όλες τις μορφές', 'Dedicated support', 'API access'] },
}

export const PLAN_LIMITS: Record<string, number> = { FREE: 2, STARTER: 10, PRO: 50, AGENCY: 100 }
export const OVERAGE_RATES: Record<string, number> = { FREE: 0, STARTER: 3.00, PRO: 1.50, AGENCY: 0.50 }

export function checkUsage(plan: string, projectsThisMonth: number) {
  const limit = PLAN_LIMITS[plan] || 2
  const overagePrice = OVERAGE_RATES[plan] || 0
  if (plan === 'FREE') return { allowed: projectsThisMonth < limit, isOverage: false, overagePrice: 0, remaining: Math.max(0, limit - projectsThisMonth), limit }
  const isOverage = projectsThisMonth >= limit
  return { allowed: true, isOverage, overagePrice: isOverage ? overagePrice : 0, remaining: Math.max(0, limit - projectsThisMonth), limit }
}

// ── Overage: log first, then report to Stripe ─────────────────
// If Stripe fails, the log entry remains and can be retried
export async function reportOverageUsage(
  stripeCustomerId: string,
  subscriptionId: string,
  plan: string,
  projectId: string,
  quantity = 1
): Promise<void> {
  const overagePrice = OVERAGE_RATES[plan] || 0
  if (overagePrice === 0) return

  // Create audit log entry first
  const overageLog = await prisma.overageLog.create({
    data: { subscriptionId, projectId, plan, overagePrice, reported: false },
  })

  const overagePriceId: Record<string, string | undefined> = {
    STARTER: process.env.STRIPE_PRICE_STARTER_OVERAGE,
    PRO:     process.env.STRIPE_PRICE_PRO_OVERAGE,
    AGENCY:  process.env.STRIPE_PRICE_AGENCY_OVERAGE,
  }

  const priceId = overagePriceId[plan]
  if (!priceId) return

  try {
    const subscriptions = await stripe.subscriptions.list({ customer: stripeCustomerId, status: 'active', limit: 1 })
    if (!subscriptions.data.length) return

    const subscription = subscriptions.data[0]
    let item = subscription.items.data.find(i => i.price.id === priceId)

    if (!item) {
      await stripe.subscriptionItems.create({ subscription: subscription.id, price: priceId })
      const updated = await stripe.subscriptions.retrieve(subscription.id)
      item = updated.items.data.find(i => i.price.id === priceId)
    }

    if (item) {
      await stripe.subscriptionItems.createUsageRecord(item.id, {
        quantity, timestamp: Math.floor(Date.now() / 1000), action: 'increment',
      })
      // Mark as reported
      await prisma.overageLog.update({
        where: { id: overageLog.id },
        data: { reported: true, reportedAt: new Date() },
      })
      logger.info('Overage reported to Stripe', { plan, projectId, overagePrice })
    }
  } catch (error) {
    // Log error but keep OverageLog entry for retry
    await prisma.overageLog.update({
      where: { id: overageLog.id },
      data: { stripeError: String(error) },
    })
    logger.error('Overage report failed — saved for retry', error, { plan, projectId })
  }
}

// ── Retry unreported overages (call this from a cron job) ─────
export async function retryUnreportedOverages(): Promise<void> {
  const unreported = await prisma.overageLog.findMany({
    where: { reported: false, createdAt: { gte: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000) } },
    include: { subscription: true },
    take: 50,
  })

  for (const log of unreported) {
    await reportOverageUsage(
      log.subscription.stripeCustomerId,
      log.subscriptionId,
      log.plan,
      log.projectId
    )
  }
}

export async function createOrRetrieveCustomer({ email, userId }: { email: string; userId: string }) {
  const existing = await stripe.customers.list({ email, limit: 1 })
  if (existing.data.length > 0) return existing.data[0]
  return await stripe.customers.create({ email, metadata: { clerkUserId: userId } })
}
