# BOQNOW — Features & Simulations Roadmap

## ✅ Υλοποιημένο (v3.1)
- System prompts: ΛΑΘΟΣ 11 (Προνοητικά Ποσά ως ξεχωριστή υποχρεωτική γραμμή
  ~10% subtotal) + ΛΑΘΟΣ 12 (scope-boundary notes για Η/Μ, Ξυλουργικά,
  Αλουμίνια — στην Κύπρο συχνά τιμολογούνται εκτός κύριου ΔΠ)
- Step 3 review: per-category % sanity check (όχι μόνο επί grand total) —
  πιάνει περιπτώσεις όπου το σύνολο "βγαίνει σωστό" τυχαία αλλά το breakdown
  ανά κατηγορία είναι λάθος
- Landing page (src/app/page.tsx): pricing section πλέον τραβάει live από
  PLANS (src/lib/stripe.ts) αντί για hardcoded τιμές — διορθώθηκε ασυνέπεια
  €49/€99/€179 (παλιά, hardcoded) vs €89/€149/€199 (σωστή, στο Stripe).
  /pricing page ήταν ήδη σωστή (έκανε ήδη import από PLANS).
- Landing page: αφαιρέθηκε το yearly billing toggle (έδειχνε ψεύτικη ~20%
  έκπτωση χωρίς αντίστοιχα yearly Stripe price IDs να υπάρχουν) — μόνο
  monthly billing μέχρι να δημιουργηθούν πραγματικά yearly prices στο Stripe.
- Landing page: διορθώθηκε αριθμός projects/μήνα στο Pro plan (έδειχνε
  λάθος "30", σωστό είναι 50 από PLANS.PRO.projectsPerMonth)
- Landing page: πλήρης redesign βάσει νέου design mockup (v5) — προστέθηκαν
  Trust bar, Stats cards, For Who (4 personas με testimonials), FAQ accordion.
  Pay-per-BOQ copy διορθώθηκε σε "€50 ανά BOQ" (ήταν "€15" στο mockup, λάθος
  τιμή). Αφαιρέθηκε ο ισχυρισμός "98% ΜΕΔΣΚ compliance" (μη επιβεβαιωμένο
  νούμερο) — αντικαταστάθηκε με "QS-validated AI accuracy methodology" σε
  trust bar + FAQ.

## ✅ Υλοποιημένο (v2.2)
- 5-step pipeline (Claude Opus 4.5) με 16 ΜΕΔΣΚ κατηγορίες
- File support: PDF, Excel, CSV, DWG, PNG, JPG
- Security: RLS, signed URLs, rate limiting, VirusTotal
- Demo page (/demo) χωρίς εγγραφή
- Feedback widget (1-5 stars + σχόλιο)
- Legal disclaimer στο project view και demo
- BOQNOW branding σε exports

## ✅ Υλοποιημένο (v2.3)
- Word (DOCX/DOC) support — mammoth text extraction
- Pre-upload quality check API (/api/boq/pre-check)
  - Missing drawings alert (Υδραυλικά, Ηλεκτρολογικά)
  - Per-file warnings (DWG = Provisional, μεγάλα αρχεία κλπ)
- Referral system (src/lib/referral.ts)
  - Unique referral link ανά user
  - 1 μήνας δωρεάν για referrer + referred

## 📋 Pending — Developer να υλοποιήσει

### 1. Pay-per-BOQ (€15/BOQ)
- Νέο Stripe product: one-time €15
- Εμφανίζεται στο /pricing ως "Δοκίμασε χωρίς συνδρομή"
- DB: user.singleCredits: Int default 0

### 1β. Yearly billing (αφαιρέθηκε προσωρινά στο v3.1)
- Το landing page είχε UI toggle monthly/yearly με ~20% έκπτωση, αλλά δεν
  υπήρχαν αντίστοιχα yearly Stripe price IDs — αφαιρέθηκε για να μη δείχνει
  ψεύτικη τιμή. Αν θέλετε yearly billing στο μέλλον:
  - Δημιουργία yearly Stripe Price ανά plan (Starter/Pro/Agency)
  - Προσθήκη priceIdYearly σε κάθε plan στο PLANS object (src/lib/stripe.ts)
  - Επαναφορά toggle UI στο landing page + /pricing, με τιμές από PLANS
    (όχι hardcoded) ώστε να μην ξαναδημιουργηθεί η ίδια ασυνέπεια

### 2. White-label (Agency plan only)
- Upload λογότυπο στο account settings (Supabase Storage)
- PDF/Excel export: λογότυπο εργολάβου αντί BOQNOW
- DB: user.whitelabelLogo: String?
- Ορατό μόνο αν plan === 'AGENCY'

### 3. Referral UI στο Dashboard
- Widget με referral link + copy button
- Counter: πόσους έχεις φέρει
- Stripe coupon: REFERRAL1MONTH (100% off, 1 month)

### 4. Pre-upload check UI στο FileUploader
- Μετά file selection, ΠΡΙΝ upload
- Καλεί /api/boq/pre-check
- Modal με warnings + "Συνέχεια ή Προσθήκη αρχείων;"

## 💡 Future (v3+)
- Historical benchmarking
- Version comparison (BOQ v1 vs v2)
- Architect mode (budget → material feasibility)
- DWG native engine (Autodesk Forge)
- Team collaboration

## ✅ Υλοποιημένο (v2.4 — Price Intelligence)

### Price Intelligence Engine (src/lib/engine/price-engine.ts)
- getLivePriceMap() — φορτώνει live τιμές από DB
- Time-weighted average (νεότερες προσφορές = μεγαλύτερο βάρος)
- Personal blending: 70% personal + 30% market (αν ≥5 personal items)
- formatPriceMapForPrompt() — inject στο Step 5

### Quote Extractor (src/lib/engine/quote-extractor.ts)
- Claude Sonnet εξάγει line items από PDF/Excel/Word
- 30+ material groups normalised
- Outlier detection (IQR method)
- Auto-recompute μετά κάθε upload

### Schema (prisma/schema.prisma)
- HistoricalQuote — metadata αρχείου
- PriceLineItem — εξαγμένα line items
- PriceReference — computed weighted averages
- QuoteScope: SHARED | PERSONAL
- ExtractionStatus: PENDING | PROCESSING | COMPLETE | FAILED

### Admin Panel — Price Intelligence Tab
- Upload form (PDF/Excel/Word + ημερομηνία + scope)
- Quotes list με status + item count
- Price database view (all material groups + confidence)
- Delete quote + auto-recompute

### API Endpoints
- GET/POST/DELETE /api/admin/quotes
- POST /api/admin/quotes/upload

### Supabase
- Νέο bucket: historical-quotes (private)
- Νέα migration: npx prisma db push

## 📋 Pending — Developer να υλοποιήσει

### Inject live prices στο generate route
Δες το comment στο τέλος του generate-from-storage/route.ts:
```typescript
const priceMap = await getLivePriceMap('cyprus', userId)
const livePrices = formatPriceMapForPrompt(priceMap, {})
// append livePrices στο messageContent πριν το generateBOQ()
```

### Contractor personal quotes
- UI για contractor να ανεβάζει δικές του προσφορές
- Scope: PERSONAL
- Blending: 70% personal + 30% market
