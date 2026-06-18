// src/app/waitlist/page.tsx
'use client'
import { useState } from 'react'

export default function WaitlistPage() {
  const [email, setEmail] = useState('')
  const [company, setCompany] = useState('')
  const [submitted, setSubmitted] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const handleSubmit = async () => {
    if (!email.trim()) return
    setLoading(true)
    setError('')
    try {
      const res = await fetch('/api/waitlist', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, company }),
      })
      if (!res.ok) throw new Error('Κάτι πήγε στραβά')
      setSubmitted(true)
    } catch (e: any) {
      setError(e.message)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div style={{ minHeight: '100vh', background: '#0A0A0A', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '40px 24px', fontFamily: 'Inter, sans-serif' }}>

      {/* Logo */}
      <div style={{ marginBottom: 48 }}>
        <span style={{ fontFamily: 'Georgia, serif', fontSize: 28, color: '#FAFAFA' }}>BOQNOW</span>
      </div>

      {submitted ? (
        <div style={{ textAlign: 'center', maxWidth: 440 }}>
          <div style={{ fontSize: 48, marginBottom: 20 }}>✓</div>
          <h1 style={{ fontFamily: 'Georgia, serif', fontSize: 30, color: '#FAFAFA', marginBottom: 12 }}>Σε έχουμε!</h1>
          <p style={{ color: '#9A9A9A', fontSize: 16, lineHeight: 1.6 }}>
            Μόλις κάνουμε launch, θα είσαι από τους πρώτους που θα μάθουν —
            με early-bird τιμή.
          </p>
        </div>
      ) : (
        <div style={{ width: '100%', maxWidth: 440 }}>
          <div style={{ textAlign: 'center', marginBottom: 40 }}>
            <div style={{ display: 'inline-block', padding: '4px 12px', border: '1px solid #2A2A2A', borderRadius: 20, fontSize: 12, color: '#9A9A9A', marginBottom: 20, letterSpacing: 0.5, textTransform: 'uppercase' }}>
              Έρχεται σύντομα
            </div>
            <h1 style={{ fontFamily: 'Georgia, serif', fontSize: 38, color: '#FAFAFA', lineHeight: 1.15, marginBottom: 16, letterSpacing: '-1px' }}>
              BOQ σε 60 δευτερόλεπτα
            </h1>
            <p style={{ color: '#9A9A9A', fontSize: 16, lineHeight: 1.6 }}>
              Ανέβασε αρχιτεκτονικά σχέδια.
              Πάρε αυτόματα Bill of Quantities,
              ΜΕΔΣΚ compliant.
            </p>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            <input
              type="email"
              placeholder="Email σου"
              value={email}
              onChange={e => setEmail(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && handleSubmit()}
              style={{ padding: '13px 16px', background: '#1A1A1A', border: '1px solid #2A2A2A', borderRadius: 8, color: '#FAFAFA', fontSize: 15, outline: 'none', fontFamily: 'Inter, sans-serif' }}
            />
            <input
              type="text"
              placeholder="Εταιρεία / Επωνυμία (προαιρετικό)"
              value={company}
              onChange={e => setCompany(e.target.value)}
              style={{ padding: '13px 16px', background: '#1A1A1A', border: '1px solid #2A2A2A', borderRadius: 8, color: '#FAFAFA', fontSize: 15, outline: 'none', fontFamily: 'Inter, sans-serif' }}
            />

            {error && <p style={{ color: '#FF6B6B', fontSize: 13 }}>{error}</p>}

            <button
              onClick={handleSubmit}
              disabled={!email.trim() || loading}
              style={{
                padding: '14px',
                background: email.trim() && !loading ? '#FAFAFA' : '#2A2A2A',
                color: email.trim() && !loading ? '#0A0A0A' : '#5A5A5A',
                border: 'none',
                borderRadius: 8,
                fontSize: 15,
                fontWeight: 600,
                cursor: email.trim() && !loading ? 'pointer' : 'not-allowed',
                transition: 'all 0.2s',
              }}
            >
              {loading ? 'Αποθήκευση...' : 'Θέλω πρόσβαση πρώτος'}
            </button>
          </div>

          <p style={{ textAlign: 'center', marginTop: 20, fontSize: 13, color: '#5A5A5A' }}>
            Χωρίς spam. Ακύρωση οποτεδήποτε.
          </p>

          {/* Social proof */}
          <div style={{ marginTop: 48, display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: 24, textAlign: 'center' }}>
            {[
              { n: '< 60″', l: 'Δημιουργία BOQ' },
              { n: 'ΜΕΔΣΚ', l: 'Compliant output' },
              { n: '€49', l: 'Από τον μήνα' },
            ].map(({ n, l }) => (
              <div key={l}>
                <div style={{ fontFamily: 'Georgia, serif', fontSize: 22, color: '#FAFAFA', marginBottom: 4 }}>{n}</div>
                <div style={{ fontSize: 12, color: '#5A5A5A' }}>{l}</div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
