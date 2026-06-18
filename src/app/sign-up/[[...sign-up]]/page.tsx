// src/app/sign-up/[[...sign-up]]/page.tsx
import { SignUp } from '@clerk/nextjs'

export default function SignUpPage() {
  return (
    <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#FAFAFA' }}>
      <div>
        <div style={{ textAlign: 'center', marginBottom: 32 }}>
          <span style={{ fontFamily: 'Georgia, serif', fontSize: 26, color: '#0A0A0A' }}>BOQNOW</span>
          <p style={{ fontSize: 14, color: '#5A5A5A', marginTop: 8 }}>7 ημέρες δωρεάν · Ακύρωση οποτεδήποτε</p>
          <p style={{ fontSize: 11, color: '#9A9A9A', marginTop: 8, maxWidth: 360, lineHeight: 1.5 }}>
            Με την εγγραφή αποδέχεστε τους <a href="/legal/terms" style={{ color: '#5A5A5A' }}>Όρους Χρήσης</a> και την <a href="/legal/privacy" style={{ color: '#5A5A5A' }}>Πολιτική Απορρήτου</a>.
          </p>
        </div>
        <SignUp />
      </div>
    </div>
  )
}
