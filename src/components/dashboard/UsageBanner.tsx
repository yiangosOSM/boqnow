'use client'
// src/components/dashboard/UsageBanner.tsx
// Shows monthly usage, remaining projects, and overage warning

import { useState, useEffect } from 'react'
import { AlertTriangle, Zap, TrendingUp } from 'lucide-react'
import Link from 'next/link'

interface UsageData {
  plan: string
  projectsThisMonth: number
  limit: number
  remaining: number
  overageRate: number
}

const OVERAGE_RATES: Record<string, number> = {
  FREE: 0, STARTER: 3.00, PRO: 1.50, AGENCY: 0.50,
}
const PLAN_LIMITS: Record<string, number> = {
  FREE: 2, STARTER: 10, PRO: 50, AGENCY: 100,
}

export default function UsageBanner({
  plan,
  projectsThisMonth,
}: {
  plan: string
  projectsThisMonth: number
}) {
  const limit = PLAN_LIMITS[plan] || 2
  const remaining = Math.max(0, limit - projectsThisMonth)
  const overageRate = OVERAGE_RATES[plan] || 0
  const isOverage = projectsThisMonth >= limit && plan !== 'FREE'
  const isFreeLimit = plan === 'FREE' && projectsThisMonth >= 2
  const isWarning = remaining <= 2 && remaining > 0 && !isOverage

  const pct = Math.min(100, (projectsThisMonth / limit) * 100)

  if (isFreeLimit) {
    return (
      <div style={{ background: '#FFF0F0', border: '1px solid #FFB0B0', borderRadius: 8, padding: '14px 20px', marginBottom: 20, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <AlertTriangle size={16} color="#CC0000" />
          <span style={{ fontSize: 14, color: '#CC0000', fontWeight: 500 }}>
            Έφτασες το όριο των 2 δωρεάν projects για τον μήνα.
          </span>
        </div>
        <Link href="/pricing" style={{ padding: '7px 16px', background: '#CC0000', color: '#fff', borderRadius: 6, fontSize: 13, textDecoration: 'none', fontWeight: 500, whiteSpace: 'nowrap' }}>
          Αναβάθμισε →
        </Link>
      </div>
    )
  }

  if (isOverage) {
    return (
      <div style={{ background: '#FFF8E6', border: '1px solid #FFE0A0', borderRadius: 8, padding: '14px 20px', marginBottom: 20 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <TrendingUp size={16} color="#B8860B" />
            <span style={{ fontSize: 14, color: '#7A5A00', fontWeight: 500 }}>
              Overage mode — {projectsThisMonth - limit} extra projects @ €{overageRate.toFixed(2)}/project
            </span>
          </div>
          <span style={{ fontSize: 13, color: '#B8860B', fontWeight: 600 }}>
            +€{((projectsThisMonth - limit) * overageRate).toFixed(2)} αυτόν τον μήνα
          </span>
        </div>
        <p style={{ fontSize: 12, color: '#9A7A00', marginTop: 6 }}>
          Χρεώνεσαι αυτόματα στο τέλος του μήνα. <Link href="/pricing" style={{ color: '#7A5A00' }}>Αναβάθμισε για χαμηλότερο rate →</Link>
        </p>
      </div>
    )
  }

  return (
    <div style={{ background: '#fff', border: '1px solid #E0E0E0', borderRadius: 8, padding: '14px 20px', marginBottom: 20 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
        <span style={{ fontSize: 13, color: '#5A5A5A' }}>
          <strong style={{ color: '#0A0A0A' }}>{projectsThisMonth}</strong> / {limit} projects αυτόν τον μήνα
        </span>
        <span style={{ fontSize: 12, color: isWarning ? '#B8860B' : '#9A9A9A' }}>
          {remaining === 0 ? 'Αρχίζει overage @ €' + overageRate + '/project' :
           isWarning ? `⚠️ Μένουν ${remaining} projects` :
           `Μένουν ${remaining}`}
        </span>
      </div>
      <div style={{ height: 4, background: '#F0F0F0', borderRadius: 2, overflow: 'hidden' }}>
        <div style={{
          height: '100%',
          width: `${pct}%`,
          background: pct >= 90 ? '#B8860B' : pct >= 75 ? '#E8A000' : '#0A0A0A',
          borderRadius: 2,
          transition: 'width 0.5s ease',
        }} />
      </div>
      {plan !== 'AGENCY' && (
        <p style={{ fontSize: 11, color: '#9A9A9A', marginTop: 6 }}>
          Μετά τα {limit}: €{overageRate.toFixed(2)}/project ·{' '}
          <Link href="/pricing" style={{ color: '#5A5A5A' }}>Αναβάθμισε για λιγότερο</Link>
        </p>
      )}
    </div>
  )
}
