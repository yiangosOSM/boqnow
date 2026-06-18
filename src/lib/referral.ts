// src/lib/referral.ts — Referral program
// Εργολάβος φέρνει αρχιτέκτονα → 1 μήνας δωρεάν για τους δύο
import { prisma } from '@/lib/prisma'
import { createHash } from 'crypto'

export function generateReferralCode(userId: string): string {
  return createHash('sha256').update(userId + process.env.CLERK_SECRET_KEY!).digest('hex').slice(0, 8).toUpperCase()
}

export async function applyReferral(referralCode: string, newUserId: string): Promise<{
  success: boolean
  referrerId?: string
  coupon?: string
  message: string
}> {
  // Find referrer by code
  const users = await prisma.user.findMany({ select: { id: true, clerkId: true } })
  const referrer = users.find(u => generateReferralCode(u.clerkId) === referralCode)

  if (!referrer) return { success: false, message: 'Μη έγκυρος κωδικός πρόσκλησης' }
  if (referrer.id === newUserId) return { success: false, message: 'Δεν μπορείς να χρησιμοποιήσεις τον δικό σου κωδικό' }

  // Log the referral
  await prisma.auditLog.create({
    data: {
      userId: referrer.id,
      action: 'REFERRAL',
      metadata: { referredUserId: newUserId, referralCode }
    }
  })

  // Both get 1 month free — via Stripe coupon REFERRAL1MONTH
  // Apply automatically on next invoice via Stripe API (handled by webhook)
  return {
    success: true,
    referrerId: referrer.id,
    coupon: 'REFERRAL1MONTH',
    message: '✓ Κωδικός πρόσκλησης εφαρμόστηκε — 1 μήνας δωρεάν για εσένα και τον φίλο σου!'
  }
}

export function getReferralLink(userId: string, baseUrl: string): string {
  const code = generateReferralCode(userId)
  return `${baseUrl}/sign-up?ref=${code}`
}
