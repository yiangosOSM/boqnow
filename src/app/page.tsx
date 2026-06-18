// src/app/page.tsx — BOQNOW Landing Page v5 (React port)
'use client'
import Link from 'next/link'
import { useState } from 'react'
import { PLANS } from '@/lib/stripe'

const c = {
  black: '#0A0A0A', white: '#FAFAFA', off: '#F4F4F2',
  mid: '#5A5A5A', light: '#9A9A9A', border: '#E8E8E8',
  orange: '#E8622A', green: '#1A7A4A', yellow: '#F5C518',
}

const Logo = ({ size = 17 }: { size?: number }) => (
  <svg width={size} height={size} viewBox="0 0 22 22" fill="none">
    <rect x="3" y="2" width="2.5" height="18" fill="white" />
    <rect x="3" y="2" width="11" height="2.5" fill="white" />
    <rect x="3" y="10" width="9" height="2" fill="white" />
    <rect x="3" y="17.5" width="11" height="2.5" fill="white" />
    <rect x="13" y="2" width="2.5" height="10" rx="1" fill="white" opacity={0.5} />
    <rect x="11" y="10" width="2.5" height="10" rx="1" fill="white" opacity={0.5} />
  </svg>
)

export default function LandingPage() {
  const [lang, setLang] = useState<'el' | 'en'>('el')
  const [openFaq, setOpenFaq] = useState<number | null>(null)
  const [menuOpen, setMenuOpen] = useState(false)

  const t = {
    el: {
      navDemo: 'Demo BOQ', navPricing: 'Τιμές', navSignin: 'Σύνδεση', navCta: 'Δοκίμασε δωρεάν →',
      eyebrow: 'ΜΕΔΣΚ Compliant',
      h1a: 'BOQ σε ', h1em: 'λίγα λεπτά', h1b: '.', h1c: 'Όχι 3 μέρες.',
      tagline: 'Χωρίς QS. Χωρίς αναμονή. Χωρίς λάθη.',
      heroSub: 'Ανέβασε τα αρχιτεκτονικά σχέδια — πάρε πλήρες ΜΕΔΣΚ Bill of Quantities έτοιμο για προσφορά.',
      ctaPrimary: 'Ξεκίνα — 7 μέρες δωρεάν', ctaDemo: '👁 Δες Demo BOQ',
      heroNote: 'Δεν απαιτείται πιστωτική κάρτα',
      privacyNote: 'Τα σχέδιά σου είναι ασφαλή — δεν κοινοποιούνται σε τρίτους',
      sampleLink: '↓ Κατέβασε δείγμα BOQ (Excel)', sampleNote: 'χωρίς εγγραφή',
      trust1: 'ΜΕΔΣΚ compliance', trust2: '16 κατηγορίες', trust3: 'Export XLSX / PDF',
      howEyebrow: 'Διαδικασία', howH2a: 'Από σχέδιο σε', howH2b: 'προσφορά σε 3 βήματα',
      step1h: 'Ανέβασε τα σχέδια', step1p: 'Drag & drop όλα τα αρχεία. PDF, Excel, Word, DWG — έως 50 αρχεία ταυτόχρονα. Αρχιτεκτονικά, ηλεκτρολογικά, υδραυλικά.',
      step2h: 'AI ανάλυση', step2p: 'Αναλύει κάθε σελίδα. Εξάγει ποσότητες, ελέγχει αναλογίες, εντοπίζει παραλείψεις. Κάθε ποσότητα με source και calculation.',
      step3h: 'Έτοιμο BOQ', step3p: 'ΜΕΔΣΚ-compliant Δελτίο Ποσοτήτων με κωδικούς, ποσότητες και τιμές αγοράς. Export σε Excel, PDF ή CSV.',
      forwhoEyebrow: 'Για ποιον', forwhoH2a: 'Για κάθε επαγγελματία', forwhoH2b: 'της κατασκευής',
      role1Title: 'Γενικοί Εργολάβοι', role1P: 'Βγάλε προσφορά πριν προλάβει ο ανταγωνισμός. Χωρίς αναμονή εξωτερικού QS — χωρίς χαμένες ευκαιρίες.',
      test1: '«Πριν έχανα 2 μέρες σε κάθε BOQ. Τώρα έχω draft σε 1 ώρα και δίνω στον QS μου να τελειοποιήσει.»', test1Auth: 'Μιχάλης Π. — Εργολάβος, Λεμεσός',
      role2Title: 'Υπεργολάβοι', role2P: 'Ηλεκτρολογικά, υδραυλικά, αλουμίνια — αναλύεις μόνο τα δικά σου σχέδια και βγάζεις προσφορά αμέσως.',
      test2: '«Ανεβάζω μόνο τα ηλεκτρολογικά σχέδια και παίρνω αμέσως λίστα υλικών και εργασιών.»', test2Auth: 'Σταύρος Κ. — Ηλεκτρολόγος Εργολάβος',
      role3Title: 'Αρχιτέκτονες & Μελετητές', role3P: 'Εκτίμηση κόστους για τον πελάτη στο πρώτο meeting — χωρίς να ζητάς προσφορά εργολάβου.',
      test3: '«Δείχνω εκτίμηση κόστους ήδη από το στάδιο της μελέτης. Τεράστιο πλεονέκτημα.»', test3Auth: 'Ελένη Α. — Αρχιτέκτων, Λευκωσία',
      role4Title: 'Διαχειριστές Έργων', role4P: 'Budget control, cost tracking, σύγκριση προσφορών. Βλέπεις πού αποκλίνει ο εργολάβος αμέσως.',
      test4: '«Συγκρίνω το BOQ του BOQNOW με την προσφορά του εργολάβου και βλέπω αμέσως πού υπερτιμολογεί.»', test4Auth: 'Νίκος Μ. — Project Manager, Λεμεσός',
      pricingEyebrow: 'Τιμολόγηση', pricingH2a: 'Απλά τιμολόγια.', pricingH2b: 'Καμία έκπληξη.',
      planPeriod: '/μήνα · 7 μέρες δωρεάν', planProName: 'Pro · Δημοφιλές', planAgencyName: 'Agency · Γραφεία & QS',
      fS1: `${PLANS.STARTER.projectsPerMonth} projects/μήνα`, fS2: '50 αρχεία/project',
      fP1: `${PLANS.PRO.projectsPerMonth} projects/μήνα`, fP2: 'Απεριόριστα αρχεία', fP4: 'Live τιμές αγοράς', fP5: 'Priority support',
      fA1: 'Unlimited projects', fA2: 'White-label exports με το δικό σου logo', fA3: 'Τιμές Μονάδας', fA4: 'API access για ενσωμάτωση',
      planCtaFree: 'Ξεκίνα δωρεάν',
      projectNote: '* 1 project = 1 κτίριο ή έργο, ανεξαρτήτως αριθμού σχεδίων',
      pricingAltText: 'Δεν θέλεις συνδρομή; →', pricingAltLink: '€50 ανά BOQ', pricingAltSuffix: 'χωρίς δέσμευση',
      faqEyebrow: 'Συχνές Ερωτήσεις', faqH2a: 'Έχεις απορίες;', faqH2b: 'Έχουμε απαντήσεις.',
      faqs: [
        { q: 'Τι γίνεται αν το σχέδιο έχει κακή ποιότητα ή είναι σκαναρισμένο;', a: 'Το BOQNOW επεξεργάζεται αρχεία με χαμηλή ανάλυση και σκαναρισμένα PDF. Σε περιπτώσεις όπου η εξαγωγή ποσοτήτων δεν είναι βέβαιη, το σύστημα επισημαίνει αυτόματα τα στοιχεία για έλεγχο — δεν υποθέτει ποτέ χωρίς να σε ενημερώσει.' },
        { q: 'Πώς εξασφαλίζεται η ακρίβεια του BOQ;', a: 'Το AI ακολουθεί QS-validated AI accuracy methodology, εκπαιδευμένη πάνω στο ΜΕΔΣΚ πρότυπο, και αντιστοιχεί κάθε εξαγόμενη ποσότητα στον σωστό κωδικό. Κάθε γραμμή BOQ συνοδεύεται από source reference ώστε να μπορείς να ελέγξεις και να διορθώσεις αν χρειαστεί.' },
        { q: 'Τα σχέδιά μου είναι ασφαλή; Ποιος έχει πρόσβαση;', a: 'Τα αρχεία σου αποθηκεύονται κρυπτογραφημένα και δεν κοινοποιούνται σε τρίτους ποτέ. Χρησιμοποιούνται αποκλειστικά για την επεξεργασία του δικού σου project. Είμαστε GDPR compliant.' },
        { q: 'Δέχεται DWG αρχεία από AutoCAD;', a: 'Ναι. Το BOQNOW δέχεται DWG και DXF αρχεία. Εξάγει ποσότητες από layers και block attributes — ιδιαίτερα χρήσιμο για ηλεκτρολογικά και υδραυλικά σχέδια με structured CAD data.' },
        { q: 'Μπορώ να επεξεργαστώ το BOQ πριν το εξαγάγω;', a: 'Ναι. Μετά την παραγωγή μπορείς να επεξεργαστείς ποσότητες, να προσθέσεις γραμμές και να ορίσεις τιμές μονάδας απευθείας στο interface, πριν κάνεις export σε Excel, PDF ή CSV.' },
      ],
      finalH2a: 'Σταμάτα να χάνεις', finalH2em: 'BOQ', finalH2b: 'ώρες σε ',
      finalP: 'Ο ανταγωνισμός σου στέλνει ήδη προσφορές πιο γρήγορα. Κάθε μέρα χωρίς BOQNOW είναι μια χαμένη ευκαιρία.',
      finalCta: 'Ξεκίνα δωρεάν — 7 μέρες', finalDemo: '👁 Δες Demo BOQ',
      mobDemo: 'Demo BOQ', mobPricing: 'Τιμές', mobSignin: 'Σύνδεση', mobCta: 'Δοκίμασε δωρεάν →',
      footerLinks: ['Demo', 'Τιμές', 'Waitlist', 'hello@boqnow.com', 'Όροι', 'Απόρρητο'],
      statTime: 'Χρόνος δημιουργίας', statTime2: 'πλήρους BOQ',
      stat16: 'ΜΕΔΣΚ κατηγορίες', stat16b: 'πλήρως καλυπτόμενες',
      stat50: 'Αρχεία ανά project', stat50b: 'PDF · Excel · Word · DWG',
      stat0: 'Κόστος δοκιμής', stat0b: '7 μέρες δωρεάν',
      socialProof: 'Σχεδιάστηκε από εργολάβους, για εργολάβους — σε Κύπρο & Ελλάδα',
      trustBar16: 'ΜΕΔΣΚ κατηγορίες', trustBarAcc: 'QS-validated methodology', trustBar50: 'αρχεία ανά project', trustBarTime: 'μέσος χρόνος',
    },
    en: {
      navDemo: 'Demo BOQ', navPricing: 'Pricing', navSignin: 'Sign in', navCta: 'Try for free →',
      eyebrow: 'ΜΕΔΣΚ Compliant',
      h1a: 'BOQ in ', h1em: 'minutes', h1b: '.', h1c: 'Not 3 days.',
      tagline: 'No QS. No waiting. No errors.',
      heroSub: 'Upload your drawings — get a full ΜΕΔΣΚ Bill of Quantities ready for submission.',
      ctaPrimary: 'Start — 7 days free', ctaDemo: '👁 See Demo BOQ',
      heroNote: 'No credit card required',
      privacyNote: 'Your drawings are safe — never shared with third parties',
      sampleLink: '↓ Download sample BOQ (Excel)', sampleNote: 'no sign-up needed',
      trust1: 'ΜΕΔΣΚ compliance', trust2: '16 categories', trust3: 'Export XLSX / PDF',
      howEyebrow: 'How it works', howH2a: 'From drawings to', howH2b: 'quote in 3 steps',
      step1h: 'Upload your drawings', step1p: 'Drag & drop all files. PDF, Excel, Word, DWG — up to 50 files at once. Architectural, electrical, plumbing.',
      step2h: 'AI analysis', step2p: 'Analyses every page. Extracts quantities, checks ratios, flags omissions. Every quantity with source and calculation.',
      step3h: 'BOQ ready', step3p: 'ΜΕΔΣΚ-compliant Bill of Quantities with codes, quantities and market prices. Export to Excel, PDF or CSV.',
      forwhoEyebrow: "Who it's for", forwhoH2a: 'For every construction', forwhoH2b: 'professional',
      role1Title: 'General Contractors', role1P: 'Submit your quote before the competition does. No waiting for an external QS — no missed opportunities.',
      test1: '"I used to spend 2 days on every BOQ. Now I have a draft in 1 hour and give it to my QS to finalize."', test1Auth: 'Michalis P. — Contractor, Limassol',
      role2Title: 'Subcontractors', role2P: 'Electrical, plumbing, aluminium — analyse only your drawings and quote immediately.',
      test2: '"I upload only the electrical drawings and instantly get a list of materials and works."', test2Auth: 'Stavros K. — Electrical Contractor',
      role3Title: 'Architects & Engineers', role3P: 'Cost estimate for the client at the first meeting — without requesting a contractor quote.',
      test3: '"I show a cost estimate already at design stage. Huge advantage."', test3Auth: 'Eleni A. — Architect, Nicosia',
      role4Title: 'Project Managers', role4P: 'Budget control, cost tracking, quote comparison. See immediately where the contractor deviates.',
      test4: '"I compare the BOQNOW BOQ with the contractor\'s quote and instantly see where they\'re overcharging."', test4Auth: 'Nikos M. — Project Manager, Limassol',
      pricingEyebrow: 'Pricing', pricingH2a: 'Simple pricing.', pricingH2b: 'No surprises.',
      planPeriod: '/month · 7 days free', planProName: 'Pro · Most Popular', planAgencyName: 'Agency · Offices & QS',
      fS1: `${PLANS.STARTER.projectsPerMonth} projects/month`, fS2: '50 files/project',
      fP1: `${PLANS.PRO.projectsPerMonth} projects/month`, fP2: 'Unlimited files', fP4: 'Live market prices', fP5: 'Priority support',
      fA1: 'Unlimited projects', fA2: 'White-label exports with your logo', fA3: 'Custom unit rates', fA4: 'API access for integration',
      planCtaFree: 'Start free',
      projectNote: '* 1 project = 1 building or site, regardless of number of files',
      pricingAltText: 'No subscription?', pricingAltLink: '€50 per BOQ', pricingAltSuffix: 'no commitment',
      faqEyebrow: 'FAQ', faqH2a: 'Got questions?', faqH2b: 'We have answers.',
      faqs: [
        { q: 'What if the drawing is poor quality or scanned?', a: 'BOQNOW processes low-resolution and scanned PDFs. Where quantity extraction is uncertain, the system automatically flags those items for review — it never assumes without telling you.' },
        { q: 'How is BOQ accuracy ensured?', a: 'The AI follows a QS-validated AI accuracy methodology, trained on the ΜΕΔΣΚ standard, and maps every extracted quantity to the correct code. Every BOQ line includes a source reference so you can verify and correct if needed.' },
        { q: 'Are my drawings safe? Who has access?', a: 'Your files are stored encrypted and never shared with third parties. They are used exclusively to process your project. We are GDPR compliant.' },
        { q: 'Does it accept DWG files from AutoCAD?', a: 'Yes. BOQNOW accepts DWG and DXF files. It extracts quantities from layers and block attributes — especially useful for electrical and plumbing drawings with structured CAD data.' },
        { q: 'Can I edit the BOQ before exporting?', a: 'Yes. After generation you can edit quantities, add lines and set unit rates directly in the interface before exporting to Excel, PDF or CSV.' },
      ],
      finalH2a: 'Stop wasting hours', finalH2em: 'BOQ', finalH2b: 'on ',
      finalP: 'Your competition is already sending quotes faster. Every day without BOQNOW is a missed opportunity.',
      finalCta: 'Start free — 7 days', finalDemo: '👁 See Demo BOQ',
      mobDemo: 'Demo BOQ', mobPricing: 'Pricing', mobSignin: 'Sign in', mobCta: 'Try for free →',
      footerLinks: ['Demo', 'Pricing', 'Waitlist', 'hello@boqnow.com', 'Terms', 'Privacy'],
      statTime: 'Time to generate', statTime2: 'a full BOQ',
      stat16: 'ΜΕΔΣΚ categories', stat16b: 'fully covered',
      stat50: 'Files per project', stat50b: 'PDF · Excel · Word · DWG',
      stat0: 'Cost to try', stat0b: '7 days free',
      socialProof: 'Built by contractors, for contractors — in Cyprus & Greece',
      trustBar16: 'ΜΕΔΣΚ categories', trustBarAcc: 'QS-validated methodology', trustBar50: 'files per project', trustBarTime: 'avg. time',
    },
  }[lang]

  const prices = { starter: PLANS.STARTER.price, pro: PLANS.PRO.price, agency: PLANS.AGENCY.price }

  const plans = [
    { name: 'Starter', price: prices.starter, features: [t.fS1, t.fS2, 'Export Excel + PDF', 'ΜΕΔΣΚ compliance'] },
    { name: t.planProName, price: prices.pro, featured: true, features: [t.fP1, t.fP2, 'Export + CSV', t.fP4, t.fP5] },
    { name: t.planAgencyName, price: prices.agency, features: [t.fA1, t.fA2, t.fA3, t.fA4, 'Dedicated support'] },
  ]

  return (
    <div style={{ background: c.white, color: c.black, fontFamily: "'Inter', -apple-system, BlinkMacSystemFont, sans-serif", fontSize: 16, lineHeight: 1.5, overflowX: 'hidden' as const }}>

      {/* ── NAV ── */}
      <nav style={{ position: 'sticky' as const, top: 0, zIndex: 100, height: 60, padding: '0 48px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', background: 'rgba(250,250,250,0.95)', backdropFilter: 'blur(16px)', borderBottom: `1px solid ${c.border}` }}>
        <Link href="/" style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <div style={{ width: 30, height: 30, background: c.black, borderRadius: 6, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}><Logo /></div>
          <span style={{ fontFamily: 'Georgia, serif', fontSize: 20, letterSpacing: '-0.5px', color: c.black, lineHeight: 1 }}>BOQNOW</span>
        </Link>
        <div style={{ display: 'flex', gap: 32, alignItems: 'center' }} className="nav-links-desktop">
          <Link href="/demo" style={{ fontSize: 14, color: c.mid }}>{t.navDemo}</Link>
          <Link href="/pricing" style={{ fontSize: 14, color: c.mid }}>{t.navPricing}</Link>
          <Link href="/sign-in" style={{ fontSize: 14, color: c.mid }}>{t.navSignin}</Link>
          <div style={{ display: 'flex', alignItems: 'center', border: `1.5px solid ${c.border}`, borderRadius: 6, overflow: 'hidden', fontSize: 13, fontWeight: 700 }}>
            <button onClick={() => setLang('el')} style={{ padding: '5px 10px', cursor: 'pointer', background: lang === 'el' ? c.black : 'transparent', color: lang === 'el' ? c.white : c.light, border: 'none', fontSize: 13, fontWeight: 700, fontFamily: 'inherit' }}>ΕΛ</button>
            <div style={{ width: 1, background: c.border }} />
            <button onClick={() => setLang('en')} style={{ padding: '5px 10px', cursor: 'pointer', background: lang === 'en' ? c.black : 'transparent', color: lang === 'en' ? c.white : c.light, border: 'none', fontSize: 13, fontWeight: 700, fontFamily: 'inherit' }}>EN</button>
          </div>
          <Link href="/sign-up" style={{ padding: '9px 22px', background: c.orange, color: '#fff', borderRadius: 7, fontSize: 14, fontWeight: 600 }}>{t.navCta}</Link>
        </div>
        <button onClick={() => setMenuOpen(!menuOpen)} aria-label="Menu" className="hamburger-btn" style={{ display: 'none', flexDirection: 'column' as const, gap: 5, background: 'none', border: 'none', cursor: 'pointer', padding: 4 }}>
          <span style={{ display: 'block', width: 22, height: 2, background: c.black, borderRadius: 2, transform: menuOpen ? 'translateY(7px) rotate(45deg)' : 'none', transition: 'all 0.2s' }} />
          <span style={{ display: 'block', width: 22, height: 2, background: c.black, borderRadius: 2, opacity: menuOpen ? 0 : 1, transition: 'all 0.2s' }} />
          <span style={{ display: 'block', width: 22, height: 2, background: c.black, borderRadius: 2, transform: menuOpen ? 'translateY(-7px) rotate(-45deg)' : 'none', transition: 'all 0.2s' }} />
        </button>
      </nav>

      {/* ── MOBILE MENU ── */}
      {menuOpen && (
        <div style={{ position: 'fixed' as const, top: 60, left: 0, right: 0, background: 'rgba(250,250,250,0.98)', backdropFilter: 'blur(16px)', borderBottom: `1px solid ${c.border}`, display: 'flex', flexDirection: 'column' as const, padding: '20px 24px', gap: 4, zIndex: 99 }}>
          <Link href="/demo" onClick={() => setMenuOpen(false)} style={{ fontSize: 16, fontWeight: 500, color: c.black, padding: '12px 0', borderBottom: `1px solid ${c.border}` }}>{t.mobDemo}</Link>
          <Link href="/pricing" onClick={() => setMenuOpen(false)} style={{ fontSize: 16, fontWeight: 500, color: c.black, padding: '12px 0', borderBottom: `1px solid ${c.border}` }}>{t.mobPricing}</Link>
          <Link href="/sign-in" onClick={() => setMenuOpen(false)} style={{ fontSize: 16, fontWeight: 500, color: c.black, padding: '12px 0', borderBottom: `1px solid ${c.border}` }}>{t.mobSignin}</Link>
          <div style={{ display: 'flex', alignItems: 'center', border: `1.5px solid ${c.border}`, borderRadius: 6, overflow: 'hidden', fontSize: 13, fontWeight: 700, margin: '8px 0', width: 'fit-content' }}>
            <button onClick={() => { setLang('el') }} style={{ padding: '5px 10px', cursor: 'pointer', background: lang === 'el' ? c.black : 'transparent', color: lang === 'el' ? c.white : c.light, border: 'none', fontSize: 13, fontWeight: 700, fontFamily: 'inherit' }}>ΕΛ</button>
            <div style={{ width: 1, background: c.border }} />
            <button onClick={() => { setLang('en') }} style={{ padding: '5px 10px', cursor: 'pointer', background: lang === 'en' ? c.black : 'transparent', color: lang === 'en' ? c.white : c.light, border: 'none', fontSize: 13, fontWeight: 700, fontFamily: 'inherit' }}>EN</button>
          </div>
          <Link href="/sign-up" onClick={() => setMenuOpen(false)} style={{ marginTop: 12, textAlign: 'center' as const, padding: 14, fontSize: 15, background: c.orange, color: '#fff', borderRadius: 7, fontWeight: 600 }}>{t.mobCta}</Link>
        </div>
      )}

      {/* ── HERO ── */}
      <section className="hero-grid" style={{ maxWidth: 1160, margin: '0 auto', padding: '88px 48px 72px', display: 'grid', gridTemplateColumns: '1fr 1.05fr', gap: 72, alignItems: 'center' }}>
        <div>
          <div style={{ display: 'inline-flex', alignItems: 'center', gap: 8, fontSize: 11, fontWeight: 700, letterSpacing: '0.14em', textTransform: 'uppercase' as const, color: c.mid, marginBottom: 24, border: `1px solid ${c.border}`, padding: '5px 12px', borderRadius: 20, background: c.off }}>
            <span style={{ width: 6, height: 6, borderRadius: '50%', background: c.green }} />
            <span>{t.eyebrow}</span>
          </div>
          <h1 style={{ fontFamily: 'Georgia, serif', fontSize: 'clamp(40px, 4.8vw, 60px)', lineHeight: 1.04, letterSpacing: '-3px', marginBottom: 10, color: c.black }}>
            {t.h1a}<em style={{ fontStyle: 'normal', color: c.orange }}>{t.h1em}</em>{t.h1b}<br />{t.h1c}
          </h1>
          <p style={{ fontSize: 16, fontWeight: 700, color: c.mid, marginBottom: 16, letterSpacing: '-0.2px' }}>{t.tagline}</p>
          <p style={{ fontSize: 17, color: c.mid, lineHeight: 1.65, marginBottom: 8, maxWidth: 430 }}>{t.heroSub}</p>
          <div style={{ fontSize: 12, color: c.light, marginBottom: 36, display: 'flex', alignItems: 'center', gap: 6, flexWrap: 'wrap' as const }}>
            {['PDF', 'Excel', 'Word', 'DWG'].map(f => (
              <span key={f} style={{ background: c.off, border: `1px solid ${c.border}`, padding: '3px 9px', borderRadius: 4, fontSize: 11, fontWeight: 600, color: c.mid, letterSpacing: '0.05em' }}>{f}</span>
            ))}
            <span style={{ color: c.light }}>— {lang === 'el' ? 'όλα τα formats' : 'all formats'}</span>
          </div>
          <div style={{ display: 'flex', gap: 12, alignItems: 'center', flexWrap: 'wrap' as const }}>
            <Link href="/sign-up" style={{ padding: '15px 32px', background: c.orange, color: '#fff', borderRadius: 8, fontSize: 16, fontWeight: 700, boxShadow: '0 4px 16px rgba(232,98,42,0.3)' }}>{t.ctaPrimary}</Link>
            <Link href="/demo" style={{ padding: '15px 28px', background: '#fff', color: c.black, borderRadius: 8, fontSize: 15, fontWeight: 600, border: `1.5px solid ${c.border}` }}>{t.ctaDemo}</Link>
          </div>
          <p style={{ marginTop: 14, fontSize: 12, color: c.light }}>{t.heroNote}</p>
          <div style={{ display: 'flex', gap: 20, marginTop: 20, flexWrap: 'wrap' as const }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 12, color: c.mid, fontWeight: 500 }}><span>✓</span> {t.trust1}</div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 12, color: c.mid, fontWeight: 500 }}><span>✓</span> {t.trust2}</div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 12, color: c.mid, fontWeight: 500 }}><span>✓</span> {t.trust3}</div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 12, color: c.mid, fontWeight: 500 }}><span>🔒</span> {t.privacyNote}</div>
          </div>
          <div style={{ marginTop: 16 }}>
            <a href="/sample-boq.xlsx" style={{ fontSize: 13, color: c.mid, borderBottom: `1px solid ${c.border}`, paddingBottom: 1 }}>{t.sampleLink}</a>
            <span style={{ fontSize: 12, color: c.light, marginLeft: 8 }}>{t.sampleNote}</span>
          </div>
        </div>

        {/* Hero visual — desktop only */}
        <div className="hero-visual-desktop" style={{ position: 'relative' as const, display: 'flex', flexDirection: 'column' as const, alignItems: 'center', gap: 0 }}>
          <div style={{ display: 'flex', flexDirection: 'column' as const, alignItems: 'center', gap: 0, width: '100%' }}>

            <div style={{ width: '100%', borderRadius: 12, border: `1px solid ${c.border}`, overflow: 'hidden', background: '#fff', boxShadow: '0 4px 24px rgba(0,0,0,0.06)' }}>
              <div style={{ padding: '10px 16px', display: 'flex', alignItems: 'center', gap: 8, borderBottom: `1px solid ${c.border}`, background: '#FFF5F0', borderColor: '#FFD5C0' }}>
                <div style={{ display: 'flex', gap: 5 }}>
                  <div style={{ width: 9, height: 9, borderRadius: '50%', background: '#FF6058' }} />
                  <div style={{ width: 9, height: 9, borderRadius: '50%', background: '#FFBD2E' }} />
                  <div style={{ width: 9, height: 9, borderRadius: '50%', background: '#28CA41' }} />
                </div>
                <span style={{ fontSize: 11, fontWeight: 600, color: '#8B3A1A', letterSpacing: '0.05em', flex: 1 }}>{lang === 'el' ? 'Αρχιτεκτονικά Σχέδια · Κατοικία Παπαδόπουλος' : 'Architectural Drawings · Papadopoulos House'}</span>
                <span style={{ fontSize: 9, fontWeight: 700, letterSpacing: '0.08em', textTransform: 'uppercase' as const, padding: '2px 7px', borderRadius: 3, background: '#FFF0E8', color: '#E8622A' }}>{lang === 'el' ? '3 αρχεία' : '3 files'}</span>
              </div>
              <div style={{ padding: 16, display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
                <div style={{ background: c.off, borderRadius: 8, aspectRatio: '0.75', display: 'flex', flexDirection: 'column' as const, gap: 4, padding: 8, border: `1px solid ${c.border}`, position: 'relative' as const, overflow: 'hidden' }}>
                  <div style={{ height: 2, borderRadius: 1, background: '#D0D0D0', width: '95%' }} />
                  <div style={{ height: 2, borderRadius: 1, background: '#D0D0D0', width: '80%' }} />
                  <div style={{ background: '#E0E0E0', borderRadius: 3, flex: 1, position: 'relative' as const, overflow: 'hidden' }} />
                  <div style={{ height: 2, borderRadius: 1, background: '#D0D0D0', width: '60%' }} />
                  <div style={{ position: 'absolute' as const, bottom: 4, right: 6, fontSize: 8, fontWeight: 700, color: c.light, letterSpacing: '0.1em' }}>{lang === 'el' ? 'ΚΑΤΟΨΗ' : 'PLAN'}</div>
                </div>
                <div style={{ background: c.off, borderRadius: 8, aspectRatio: '0.75', display: 'flex', flexDirection: 'column' as const, gap: 4, padding: 8, border: `1px solid ${c.border}`, position: 'relative' as const, overflow: 'hidden' }}>
                  <div style={{ height: 2, borderRadius: 1, background: '#D0D0D0', width: '80%' }} />
                  <div style={{ background: '#D8E8F0', borderRadius: 3, flex: 1, position: 'relative' as const, overflow: 'hidden' }} />
                  <div style={{ height: 2, borderRadius: 1, background: '#D0D0D0', width: '95%' }} />
                  <div style={{ height: 2, borderRadius: 1, background: '#D0D0D0', width: '60%' }} />
                  <div style={{ position: 'absolute' as const, bottom: 4, right: 6, fontSize: 8, fontWeight: 700, color: c.light, letterSpacing: '0.1em' }}>{lang === 'el' ? 'ΤΟΜΗ' : 'SECTION'}</div>
                </div>
              </div>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column' as const, alignItems: 'center', gap: 0, padding: '8px 0', zIndex: 2 }}>
              <div style={{ width: 2, height: 20, background: `linear-gradient(to bottom, ${c.border}, ${c.orange})` }} />
              <div style={{ background: c.black, color: c.white, padding: '8px 18px', borderRadius: 20, fontSize: 12, fontWeight: 700, letterSpacing: '0.05em', display: 'flex', alignItems: 'center', gap: 7, boxShadow: '0 4px 16px rgba(0,0,0,0.15)' }}>
                <div style={{ width: 12, height: 12, borderRadius: '50%', border: '2px solid rgba(255,255,255,0.3)', borderTopColor: c.orange }} />
                {lang === 'el' ? 'AI ανάλυση σε εξέλιξη' : 'AI analysis in progress'}
              </div>
              <div style={{ width: 2, height: 20, background: `linear-gradient(to bottom, ${c.orange}, ${c.border})` }} />
            </div>

            <div style={{ width: '100%', borderRadius: 12, border: `1px solid ${c.border}`, overflow: 'hidden', background: '#fff', boxShadow: '0 4px 24px rgba(0,0,0,0.06)' }}>
              <div style={{ background: c.black, padding: '12px 16px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span style={{ fontFamily: 'Georgia, serif', fontSize: 12, color: c.white }}>{lang === 'el' ? 'ΜΕΔΣΚ Bill of Quantities · 148m²' : 'ΜΕΔΣΚ Bill of Quantities · 148m²'}</span>
                <span style={{ fontSize: 9, fontWeight: 700, letterSpacing: '0.08em', padding: '2px 7px', borderRadius: 3, background: c.orange, color: '#fff', textTransform: 'uppercase' as const }}>{lang === 'el' ? '✓ Έτοιμο' : '✓ Ready'}</span>
              </div>
              <table style={{ width: '100%', borderCollapse: 'collapse' as const }}>
                <thead>
                  <tr style={{ background: '#F8F8F8', borderBottom: `1px solid ${c.border}` }}>
                    <th style={{ padding: '6px 12px', fontSize: 9, fontWeight: 700, color: c.light, textTransform: 'uppercase' as const, letterSpacing: '0.08em', textAlign: 'left' as const }}>{lang === 'el' ? 'Α/Α' : 'No.'}</th>
                    <th style={{ padding: '6px 12px', fontSize: 9, fontWeight: 700, color: c.light, textTransform: 'uppercase' as const, letterSpacing: '0.08em', textAlign: 'left' as const }}>{lang === 'el' ? 'Περιγραφή' : 'Description'}</th>
                    <th style={{ padding: '6px 12px', fontSize: 9, fontWeight: 700, color: c.light, textTransform: 'uppercase' as const, letterSpacing: '0.08em', textAlign: 'left' as const }}>{lang === 'el' ? 'Μον.' : 'Unit'}</th>
                    <th style={{ padding: '6px 12px', fontSize: 9, fontWeight: 700, color: c.light, textTransform: 'uppercase' as const, letterSpacing: '0.08em', textAlign: 'right' as const }}>{lang === 'el' ? 'Σύν.' : 'Total'}</th>
                  </tr>
                </thead>
                <tbody>
                  <tr><td colSpan={4} style={{ background: '#F2F2F0', fontSize: 10, fontWeight: 700, textTransform: 'uppercase' as const, letterSpacing: '0.06em', color: c.mid, padding: '5px 12px' }}>3. {lang === 'el' ? 'Σκυρόδεμα & Οπλισμός' : 'Concrete & Reinforcement'}</td></tr>
                  <tr>
                    <td style={{ padding: '7px 12px', fontSize: 11, borderBottom: '1px solid #F5F5F5', color: c.light }}>3.1</td>
                    <td style={{ padding: '7px 12px', fontSize: 11, borderBottom: '1px solid #F5F5F5' }}>C25/30 {lang === 'el' ? 'πλάκες' : 'slabs'}<span style={{ fontSize: 9, fontWeight: 700, padding: '1px 4px', borderRadius: 2, marginLeft: 4, background: '#E8F5EE', color: c.green }}>✓✓</span></td>
                    <td style={{ padding: '7px 12px', fontSize: 11, borderBottom: '1px solid #F5F5F5', color: c.light }}>m³</td>
                    <td style={{ padding: '7px 12px', fontSize: 12, borderBottom: '1px solid #F5F5F5', textAlign: 'right' as const, fontFamily: 'Georgia, serif', fontWeight: 600 }}>€14.280</td>
                  </tr>
                  <tr>
                    <td style={{ padding: '7px 12px', fontSize: 11, borderBottom: '1px solid #F5F5F5', color: c.light }}>3.2</td>
                    <td style={{ padding: '7px 12px', fontSize: 11, borderBottom: '1px solid #F5F5F5' }}>{lang === 'el' ? 'Οπλισμός S500' : 'S500 Reinforcement'}<span style={{ fontSize: 9, fontWeight: 700, padding: '1px 4px', borderRadius: 2, marginLeft: 4, background: '#E8F5EE', color: c.green }}>✓✓</span></td>
                    <td style={{ padding: '7px 12px', fontSize: 11, borderBottom: '1px solid #F5F5F5', color: c.light }}>kg</td>
                    <td style={{ padding: '7px 12px', fontSize: 12, borderBottom: '1px solid #F5F5F5', textAlign: 'right' as const, fontFamily: 'Georgia, serif', fontWeight: 600 }}>€11.890</td>
                  </tr>
                  <tr><td colSpan={4} style={{ background: '#F2F2F0', fontSize: 10, fontWeight: 700, textTransform: 'uppercase' as const, letterSpacing: '0.06em', color: c.mid, padding: '5px 12px' }}>6. {lang === 'el' ? 'Δάπεδα & Επενδύσεις' : 'Flooring & Finishes'}</td></tr>
                  <tr>
                    <td style={{ padding: '7px 12px', fontSize: 11, borderBottom: '1px solid #F5F5F5', color: c.light }}>6.1</td>
                    <td style={{ padding: '7px 12px', fontSize: 11, borderBottom: '1px solid #F5F5F5' }}>{lang === 'el' ? 'Πλακίδια 60×60' : 'Tiles 60×60'}<span style={{ fontSize: 9, fontWeight: 700, padding: '1px 4px', borderRadius: 2, marginLeft: 4, background: '#E8F5EE', color: c.green }}>✓✓</span></td>
                    <td style={{ padding: '7px 12px', fontSize: 11, borderBottom: '1px solid #F5F5F5', color: c.light }}>m²</td>
                    <td style={{ padding: '7px 12px', fontSize: 12, borderBottom: '1px solid #F5F5F5', textAlign: 'right' as const, fontFamily: 'Georgia, serif', fontWeight: 600 }}>€8.140</td>
                  </tr>
                  <tr><td colSpan={4} style={{ background: '#F2F2F0', fontSize: 10, fontWeight: 700, textTransform: 'uppercase' as const, letterSpacing: '0.06em', color: c.mid, padding: '5px 12px' }}>9. {lang === 'el' ? 'Αλουμίνια & Κουφώματα' : 'Aluminium & Joinery'}</td></tr>
                  <tr>
                    <td style={{ padding: '7px 12px', fontSize: 11, borderBottom: '1px solid #F5F5F5', color: c.light }}>9.1</td>
                    <td style={{ padding: '7px 12px', fontSize: 11, borderBottom: '1px solid #F5F5F5' }}>Rabel premium<span style={{ fontSize: 9, fontWeight: 700, padding: '1px 4px', borderRadius: 2, marginLeft: 4, background: '#FFF8E0', color: '#8B6914' }}>✓</span></td>
                    <td style={{ padding: '7px 12px', fontSize: 11, borderBottom: '1px solid #F5F5F5', color: c.light }}>m²</td>
                    <td style={{ padding: '7px 12px', fontSize: 12, borderBottom: '1px solid #F5F5F5', textAlign: 'right' as const, fontFamily: 'Georgia, serif', fontWeight: 600 }}>€20.160</td>
                  </tr>
                  <tr>
                    <td colSpan={3} style={{ background: c.black, color: `${c.white} !important`, fontWeight: 700, padding: '10px 12px' }}>{lang === 'el' ? 'Γενικό Σύνολο' : 'Grand Total'}</td>
                    <td style={{ background: c.black, fontWeight: 700, padding: '10px 12px', textAlign: 'right' as const, fontFamily: 'Georgia, serif', fontSize: 14, color: c.orange }}>€187.450</td>
                  </tr>
                </tbody>
              </table>
              <div style={{ padding: '8px 12px', borderTop: `1px solid ${c.border}`, display: 'flex', gap: 6, background: '#FAFAFA' }}>
                <span style={{ fontSize: 10, fontWeight: 700, padding: '4px 10px', border: `1.5px solid ${c.border}`, borderRadius: 4, color: c.mid, background: '#fff', letterSpacing: '0.05em' }}>↓ XLSX</span>
                <span style={{ fontSize: 10, fontWeight: 700, padding: '4px 10px', border: `1.5px solid ${c.border}`, borderRadius: 4, color: c.mid, background: '#fff', letterSpacing: '0.05em' }}>↓ PDF</span>
                <span style={{ fontSize: 10, fontWeight: 700, padding: '4px 10px', border: `1.5px solid ${c.border}`, borderRadius: 4, color: c.mid, background: '#fff', letterSpacing: '0.05em' }}>↓ CSV</span>
                <span style={{ fontSize: 11, color: c.light, marginLeft: 'auto', alignSelf: 'center' }}>16 {lang === 'el' ? 'κατηγορίες · ΜΕΔΣΚ' : 'categories · ΜΕΔΣΚ'}</span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ── TRUST BAR ── */}
      <div style={{ borderTop: `1px solid ${c.border}`, borderBottom: `1px solid ${c.border}`, padding: '20px 48px', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 48, background: c.off, flexWrap: 'wrap' as const }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, fontSize: 13, fontWeight: 600, color: c.mid }}><span style={{ fontFamily: 'Georgia, serif', fontSize: 22, color: c.black, letterSpacing: '-0.5px' }}>16</span> {t.trustBar16}</div>
        <div style={{ width: 1, height: 28, background: c.border }} className="trust-divider" />
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, fontSize: 13, fontWeight: 600, color: c.mid }}><span style={{ fontFamily: 'Georgia, serif', fontSize: 22, color: c.black, letterSpacing: '-0.5px' }}>✓</span> {t.trustBarAcc}</div>
        <div style={{ width: 1, height: 28, background: c.border }} className="trust-divider" />
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, fontSize: 13, fontWeight: 600, color: c.mid }}><span style={{ fontFamily: 'Georgia, serif', fontSize: 22, color: c.black, letterSpacing: '-0.5px' }}>50+</span> {t.trustBar50}</div>
        <div style={{ width: 1, height: 28, background: c.border }} className="trust-divider" />
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, fontSize: 13, fontWeight: 600, color: c.mid }}><span style={{ fontFamily: 'Georgia, serif', fontSize: 22, color: c.black, letterSpacing: '-0.5px' }}>&lt;60″</span> {t.trustBarTime}</div>
      </div>

      {/* ── STATS CARDS ── */}
      <div style={{ padding: '72px 48px', maxWidth: 1120, margin: '0 auto' }}>
        <div className="stats-grid" style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 16, marginBottom: 20 }}>
          <div style={{ background: '#fff', border: `1px solid ${c.border}`, borderRadius: 12, padding: '24px 24px 20px' }}>
            <div style={{ fontFamily: 'Georgia, serif', fontSize: 40, letterSpacing: '-2px', color: c.black, lineHeight: 1, marginBottom: 8 }}>&lt;60<em style={{ fontStyle: 'normal', color: c.orange, fontSize: 28 }}>″</em></div>
            <div style={{ fontSize: 13, color: c.mid, lineHeight: 1.4 }}>{t.statTime}<br />{t.statTime2}</div>
          </div>
          <div style={{ background: '#fff', border: `1px solid ${c.border}`, borderRadius: 12, padding: '24px 24px 20px' }}>
            <div style={{ fontFamily: 'Georgia, serif', fontSize: 40, letterSpacing: '-2px', color: c.black, lineHeight: 1, marginBottom: 8 }}>16</div>
            <div style={{ fontSize: 13, color: c.mid, lineHeight: 1.4 }}>{t.stat16}<br />{t.stat16b}</div>
          </div>
          <div style={{ background: '#fff', border: `1px solid ${c.border}`, borderRadius: 12, padding: '24px 24px 20px' }}>
            <div style={{ fontFamily: 'Georgia, serif', fontSize: 40, letterSpacing: '-2px', color: c.black, lineHeight: 1, marginBottom: 8 }}>50<em style={{ fontStyle: 'normal', color: c.orange, fontSize: 28 }}>+</em></div>
            <div style={{ fontSize: 13, color: c.mid, lineHeight: 1.4 }}>{t.stat50}<br />{t.stat50b}</div>
          </div>
          <div style={{ background: '#fff', border: `1px solid ${c.border}`, borderRadius: 12, padding: '24px 24px 20px' }}>
            <div style={{ fontFamily: 'Georgia, serif', fontSize: 40, letterSpacing: '-2px', color: c.black, lineHeight: 1, marginBottom: 8 }}>€0</div>
            <div style={{ fontSize: 13, color: c.mid, lineHeight: 1.4 }}>{t.stat0}<br />{t.stat0b}</div>
          </div>
        </div>
        <div style={{ textAlign: 'center' as const, fontSize: 14, color: c.mid, paddingTop: 20, borderTop: `1px solid ${c.border}` }}>{t.socialProof}</div>
      </div>

      {/* ── HOW IT WORKS ── */}
      <div style={{ maxWidth: 1060, margin: '0 auto', padding: '80px 48px', borderTop: `1px solid ${c.border}` }}>
        <div style={{ fontSize: 11, fontWeight: 700, letterSpacing: '0.15em', textTransform: 'uppercase' as const, color: c.light, marginBottom: 12 }}>{t.howEyebrow}</div>
        <h2 style={{ fontFamily: 'Georgia, serif', fontSize: 'clamp(28px, 3.5vw, 44px)', letterSpacing: '-1.5px', lineHeight: 1.1, marginBottom: 60 }}>{t.howH2a}<br />{t.howH2b}</h2>
        <div className="steps-grid" style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: 52 }}>
          {[{ h: t.step1h, p: t.step1p }, { h: t.step2h, p: t.step2p }, { h: t.step3h, p: t.step3p }].map((s, i) => (
            <div key={i}>
              <div style={{ fontFamily: 'Georgia, serif', fontSize: 56, color: c.border, lineHeight: 1, marginBottom: 14, letterSpacing: '-2px' }}>0{i + 1}</div>
              <div style={{ width: 28, height: 3, background: c.orange, borderRadius: 2, marginBottom: 18 }} />
              <h3 style={{ fontSize: 16, fontWeight: 700, marginBottom: 10 }}>{s.h}</h3>
              <p style={{ fontSize: 14, color: c.mid, lineHeight: 1.65 }}>{s.p}</p>
            </div>
          ))}
        </div>
      </div>

      {/* ── FOR WHO ── */}
      <div style={{ background: c.off, borderTop: `1px solid ${c.border}`, borderBottom: `1px solid ${c.border}`, padding: '80px 48px' }}>
        <div style={{ maxWidth: 1060, margin: '0 auto' }}>
          <div style={{ fontSize: 11, fontWeight: 700, letterSpacing: '0.15em', textTransform: 'uppercase' as const, color: c.light, marginBottom: 12 }}>{t.forwhoEyebrow}</div>
          <h2 style={{ fontFamily: 'Georgia, serif', fontSize: 'clamp(28px, 3.5vw, 44px)', letterSpacing: '-1.5px', lineHeight: 1.1, marginBottom: 60 }}>{t.forwhoH2a}<br />{t.forwhoH2b}</h2>
          <div className="roles-grid" style={{ display: 'grid', gridTemplateColumns: 'repeat(2,1fr)', gap: 16 }}>
            {[
              { icon: '🏗️', title: t.role1Title, p: t.role1P, test: t.test1, auth: t.test1Auth },
              { icon: '⚡', title: t.role2Title, p: t.role2P, test: t.test2, auth: t.test2Auth },
              { icon: '📐', title: t.role3Title, p: t.role3P, test: t.test3, auth: t.test3Auth },
              { icon: '📊', title: t.role4Title, p: t.role4P, test: t.test4, auth: t.test4Auth },
            ].map((r, i) => (
              <div key={i} style={{ background: '#fff', border: `1px solid ${c.border}`, borderRadius: 12, padding: 26 }}>
                <div style={{ fontSize: 15, fontWeight: 700, marginBottom: 10, display: 'flex', alignItems: 'center', gap: 10 }}>
                  <div style={{ width: 30, height: 30, background: c.black, borderRadius: 6, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 14, flexShrink: 0 }}>{r.icon}</div>
                  <span>{r.title}</span>
                </div>
                <p style={{ fontSize: 14, color: c.mid, lineHeight: 1.6, marginBottom: 14 }}>{r.p}</p>
                <div style={{ background: c.off, borderRadius: 8, padding: '12px 14px', borderLeft: `3px solid ${c.orange}` }}>
                  <div style={{ fontSize: 13, color: c.black, lineHeight: 1.55, fontStyle: 'italic', marginBottom: 6 }}>{r.test}</div>
                  <div style={{ fontSize: 11, fontWeight: 700, color: c.light, textTransform: 'uppercase' as const, letterSpacing: '0.08em' }}>{r.auth}</div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* ── PRICING ── */}
      <div style={{ maxWidth: 980, margin: '0 auto', padding: '80px 48px', textAlign: 'center' as const }}>
        <div style={{ fontSize: 11, fontWeight: 700, letterSpacing: '0.15em', textTransform: 'uppercase' as const, color: c.light, marginBottom: 12 }}>{t.pricingEyebrow}</div>
        <h2 style={{ fontFamily: 'Georgia, serif', fontSize: 'clamp(28px, 3.5vw, 44px)', letterSpacing: '-1.5px', lineHeight: 1.1, marginBottom: 36 }}>{t.pricingH2a}<br />{t.pricingH2b}</h2>

        <div className="pricing-grid" style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: 16, marginBottom: 24, textAlign: 'left' as const }}>
          {plans.map((plan) => (
            <div key={plan.name} style={{ border: `1.5px solid ${plan.featured ? c.black : c.border}`, borderRadius: 14, padding: '30px 26px', background: plan.featured ? c.black : 'transparent', boxShadow: plan.featured ? '0 12px 40px rgba(0,0,0,0.2)' : 'none', transform: plan.featured ? 'scale(1.03)' : 'none' }}>
              <div style={{ fontSize: 11, fontWeight: 700, letterSpacing: '0.12em', textTransform: 'uppercase' as const, color: plan.featured ? '#555' : c.light, marginBottom: 18 }}>{plan.name}</div>
              <div style={{ fontFamily: 'Georgia, serif', fontSize: 48, letterSpacing: '-2.5px', lineHeight: 1, marginBottom: 4, color: plan.featured ? c.white : c.black }}>€{plan.price}</div>
              <div style={{ fontSize: 13, color: c.light, marginBottom: 24 }}>{t.planPeriod}</div>
              <ul style={{ listStyle: 'none', fontSize: 13, color: plan.featured ? '#888' : c.mid, display: 'flex', flexDirection: 'column' as const, gap: 9, padding: 0, margin: 0 }}>
                {plan.features.map(f => (
                  <li key={f} style={{ display: 'flex', gap: 6 }}><span style={{ color: plan.featured ? c.orange : c.green, fontWeight: 700 }}>✓</span>{f}</li>
                ))}
              </ul>
              <Link href="/sign-up" style={{ display: 'block', marginTop: 28, padding: '13px 20px', textAlign: 'center' as const, borderRadius: 8, fontSize: 14, fontWeight: 700, background: plan.featured ? c.orange : c.off, color: plan.featured ? '#fff' : c.black, boxShadow: plan.featured ? '0 4px 14px rgba(232,98,42,0.35)' : 'none' }}>{t.planCtaFree}</Link>
            </div>
          ))}
        </div>
        <p style={{ fontSize: 12, color: c.light, textAlign: 'center' as const, marginTop: 12, marginBottom: 8 }}>{t.projectNote}</p>
        <p style={{ fontSize: 13, color: c.light, marginTop: 8 }}>
          <span>{t.pricingAltText}</span> <a href="#" style={{ color: c.black, borderBottom: `1px solid ${c.border}` }}>{t.pricingAltLink}</a> <span>{t.pricingAltSuffix}</span>
        </p>
      </div>

      {/* ── FAQ ── */}
      <div style={{ maxWidth: 780, margin: '0 auto', padding: '80px 48px', borderTop: `1px solid ${c.border}` }}>
        <div style={{ fontSize: 11, fontWeight: 700, letterSpacing: '0.15em', textTransform: 'uppercase' as const, color: c.light, marginBottom: 12 }}>{t.faqEyebrow}</div>
        <h2 style={{ fontFamily: 'Georgia, serif', fontSize: 'clamp(28px, 3.5vw, 44px)', letterSpacing: '-1.5px', lineHeight: 1.1, marginBottom: 40 }}>{t.faqH2a}<br />{t.faqH2b}</h2>
        {t.faqs.map((f, i) => (
          <div key={i} style={{ borderBottom: `1px solid ${c.border}`, overflow: 'hidden' }}>
            <button onClick={() => setOpenFaq(openFaq === i ? null : i)} style={{ width: '100%', textAlign: 'left' as const, background: 'none', border: 'none', padding: '20px 0', display: 'flex', justifyContent: 'space-between', alignItems: 'center', cursor: 'pointer', gap: 16, fontFamily: 'inherit', fontSize: 15, fontWeight: 600, color: c.black }}>
              {f.q}
              <span style={{ fontSize: 20, color: openFaq === i ? c.orange : c.light, transition: 'transform 0.25s', flexShrink: 0, lineHeight: 1, transform: openFaq === i ? 'rotate(45deg)' : 'none' }}>+</span>
            </button>
            <div style={{ maxHeight: openFaq === i ? 200 : 0, overflow: 'hidden', transition: 'max-height 0.3s ease, padding 0.3s ease', fontSize: 14, color: c.mid, lineHeight: 1.7, paddingBottom: openFaq === i ? 20 : 0 }}>{f.a}</div>
          </div>
        ))}
      </div>

      {/* ── FINAL CTA ── */}
      <div style={{ background: c.black, padding: '104px 48px', textAlign: 'center' as const }}>
        <h2 style={{ color: c.white, fontSize: 'clamp(32px,4.5vw,58px)', marginBottom: 14, letterSpacing: '-2px', lineHeight: 1.06 }}>{t.finalH2a}<br />{t.finalH2b}<em style={{ fontStyle: 'normal', color: c.orange }}>{t.finalH2em}</em></h2>
        <p style={{ color: c.light, fontSize: 18, maxWidth: 440, margin: '0 auto 44px', lineHeight: 1.6 }}>{t.finalP}</p>
        <div style={{ display: 'flex', gap: 14, justifyContent: 'center', flexWrap: 'wrap' as const }}>
          <Link href="/sign-up" style={{ padding: '17px 36px', background: c.orange, color: '#fff', borderRadius: 9, fontSize: 17, fontWeight: 700, boxShadow: '0 6px 24px rgba(232,98,42,0.35)' }}>{t.finalCta}</Link>
          <Link href="/demo" style={{ padding: '17px 32px', background: 'transparent', color: c.light, border: '1.5px solid #2A2A2A', borderRadius: 9, fontSize: 16, fontWeight: 600 }}>{t.finalDemo}</Link>
        </div>
      </div>

      {/* ── FOOTER ── */}
      <footer style={{ padding: '28px 48px', borderTop: `1px solid ${c.border}`, display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: 13, color: c.light, flexWrap: 'wrap' as const, gap: 16 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <div style={{ width: 30, height: 30, background: c.black, borderRadius: 6, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}><Logo /></div>
          <span style={{ fontFamily: 'Georgia, serif', fontSize: 18, color: c.black }}>BOQNOW</span>
        </div>
        <div style={{ display: 'flex', gap: 28, flexWrap: 'wrap' as const }}>
          <Link href="/demo">{t.footerLinks[0]}</Link>
          <Link href="/pricing">{t.footerLinks[1]}</Link>
          <Link href="/waitlist">{t.footerLinks[2]}</Link>
          <a href="mailto:hello@boqnow.com">{t.footerLinks[3]}</a>
          <Link href="/legal/terms">{t.footerLinks[4]}</Link>
          <Link href="/legal/privacy">{t.footerLinks[5]}</Link>
        </div>
        <span>© 2026 BOQNOW</span>
      </footer>

      <style jsx>{`
        @media (max-width: 860px) {
          .nav-links-desktop { display: none !important; }
          .hamburger-btn { display: flex !important; }
          .hero-grid { grid-template-columns: 1fr !important; gap: 0 !important; padding: 40px 24px 48px !important; }
          .hero-visual-desktop { display: none !important; }
          .stats-grid { grid-template-columns: repeat(2,1fr) !important; }
          .steps-grid, .roles-grid { grid-template-columns: 1fr !important; }
          .pricing-grid { grid-template-columns: 1fr !important; }
          .trust-divider { display: none !important; }
        }
      `}</style>
    </div>
  )
}
