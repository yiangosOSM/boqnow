// src/app/api/stripe/create-checkout/route.ts
import { auth, currentUser } from '@clerk/nextjs/server'
import { NextRequest, NextResponse } from 'next/server'
import { stripe, createOrRetrieveCustomer } from '@/lib/stripe'
import { prisma } from '@/lib/prisma'

export async function POST(req: NextRequest) {
  try {
    const { userId } = auth()
    if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const clerkUser = await currentUser()
    if (!clerkUser) return NextResponse.json({ error: 'User not found' }, { status: 404 })

    const { priceId } = await req.json()
    if (!priceId) return NextResponse.json({ error: 'Missing priceId' }, { status: 400 })

    // ── Security: only allow our own price IDs ────────────────
    const allowedPriceIds = [
      process.env.STRIPE_PRICE_STARTER,
      process.env.STRIPE_PRICE_PRO,
      process.env.STRIPE_PRICE_AGENCY,
    ].filter(Boolean)

    if (!allowedPriceIds.includes(priceId)) {
      return NextResponse.json({ error: 'Invalid price' }, { status: 400 })
    }

    const email = clerkUser.emailAddresses[0].emailAddress

    // Get or create Stripe customer
    const customer = await createOrRetrieveCustomer({ email, userId })

    // Upsert user in DB
    const dbUser = await prisma.user.upsert({
      where: { clerkId: userId },
      create: { clerkId: userId, email, name: clerkUser.fullName || undefined },
      update: {},
    })

    // Upsert subscription record
    await prisma.subscription.upsert({
      where: { userId: dbUser.id },
      create: { userId: dbUser.id, stripeCustomerId: customer.id },
      update: { stripeCustomerId: customer.id },
    })

    const session = await stripe.checkout.sessions.create({
      customer: customer.id,
      payment_method_types: ['card'],
      billing_address_collection: 'required',
      line_items: [{ price: priceId, quantity: 1 }],
      mode: 'subscription',
      allow_promotion_codes: true,
      subscription_data: {
        trial_period_days: 7,
        metadata: { clerkUserId: userId },
      },
      success_url: `${process.env.NEXT_PUBLIC_APP_URL}/dashboard?success=true`,
      cancel_url: `${process.env.NEXT_PUBLIC_APP_URL}/pricing?canceled=true`,
    })

    return NextResponse.json({ url: session.url })
  } catch (error) {
    console.error('Stripe checkout error:', error)
    return NextResponse.json({ error: 'Failed to create checkout session' }, { status: 500 })
  }
}
