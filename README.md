# BOQNOW — AI BOQ Generator
### Developer Setup Guide

**Stack:** Next.js 14 · TypeScript · Anthropic Claude · Clerk · Stripe · Supabase · Upstash · Vercel

---

## Τι είναι

B2B SaaS για εργολάβους Κύπρου & Ελλάδας. Ανεβάζεις αρχιτεκτονικά σχέδια (PDF/Excel/DWG) και παίρνεις αυτόματα Bill of Quantities σε δευτερόλεπτα, ΜΕΔΣΚ compliant.

**Τιμολόγηση:** €49 / €99 / €179 ανά μήνα — 7 ημέρες free trial

---

## Αρχεία που παραδίδονται

```
src/
├── app/
│   ├── page.tsx                          # Landing page
│   ├── waitlist/page.tsx                 # Waitlist signup
│   ├── pricing/page.tsx                  # Pricing page
│   ├── dashboard/
│   │   ├── page.tsx                      # Main dashboard
│   │   └── project/[id]/page.tsx         # Project detail + export
│   ├── sign-in/ & sign-up/               # Clerk auth pages
│   ├── admin/page.tsx                    # Admin panel (MRR, users, projects)
│   └── api/
│       ├── boq/generate-from-storage/    # ⭐ Core BOQ generation (Claude AI)
│       ├── export/excel/ & pdf/          # Excel + PDF export
│       ├── convert/dwg/                  # DWG → PDF (CloudConvert)
│       ├── stripe/create-checkout/       # Stripe checkout
│       ├── stripe/billing-portal/        # Upgrade/cancel subscription
│       ├── webhooks/stripe/ & clerk/     # Webhooks
│       ├── waitlist/                     # Waitlist signup
│       └── health/                       # Health check endpoint
├── components/
│   ├── dashboard/
│   │   ├── DashboardClient.tsx           # Dashboard UI
│   │   ├── FileUploader.tsx              # Multi-file upload (drag & drop)
│   │   └── ProjectClient.tsx             # Project detail view
│   └── admin/AdminClient.tsx             # Admin UI
└── lib/
    ├── boq-generator.ts                  # Claude AI BOQ logic + prompts
    ├── email.ts                          # 5 transactional emails (Resend)
    ├── errors.ts                         # Error types + retry + timeout
    ├── rate-limit.ts                     # Rate limiting (Upstash Redis)
    ├── stripe.ts                         # Stripe client + plan config
    └── prisma.ts                         # DB client
```

---

## Setup — 8 βήματα

### 1. Clone & Install

```bash
git clone https://github.com/your-username/boqnow.git
cd boqnow
npm install
cp .env.example .env.local
```

### 2. Anthropic API
1. https://console.anthropic.com → API Keys → Create Key
2. `.env.local`: `ANTHROPIC_API_KEY=sk-ant-...`

### 3. Clerk (Auth)
1. https://dashboard.clerk.com → Create application → Email + Google
2. API Keys → copy keys:
```
NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=pk_test_...
CLERK_SECRET_KEY=sk_test_...
```
3. Webhooks → Add endpoint → `https://your-domain.vercel.app/api/webhooks/clerk`
   - Events: `user.created`, `user.updated`, `user.deleted`
4. Settings → copy your own User ID → `ADMIN_CLERK_USER_ID=user_...`

### 4. Supabase (Database + Storage)
1. https://supabase.com → New project → EU Central region
2. Settings → Database → copy connection strings:
```
DATABASE_URL=postgresql://postgres:[PASS]@db.[PROJECT].supabase.co:5432/postgres?pgbouncer=true
DIRECT_URL=postgresql://postgres:[PASS]@db.[PROJECT].supabase.co:5432/postgres
```
3. Settings → API → copy:
```
NEXT_PUBLIC_SUPABASE_URL=https://[PROJECT].supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJ...
SUPABASE_SERVICE_ROLE_KEY=eyJ...
```
4. Storage → New bucket → Name: `project-files` → Private → 100MB limit
5. Storage → project-files → Policies → Add:
```sql
-- Upload (anon, Clerk handles auth at API level)
CREATE POLICY "Allow uploads" ON storage.objects
FOR INSERT TO anon WITH CHECK (bucket_id = 'project-files');

-- Read (service role only — server-side)
CREATE POLICY "Service role reads" ON storage.objects
FOR SELECT TO service_role USING (bucket_id = 'project-files');
```
6. Run migrations:
```bash
npx prisma generate
npx prisma db push
```

### 5. Stripe (Payments)
1. https://dashboard.stripe.com → Products → Create 3 products:

| Product | Price | Billing |
|---------|-------|---------|
| BOQNOW Starter | €49.00 | Monthly |
| BOQNOW Pro | €99.00 | Monthly |
| BOQNOW Agency | €179.00 | Monthly |

2. Copy Price IDs (starts with `price_...`):
```
STRIPE_PRICE_STARTER=price_...
STRIPE_PRICE_PRO=price_...
STRIPE_PRICE_AGENCY=price_...
```
3. Developers → API Keys:
```
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_test_...
STRIPE_SECRET_KEY=sk_test_...
```
4. Billing → Settings → Customer portal → Activate (για billing portal)
5. Webhooks → Add endpoint (μετά το deploy):
   - URL: `https://your-domain.vercel.app/api/webhooks/stripe`
   - Events: `checkout.session.completed`, `invoice.payment_succeeded`, `invoice.payment_failed`, `customer.subscription.deleted`
```
STRIPE_WEBHOOK_SECRET=whsec_...
```
6. Optional — Waitlist promo:
   - Coupons → Create → 20% off → Duration: forever → Code: `WAITLIST`

### 6. Resend (Emails)
1. https://resend.com → Create account (δωρεάν: 3.000 emails/μήνα)
2. Domains → Add → verify `boqnow.io`
3. API Keys → Create → copy:
```
RESEND_API_KEY=re_...
```

### 7. Upstash Redis (Rate Limiting)
1. https://upstash.com → Create Database → EU West → Free tier
2. Details → copy:
```
UPSTASH_REDIS_URL=https://...upstash.io
UPSTASH_REDIS_TOKEN=...
```

### 8. CloudConvert (DWG → PDF, Optional για Phase 0)
1. https://cloudconvert.com → Create account (25 free conversions/day)
2. Dashboard → API Keys → Create:
```
CLOUDCONVERT_API_KEY=...
```

---

## Deploy στο Vercel

```bash
# Option A: Via dashboard
# 1. Push to GitHub
# 2. vercel.com → Import → Next.js auto-detected
# 3. Add all env vars
# 4. Deploy

# Option B: CLI
npm i -g vercel
vercel --prod
```

Μετά το deploy:
- Ενημέρωσε `NEXT_PUBLIC_APP_URL=https://your-domain.vercel.app`
- Stripe webhook URL → πραγματικό domain
- Clerk webhook URL → πραγματικό domain

---

## End-to-end test checklist

```
□ https://your-domain.vercel.app  →  landing page φορτώνει
□ /waitlist  →  email εγγράφεται, confirmation email φτάνει
□ /sign-up  →  δημιουργία λογαριασμού
□ /dashboard  →  dashboard φορτώνει
□ Upload PDF + project name → BOQ δημιουργείται
□ Export Excel/PDF/CSV  →  αρχεία κατεβαίνουν
□ /pricing  →  κλικ Starter → Stripe checkout ανοίγει
□ Test payment (card: 4242 4242 4242 4242)  →  subscription ενεργοποιείται
□ /dashboard  →  πλάνο αναβαθμισμένο
□ /admin  →  user φαίνεται, MRR ενημερώθηκε
□ https://your-domain.vercel.app/api/health  →  {"status":"ok"}
```

---

## Plan limits

| Plan | Projects/μήνα | Τιμή |
|------|--------------|------|
| Free | 2 | €0 |
| Starter | 10 | €49 |
| Pro | 30 | €99 |
| Agency | Unlimited | €179 |

Trial: 7 ημέρες σε όλα τα paid plans (configured in Stripe checkout).

---

## Rate limits (Upstash)

| Endpoint | Limit |
|----------|-------|
| BOQ generation | 10 / ώρα / user |
| Auth endpoints | 20 / 15min / IP |
| Waitlist | 3 / ώρα / IP |
| General API | 100 / λεπτό / user |

---

## Local development

```bash
npm run dev          # localhost:3000
npx prisma studio    # Visual DB browser

# Local Stripe webhooks:
npm i -g stripe
stripe login
stripe listen --forward-to localhost:3000/api/webhooks/stripe
# Αντέγραψε το webhook secret → STRIPE_WEBHOOK_SECRET
```

---

## Βελτίωση ακρίβειας AI (Phase 0)

1. Τρέξε 3–5 real projects manually + AI παράλληλα
2. Σύγκρινε AI output με QS-validated BOQ
3. Σημείωσε systematic errors
4. Ενημέρωσε `SYSTEM_PROMPT` στο `src/lib/boq-generator.ts`
5. Πρόσθεσε real examples ως few-shot prompts

---

## Επικοινωνία

hello@boqnow.io
