// src/app/pricing/page.tsx
'use client'
import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { useAuth } from '@clerk/nextjs'
import { Check } from 'lucide-react'
import { PLANS } from '@/lib/stripe'

export default function PricingPage() {
  const { isSignedIn } = useAuth()
  const router = useRouter()
  const [loading, setLoading] = useState<string | null>(null)

  const handleCheckout = async (priceId: string, planKey: string) => {
    if (!isSignedIn) { router.push('/sign-up'); return }
    setLoading(planKey)
    try {
      const res = await fetch('/api/stripe/create-checkout', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ priceId }),
      })
      const data = await res.json()
      if (data.url) window.location.href = data.url
    } catch (e) {
      console.error(e)
    } finally {
      setLoading(null)
    }
  }

  const plans = [
    { key: 'STARTER', ...PLANS.STARTER, highlighted: false },
    { key: 'PRO', ...PLANS.PRO, highlighted: true },
    { key: 'AGENCY', ...PLANS.AGENCY, highlighted: false },
  ]

  return (
    <div style={{ minHeight: '100vh', background: '#FAFAFA', fontFamily: 'Inter, sans-serif', padding: '80px 24px' }}>
      <div style={{ maxWidth: 960, margin: '0 auto' }}>
        <div style={{ textAlign: 'center', marginBottom: 60 }}>
          <h1 style={{ fontFamily: 'Georgia, serif', fontSize: 40, color: '#0A0A0A', marginBottom: 16 }}>Απλά τιμολόγια</h1>
          <p style={{ color: '#5A5A5A', fontSize: 18 }}>7 ημέρες free trial σε όλα τα πλάνα. Ακύρωση οποτεδήποτε.</p>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 24 }}>
          {plans.map(plan => (
            <div
              key={plan.key}
              style={{
                background: plan.highlighted ? '#0A0A0A' : '#fff',
                border: `1px solid ${plan.highlighted ? '#0A0A0A' : '#E0E0E0'}`,
                borderRadius: 12,
                padding: 32,
              }}
            >
              <h3 style={{ fontSize: 13, fontWeight: 600, letterSpacing: 1, textTransform: 'uppercase', color: plan.highlighted ? '#9A9A9A' : '#5A5A5A', marginBottom: 12 }}>
                {plan.name}
              </h3>
              <div style={{ marginBottom: 24 }}>
                <span style={{ fontFamily: 'Georgia, serif', fontSize: 44, color: plan.highlighted ? '#FAFAFA' : '#0A0A0A' }}>€{plan.price}</span>
                <span style={{ color: plan.highlighted ? '#9A9A9A' : '#5A5A5A', fontSize: 14 }}>/μήνα</span>
              </div>

              <ul style={{ listStyle: 'none', marginBottom: 32 }}>
                {plan.features.map(f => (
                  <li key={f} style={{ display: 'flex', alignItems: 'flex-start', gap: 8, marginBottom: 10 }}>
                    <Check size={14} color={plan.highlighted ? '#1A7A4A' : '#1A7A4A'} style={{ marginTop: 2, flexShrink: 0 }} />
                    <span style={{ fontSize: 14, color: plan.highlighted ? '#E0E0E0' : '#2A2A2A' }}>{f}</span>
                  </li>
                ))}
              </ul>

              <button
                onClick={() => handleCheckout(plan.priceId, plan.key)}
                disabled={loading === plan.key}
                style={{
                  width: '100%',
                  padding: '12px',
                  background: plan.highlighted ? '#FAFAFA' : '#0A0A0A',
                  color: plan.highlighted ? '#0A0A0A' : '#FAFAFA',
                  border: 'none',
                  borderRadius: 6,
                  fontSize: 14,
                  fontWeight: 600,
                  cursor: 'pointer',
                }}
              >
                {loading === plan.key ? 'Φόρτωση...' : 'Ξεκίνα — 7 ημέρες δωρεάν'}
              </button>
            </div>
          ))}
        </div>

        <p style={{ textAlign: 'center', marginTop: 40, fontSize: 13, color: '#9A9A9A' }}>
          Ερωτήσεις; Γράψε στο <a href="mailto:hello@boqnow.com" style={{ color: '#0A0A0A' }}>hello@boqnow.com</a>
        </p>
      </div>
    </div>
  )
}
