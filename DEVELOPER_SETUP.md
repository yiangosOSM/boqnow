# BOQNOW — Developer Setup Guide
## Αναλυτικές Οδηγίες για Production Deploy

**Εκτιμώμενος χρόνος:** 3–4 ώρες  
**Απαιτούμενη εμπειρία:** Next.js, Vercel, βασική γνώση SaaS services

---

## Βήμα 0 — Προαπαιτούμενα

```bash
node --version   # πρέπει >= 18
npm --version    # πρέπει >= 9
```

Χρειάζεσαι λογαριασμό σε: Vercel, GitHub, και τα 8 services παρακάτω.

---

## Βήμα 1 — Clone & Install

```bash
git clone https://github.com/YOUR_USERNAME/boqnow.git
cd boqnow
npm ci                        # καθαρή εγκατάσταση από lock file
npx prisma generate           # generate Prisma client
cp .env.example .env.local    # αντίγραψε τα env vars
```

---

## Βήμα 2 — Anthropic API Key

1. Πήγαινε στο: https://console.anthropic.com
2. **API Keys** → **Create Key** → αντέγραψε
3. `.env.local`:
```
ANTHROPIC_API_KEY=sk-ant-...
```

---

## Βήμα 3 — Clerk (Authentication)

1. Πήγαινε στο: https://dashboard.clerk.com → **Create application**
   - Name: `BOQNOW`
   - Sign-in options: ✅ Email, ✅ Google
2. **API Keys** → αντέγραψε:
```
NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=pk_test_...
CLERK_SECRET_KEY=sk_test_...
```
3. Τα παρακάτω μπαίνουν ακριβώς έτσι (μην τα αλλάξεις):
```
NEXT_PUBLIC_CLERK_SIGN_IN_URL=/sign-in
NEXT_PUBLIC_CLERK_SIGN_UP_URL=/sign-up
NEXT_PUBLIC_CLERK_AFTER_SIGN_IN_URL=/dashboard
NEXT_PUBLIC_CLERK_AFTER_SIGN_UP_URL=/dashboard
```
4. **Webhooks** → **Add Endpoint**:
   - URL: `https://YOUR-DOMAIN.vercel.app/api/webhooks/clerk`
   - Events: ✅ `user.created` ✅ `user.updated` ✅ `user.deleted`
   - **Signing Secret** → αντέγραψε:
```
CLERK_WEBHOOK_SECRET=whsec_...
```
5. Βρες το δικό σου Clerk User ID:
   - **Users** → κλικ στον εαυτό σου → αντέγραψε το `user_...`
```
ADMIN_CLERK_USER_ID=user_...
```

---

## Βήμα 4 — Supabase (Database + Storage)

### 4α. Δημιουργία Project
1. https://supabase.com → **New project**
   - Name: `boqnow`
   - Region: **EU Central** (Frankfurt)
   - Password: αποθήκευσε το σε ασφαλές μέρος

2. **Settings → Database** → Connection string:
```
DATABASE_URL=postgresql://postgres:[PASSWORD]@db.[PROJECT-REF].supabase.co:5432/postgres?pgbouncer=true&connection_limit=1
DIRECT_URL=postgresql://postgres:[PASSWORD]@db.[PROJECT-REF].supabase.co:5432/postgres
```

3. **Settings → API** → αντέγραψε:
```
NEXT_PUBLIC_SUPABASE_URL=https://[PROJECT-REF].supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJ...
SUPABASE_SERVICE_ROLE_KEY=eyJ...
```

### 4β. Database Migration
```bash
npx prisma db push    # δημιουργεί όλους τους πίνακες
npx prisma studio     # προαιρετικό: visual browser για επαλήθευση
```

Πρέπει να δεις αυτούς τους πίνακες:
- User, Subscription, Project, BOQVersion
- AuditLog, AIRequestLog, OverageLog
- WebhookEvent, Waitlist

### 4γ. Storage Bucket
1. **Storage** → **New bucket**
   - Name: `project-files`
   - Public: **OFF**
   - File size limit: `104857600` (100MB)

2. **project-files** → **Policies** → **New Policy** → **For full customization**:

**Policy 1 — Allow uploads (anon):**
```sql
CREATE POLICY "Allow uploads"
ON storage.objects FOR INSERT
TO anon
WITH CHECK (bucket_id = 'project-files');
```

**Policy 2 — Service role reads all:**
```sql
CREATE POLICY "Service role reads"
ON storage.objects FOR SELECT
TO service_role
USING (bucket_id = 'project-files');
```

---

## Βήμα 5 — Stripe (Payments)

### 5α. Products
1. https://dashboard.stripe.com → **Products** → **Add product**

Δημιούργησε **3 products** με αυτά ακριβώς τα στοιχεία:

| Product Name | Price | Billing |
|---|---|---|
| BOQNOW Starter | €49.00 | Monthly recurring |
| BOQNOW Pro | €99.00 | Monthly recurring |
| BOQNOW Agency | €179.00 | Monthly recurring |

Για κάθε product αντέγραψε το **Price ID** (`price_...`):
```
STRIPE_PRICE_STARTER=price_...
STRIPE_PRICE_PRO=price_...
STRIPE_PRICE_AGENCY=price_...
```

### 5β. Metered Overage Prices
Για **κάθε** από τα 3 products, πρόσθεσε **2η τιμή**:
- Billing: **Recurring**
- Usage: **Metered**
- Charge: **Per unit**
- Price: Starter=€3.00 / Pro=€1.50 / Agency=€0.50

```
STRIPE_PRICE_STARTER_OVERAGE=price_...
STRIPE_PRICE_PRO_OVERAGE=price_...
STRIPE_PRICE_AGENCY_OVERAGE=price_...
```

### 5γ. API Keys
**Developers → API Keys**:
```
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_test_...
STRIPE_SECRET_KEY=sk_test_...
```

### 5δ. Billing Portal
**Settings → Billing → Customer portal** → **Activate**
(Επιτρέπει στους χρήστες να διαχειρίζονται τη συνδρομή τους)

### 5ε. Webhooks (μετά το Vercel deploy)
**Developers → Webhooks → Add endpoint**:
- URL: `https://YOUR-DOMAIN.vercel.app/api/webhooks/stripe`
- Events:
  - ✅ `checkout.session.completed`
  - ✅ `invoice.payment_succeeded`
  - ✅ `invoice.payment_failed`
  - ✅ `customer.subscription.deleted`
```
STRIPE_WEBHOOK_SECRET=whsec_...
```

### 5στ. Waitlist Coupon (προαιρετικό)
**Coupons → Create**:
- Discount: 20% off
- Duration: Forever
- Code: `WAITLIST`

---

## Βήμα 6 — Resend (Transactional Emails)

1. https://resend.com → Δημιούργησε λογαριασμό (δωρεάν: 3.000 emails/μήνα)
2. **Domains** → **Add Domain** → πρόσθεσε `boqnow.io` → ακολούθησε τις DNS οδηγίες
3. **API Keys** → **Create API Key**:
```
RESEND_API_KEY=re_...
```

---

## Βήμα 7 — Upstash Redis (Rate Limiting)

1. https://upstash.com → **Create Database**
   - Name: `boqnow`
   - Region: **EU-West-1**
   - Type: Regional (Free tier)
2. **Details** → αντέγραψε:
```
UPSTASH_REDIS_URL=https://...upstash.io
UPSTASH_REDIS_TOKEN=...
```

---

## Βήμα 8 — Sentry (Error Monitoring)

1. https://sentry.io → **New Project** → **Next.js**
2. Αντέγραψε το DSN:
```
SENTRY_DSN=https://...@sentry.io/...
```
3. **Settings → Auth Tokens** → Create token:
```
SENTRY_AUTH_TOKEN=...
```

---

## Βήμα 9 — VirusTotal (Malware Scanning)

1. https://virustotal.com → Δημιούργησε λογαριασμό
2. **Profile → API Key** → αντέγραψε:
```
VIRUSTOTAL_API_KEY=...
```
Δωρεάν: 500 lookups/ημέρα (αρκετό για beta)

---

## Βήμα 10 — Vercel Deploy

### 10α. Πρώτο Deploy
```bash
npm install -g vercel
vercel login
vercel --prod
```

Ή μέσω dashboard:
1. https://vercel.com → **Add New Project** → **Import Git Repository**
2. Framework: **Next.js** (auto-detected)
3. **Environment Variables** → πρόσθεσε **ΟΛΑ** τα παρακάτω:

```
# Anthropic
ANTHROPIC_API_KEY

# Clerk
NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY
CLERK_SECRET_KEY
CLERK_WEBHOOK_SECRET
ADMIN_CLERK_USER_ID
NEXT_PUBLIC_CLERK_SIGN_IN_URL=/sign-in
NEXT_PUBLIC_CLERK_SIGN_UP_URL=/sign-up
NEXT_PUBLIC_CLERK_AFTER_SIGN_IN_URL=/dashboard
NEXT_PUBLIC_CLERK_AFTER_SIGN_UP_URL=/dashboard

# Supabase
DATABASE_URL
DIRECT_URL
NEXT_PUBLIC_SUPABASE_URL
NEXT_PUBLIC_SUPABASE_ANON_KEY
SUPABASE_SERVICE_ROLE_KEY

# Stripe
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY
STRIPE_SECRET_KEY
STRIPE_WEBHOOK_SECRET
STRIPE_PRICE_STARTER
STRIPE_PRICE_PRO
STRIPE_PRICE_AGENCY
STRIPE_PRICE_STARTER_OVERAGE
STRIPE_PRICE_PRO_OVERAGE
STRIPE_PRICE_AGENCY_OVERAGE

# Services
RESEND_API_KEY
UPSTASH_REDIS_URL
UPSTASH_REDIS_TOKEN
SENTRY_DSN
SENTRY_AUTH_TOKEN
VIRUSTOTAL_API_KEY

# App
NEXT_PUBLIC_APP_URL=https://YOUR-DOMAIN.vercel.app
ADMIN_SECRET=your-random-secret-here
```

4. **Deploy**

### 10β. Custom Domain (προαιρετικό)
Vercel → Project → **Settings → Domains** → πρόσθεσε `boqnow.io`

### 10γ. Ενημέρωσε Webhooks
Μετά το deploy, ενημέρωσε:
- Stripe webhook URL → πραγματικό domain
- Clerk webhook URL → πραγματικό domain
- `.env.local`: `NEXT_PUBLIC_APP_URL=https://boqnow.io`

---

## Βήμα 11 — BullMQ Worker (Background Jobs)

Ο worker **δεν** τρέχει στο Vercel. Χρειάζεται ξεχωριστό server.

**Option A: Railway (συνιστάται)**
1. https://railway.app → **New Project** → **Deploy from GitHub**
2. Ίδιο repo, αλλά **Start Command**: `npm run worker`
3. Πρόσθεσε τα ίδια env vars
4. ~$5/μήνα

**Option B: Render**
1. https://render.com → **New → Background Worker**
2. Start Command: `npm run worker`
3. ~$7/μήνα

---

## Βήμα 12 — End-to-End Testing

Τρέξε αυτά με τη σειρά στο production:

```
□ https://boqnow.io               → Landing page φορτώνει
□ https://boqnow.io/api/health    → {"status":"ok"}
□ /waitlist                       → Email εγγραφή + confirmation email φτάνει
□ /sign-up                        → Δημιουργία λογαριασμού
□ /dashboard                      → Dashboard φορτώνει, plan = FREE
□ Upload 1 PDF + project name     → BOQ δημιουργείται σε <2 λεπτά
□ Export Excel                    → .xlsx κατεβαίνει και ανοίγει σωστά
□ Export PDF                      → .pdf κατεβαίνει με σωστό formatting
□ /pricing → Starter → Checkout   → Stripe checkout ανοίγει
□ Test payment (4242 4242 4242 4242, 12/34, 123) → Subscription ενεργοποιείται
□ /dashboard                      → Plan = STARTER, projects limit ενημερώθηκε
□ /admin                          → MRR εμφανίζεται, user φαίνεται
□ Billing portal                  → Ανοίγει σωστά από dashboard
□ Stripe webhook logs             → Δεν υπάρχουν errors
□ Sentry                          → Test error φτάνει στο Sentry
```

---

## Βήμα 13 — Validation με Πραγματικά Έργα (Phase 0)

**Πριν από πληρωμένους πελάτες:**

1. Βρες QS partner στη Λεμεσό (δες BOQNOW_QS_PITCH.pptx)
2. Τρέξε **3–5 πραγματικά έργα** παράλληλα:
   - BOQNOW AI → BOQ
   - QS manual → BOQ
   - Σύγκρινε αποτελέσματα κατηγορία-κατηγορία
3. Σημείωσε systematic errors στο AI output
4. Βελτίωσε το `SYSTEM_PROMPT` στο `src/lib/boq-generator.ts`
5. Στόχος: <15% deviation σε Δάπεδα, Κουφώματα, Χρωματισμοί

---

## Αντιμετώπιση Προβλημάτων

**`npm ci` αποτυγχάνει:**
```bash
rm -rf node_modules package-lock.json
npm install
npm ci
```

**Prisma errors:**
```bash
npx prisma generate
npx prisma db push --force-reset   # ⚠️ διαγράφει δεδομένα
```

**Stripe webhooks δεν φτάνουν:**
```bash
# Local testing:
npm install -g stripe
stripe login
stripe listen --forward-to localhost:3000/api/webhooks/stripe
```

**Build αποτυγχάνει:**
```bash
npm run type-check   # βρες TypeScript errors
npm run build        # full production build
```

---

## Σημαντικές Σημειώσεις

⚠️ **ΠΟΤΕ** μην κάνεις commit το `.env.local` στο Git  
⚠️ Το `SUPABASE_SERVICE_ROLE_KEY` είναι **admin key** — μόνο server-side  
⚠️ Τα Stripe **test** keys (`pk_test_`, `sk_test_`) για development, **live** keys για production  
⚠️ Ο worker πρέπει να τρέχει συνεχώς για async BOQ generation  
⚠️ Κάθε νέο deploy στο Vercel → ελέγχεις ότι τα env vars είναι σωστά  

---

## Επικοινωνία

**hello@boqnow.io**
