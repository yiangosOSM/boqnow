// src/app/sign-in/[[...sign-in]]/page.tsx
import { SignIn } from '@clerk/nextjs'

export default function SignInPage() {
  return (
    <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#FAFAFA' }}>
      <div>
        <div style={{ textAlign: 'center', marginBottom: 32 }}>
          <span style={{ fontFamily: 'Georgia, serif', fontSize: 26, color: '#0A0A0A' }}>BOQNOW</span>
        </div>
        <SignIn />
      </div>
    </div>
  )
}
