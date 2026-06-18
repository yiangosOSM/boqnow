// src/app/legal/privacy/page.tsx
export default function PrivacyPage() {
  return (
    <div style={{ maxWidth: 720, margin: '0 auto', padding: '60px 32px 80px', fontFamily: 'Inter, sans-serif', color: '#0A0A0A' }}>
      <div style={{ marginBottom: 48 }}>
        <a href="/" style={{ fontFamily: 'Georgia, serif', fontSize: 20, color: '#0A0A0A', textDecoration: 'none' }}>BOQNOW</a>
      </div>

      <h1 style={{ fontFamily: 'Georgia, serif', fontSize: 32, marginBottom: 8, letterSpacing: '-0.5px' }}>Πολιτική Απορρήτου & GDPR</h1>
      <p style={{ color: '#9A9A9A', fontSize: 13, marginBottom: 40 }}>Τελευταία ενημέρωση: Ιούνιος 2024</p>

      {[
        {
          title: '1. Υπεύθυνος Επεξεργασίας',
          body: 'Υπεύθυνος επεξεργασίας των προσωπικών δεδομένων είναι η εταιρεία που λειτουργεί το boqnow.com. Επικοινωνία: hello@boqnow.com',
        },
        {
          title: '2. Δεδομένα που Συλλέγουμε',
          body: 'Συλλέγουμε: (α) Δεδομένα λογαριασμού: email, όνομα, κωδικός (κρυπτογραφημένος μέσω Clerk). (β) Δεδομένα πληρωμής: επεξεργάζονται αποκλειστικά από Stripe — δεν αποθηκεύουμε στοιχεία κάρτας. (γ) Αρχεία που ανεβάζετε: σχέδια, PDF, Excel — αποθηκεύονται κρυπτογραφημένα στο Supabase Storage. (δ) Δεδομένα χρήσης: projects, BOQ που δημιουργούνται, IP για rate limiting.',
        },
        {
          title: '3. Χρήση Δεδομένων',
          body: 'Χρησιμοποιούμε τα δεδομένα σας για: παροχή της υπηρεσίας, χρέωση, βελτίωση της ακρίβειας AI (anonymized), υποστήριξη πελατών, και συμμόρφωση με νομικές υποχρεώσεις. Δεν πουλάμε δεδομένα σε τρίτους.',
        },
        {
          title: '4. Τρίτοι Πάροχοι (Subprocessors)',
          body: 'Anthropic (AI επεξεργασία αρχείων), Clerk (authentication), Stripe (πληρωμές), Supabase (database & storage), Vercel (hosting), Sentry (error monitoring), Upstash (rate limiting). Όλοι οι πάροχοι συμμορφώνονται με GDPR.',
        },
        {
          title: '5. Αποθήκευση Δεδομένων',
          body: 'Τα αρχεία που ανεβάζετε διατηρούνται για 90 ημέρες μετά τη δημιουργία του project. Τα BOQ δεδομένα διατηρούνται για όσο διαρκεί η συνδρομή σας. Κατά την ακύρωση, τα δεδομένα διαγράφονται εντός 30 ημερών.',
        },
        {
          title: '6. Δικαιώματα GDPR',
          body: 'Έχετε δικαίωμα: πρόσβασης στα δεδομένα σας, διόρθωσης, διαγραφής ("δικαίωμα στη λήθη"), φορητότητας, εναντίωσης στην επεξεργασία. Για άσκηση δικαιωμάτων: hello@boqnow.com. Απαντάμε εντός 30 ημερών.',
        },
        {
          title: '7. Διαγραφή Λογαριασμού',
          body: 'Μπορείτε να διαγράψετε τον λογαριασμό σας από τις ρυθμίσεις ή με αίτηση στο hello@boqnow.com. Όλα τα προσωπικά δεδομένα διαγράφονται εντός 30 ημερών.',
        },
        {
          title: '8. Cookies',
          body: 'Χρησιμοποιούμε μόνο απαραίτητα cookies για authentication (Clerk session) και λειτουργία της εφαρμογής. Δεν χρησιμοποιούμε cookies για διαφήμιση ή tracking.',
        },
        {
          title: '9. Ασφάλεια',
          body: 'Τα δεδομένα μεταφέρονται κρυπτογραφημένα (TLS). Τα αρχεία αποθηκεύονται κρυπτογραφημένα. Εφαρμόζουμε rate limiting, file validation, και audit logging.',
        },
        {
          title: '10. Μεταφορές Δεδομένων',
          body: 'Ορισμένοι πάροχοι (Anthropic, Vercel) επεξεργάζονται δεδομένα εκτός ΕΕ με κατάλληλες εγγυήσεις (SCCs). Το Supabase χρησιμοποιεί EU region.',
        },
        {
          title: '11. Επικοινωνία',
          body: 'DPO / Υπεύθυνος Απορρήτου: hello@boqnow.com · boqnow.com',
        },
      ].map(({ title, body }) => (
        <div key={title} style={{ marginBottom: 28 }}>
          <h2 style={{ fontSize: 16, fontWeight: 600, marginBottom: 8 }}>{title}</h2>
          <p style={{ fontSize: 14, color: '#5A5A5A', lineHeight: 1.7 }}>{body}</p>
        </div>
      ))}

      <div style={{ marginTop: 48, paddingTop: 24, borderTop: '1px solid #F0F0F0', fontSize: 12, color: '#9A9A9A' }}>
        <a href="/legal/terms" style={{ color: '#9A9A9A' }}>Όροι Χρήσης</a> ·{' '}
        <a href="/" style={{ color: '#9A9A9A' }}>Αρχική</a>
      </div>
    </div>
  )
}
