// src/lib/stripe-guard.ts
// Validates subscription status before allowing BOQ generation

import { prisma } from './prisma'

export interface SubscriptionStatus {
  allowed: boolean
  plan: string
  reason?: string
  upgradeUrl?: string
}

export async function validateSubscription(userId: string): Promise<SubscriptionStatus> {
  const user = await prisma.user.findUnique({
    where: { clerkId: userId },
    include: { subscription: true },
  })

  if (!user) return { allowed: false, plan: 'FREE', reason: 'User not found' }

  const sub = user.subscription
  const plan = sub?.plan || 'FREE'

  // No subscription — FREE plan
  if (!sub) return { allowed: true, plan: 'FREE' }

  // Cancelled subscription — downgrade to FREE
  if (sub.status === 'canceled') {
    return { allowed: true, plan: 'FREE', reason: 'Subscription cancelled — on FREE plan' }
  }

  // Past due — still allow but warn
  if (sub.status === 'past_due') {
    return {
      allowed: true,
      plan,
      reason: 'Payment overdue — please update payment method',
      upgradeUrl: `${process.env.NEXT_PUBLIC_APP_URL}/dashboard/billing`,
    }
  }

  // Expired trial
  if (sub.currentPeriodEnd && new Date(sub.currentPeriodEnd) < new Date()) {
    // Grace period of 24h
    const hoursSinceExpiry = (Date.now() - new Date(sub.currentPeriodEnd).getTime()) / (1000 * 60 * 60)
    if (hoursSinceExpiry > 24) {
      return {
        allowed: false,
        plan: 'FREE',
        reason: 'Subscription expired',
        upgradeUrl: `${process.env.NEXT_PUBLIC_APP_URL}/pricing`,
      }
    }
  }

  return { allowed: true, plan }
}

// ── Detect trial abuse (same email domain, multiple accounts) ──
export async function detectTrialAbuse(email: string): Promise<boolean> {
  const domain = email.split('@')[1]
  if (!domain) return false

  // Disposable email domains — block
  const DISPOSABLE = ['mailinator.com', 'guerrillamail.com', 'tempmail.com', '10minutemail.com', 'throwam.com', 'yopmail.com']
  if (DISPOSABLE.includes(domain.toLowerCase())) return true

  // Check for multiple accounts from same domain (allow up to 5 before flagging)
  const count = await prisma.user.count({
    where: { email: { endsWith: `@${domain}` } },
  })

  // More than 5 accounts from same domain — flag for review (don't block automatically)
  return count > 5 && !['gmail.com', 'yahoo.com', 'hotmail.com', 'outlook.com', 'icloud.com'].includes(domain)
}
