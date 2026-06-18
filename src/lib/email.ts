// src/lib/email.ts
// Transactional emails via Resend (https://resend.com)
// npm install resend

import { Resend } from 'resend'

const resend = new Resend(process.env.RESEND_API_KEY)
const FROM = 'BOQNOW <hello@boqnow.com>'

// ── Welcome email after signup ────────────────────────────────
export async function sendWelcomeEmail(to: string, name: string) {
  return resend.emails.send({
    from: FROM,
    to,
    subject: 'Καλώς ήρθες στο BOQNOW 👋',
    html: emailLayout(`
      <h1 style="font-family:Georgia,serif;font-size:26px;margin-bottom:8px">Καλώς ήρθες, ${name || 'φίλε'}!</h1>
      <p style="color:#5A5A5A;margin-bottom:24px">Έχεις 7 ημέρες δωρεάν πρόσβαση σε όλες τις δυνατότητες.</p>

      <div style="background:#F8F8F8;border-radius:8px;padding:20px;margin-bottom:24px">
        <p style="font-weight:600;margin-bottom:12px">Ξεκίνα με 3 βήματα:</p>
        <p style="margin-bottom:8px">1️⃣ <strong>Ανέβασε σχέδια</strong> — PDF, Excel, DWG</p>
        <p style="margin-bottom:8px">2️⃣ <strong>Δημιούργησε BOQ</strong> — σε &lt;60 δευτερόλεπτα</p>
        <p>3️⃣ <strong>Export</strong> — CSV, Excel, PDF έτοιμο για προσφορά</p>
      </div>

      <a href="${process.env.NEXT_PUBLIC_APP_URL}/dashboard"
         style="display:inline-block;padding:12px 24px;background:#0A0A0A;color:#FAFAFA;text-decoration:none;border-radius:6px;font-weight:500">
        Άνοιξε το Dashboard →
      </a>

      <p style="margin-top:24px;color:#9A9A9A;font-size:13px">
        Ερωτήσεις; Απλά απάντησε σε αυτό το email.
      </p>
    `),
  })
}

// ── Trial expiring in 2 days ──────────────────────────────────
export async function sendTrialExpiringEmail(to: string, name: string) {
  return resend.emails.send({
    from: FROM,
    to,
    subject: 'Το trial σου λήγει σε 2 μέρες',
    html: emailLayout(`
      <h1 style="font-family:Georgia,serif;font-size:24px;margin-bottom:8px">Ακόμα 2 μέρες trial</h1>
      <p style="color:#5A5A5A;margin-bottom:24px">
        ${name ? `${name}, το` : 'Το'} free trial σου λήγει σε 2 ημέρες.
        Αναβάθμισε για να συνεχίσεις να δημιουργείς BOQ χωρίς διακοπή.
      </p>

      <div style="background:#F8F8F8;border-radius:8px;padding:20px;margin-bottom:24px">
        <p style="font-weight:600;margin-bottom:12px">Starter — €49/μήνα</p>
        <p style="color:#5A5A5A;font-size:14px">10 projects/μήνα · Export CSV & Excel · ΜΕΔΣΚ compliant</p>
      </div>

      <a href="${process.env.NEXT_PUBLIC_APP_URL}/pricing"
         style="display:inline-block;padding:12px 24px;background:#0A0A0A;color:#FAFAFA;text-decoration:none;border-radius:6px;font-weight:500">
        Δες πλάνα & τιμές →
      </a>
    `),
  })
}

// ── BOQ ready notification ────────────────────────────────────
export async function sendBOQReadyEmail(to: string, name: string, projectName: string, projectId: string, total: number) {
  return resend.emails.send({
    from: FROM,
    to,
    subject: `BOQ έτοιμο: ${projectName}`,
    html: emailLayout(`
      <h1 style="font-family:Georgia,serif;font-size:24px;margin-bottom:8px">Το BOQ είναι έτοιμο ✓</h1>
      <p style="color:#5A5A5A;margin-bottom:24px">Το αυτόματο Bill of Quantities για το έργο <strong>${projectName}</strong> δημιουργήθηκε επιτυχώς.</p>

      <div style="background:#F8F8F8;border-radius:8px;padding:20px;margin-bottom:24px;display:flex;justify-content:space-between;align-items:center">
        <div>
          <p style="font-size:13px;color:#5A5A5A;margin-bottom:4px">Εκτιμώμενο Κόστος Έργου</p>
          <p style="font-family:Georgia,serif;font-size:28px;font-weight:normal">€${total.toLocaleString('el-GR', { minimumFractionDigits: 2 })}</p>
        </div>
      </div>

      <a href="${process.env.NEXT_PUBLIC_APP_URL}/dashboard?project=${projectId}"
         style="display:inline-block;padding:12px 24px;background:#0A0A0A;color:#FAFAFA;text-decoration:none;border-radius:6px;font-weight:500">
        Δες BOQ & κάνε Export →
      </a>

      <p style="margin-top:20px;color:#9A9A9A;font-size:12px">
        Υπενθύμιση: Τα αυτόματα BOQ συνιστάται να επαληθεύονται από QS πριν από επίσημες προσφορές.
      </p>
    `),
  })
}

// ── Payment failed ────────────────────────────────────────────
export async function sendPaymentFailedEmail(to: string, name: string) {
  return resend.emails.send({
    from: FROM,
    to,
    subject: 'Πρόβλημα με την πληρωμή σου',
    html: emailLayout(`
      <h1 style="font-family:Georgia,serif;font-size:24px;margin-bottom:8px">Αποτυχία πληρωμής</h1>
      <p style="color:#5A5A5A;margin-bottom:24px">
        Δεν μπορέσαμε να χρεώσουμε την κάρτα σου για τη συνδρομή BOQNOW.
        Παρακαλώ ενημέρωσε τα στοιχεία πληρωμής για να μη διακοπεί η πρόσβασή σου.
      </p>
      <a href="${process.env.NEXT_PUBLIC_APP_URL}/dashboard/billing"
         style="display:inline-block;padding:12px 24px;background:#0A0A0A;color:#FAFAFA;text-decoration:none;border-radius:6px;font-weight:500">
        Ενημέρωσε στοιχεία πληρωμής →
      </a>
    `),
  })
}

// ── Waitlist confirmation ─────────────────────────────────────
export async function sendWaitlistEmail(to: string) {
  return resend.emails.send({
    from: FROM,
    to,
    subject: 'Είσαι στη λίστα! — BOQNOW',
    html: emailLayout(`
      <h1 style="font-family:Georgia,serif;font-size:24px;margin-bottom:8px">Σε έχουμε! ✓</h1>
      <p style="color:#5A5A5A;margin-bottom:24px">
        Μόλις κάναμε launch, θα είσαι από τους πρώτους που θα το μάθουν —
        με exclusive early-bird τιμή.
      </p>
      <p style="color:#5A5A5A;font-size:14px">
        Αν θέλεις να το δοκιμάσεις πριν το launch ή να δώσεις feedback,
        απάντησε σε αυτό το email.
      </p>
    `),
  })
}

// ── Shared layout ─────────────────────────────────────────────
function emailLayout(content: string): string {
  return `<!DOCTYPE html>
<html>
<head><meta charset="UTF-8"></head>
<body style="margin:0;padding:0;background:#F8F8F8;font-family:Inter,Arial,sans-serif">
  <div style="max-width:560px;margin:40px auto;background:#FAFAFA;border:1px solid #E0E0E0;border-radius:8px;overflow:hidden">
    <div style="background:#0A0A0A;padding:16px 28px">
      <span style="font-family:Georgia,serif;font-size:20px;color:#FAFAFA">BOQNOW</span>
    </div>
    <div style="padding:32px 28px">
      ${content}
    </div>
    <div style="padding:16px 28px;border-top:1px solid #F0F0F0;font-size:12px;color:#9A9A9A">
      BOQNOW · boqnow.com ·
      <a href="${process.env.NEXT_PUBLIC_APP_URL}/unsubscribe" style="color:#9A9A9A">Unsubscribe</a>
    </div>
  </div>
</body>
</html>`
}
