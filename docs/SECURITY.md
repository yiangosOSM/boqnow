# BOQNOW — Security Specification
## Οδηγίες για Developer — Copy-paste ready

---

## 1. SUPABASE ROW LEVEL SECURITY (RLS)
### Κάθε εργολάβος βλέπει ΜΟΝΟ τα δικά του αρχεία

Εκτέλεσε αυτά τα SQL στο Supabase SQL Editor:

```sql
-- Ενεργοποίησε RLS στο storage
ALTER TABLE storage.objects ENABLE ROW LEVEL SECURITY;

-- POLICY 1: Upload — μόνο στο δικό σου folder (userId/)
CREATE POLICY "Users upload to own folder"
ON storage.objects FOR INSERT TO anon
WITH CHECK (
  bucket_id = 'project-files' AND
  (storage.foldername(name))[1] = auth.uid()::text
);

-- POLICY 2: Read — μόνο τα δικά σου αρχεία
CREATE POLICY "Users read own files"
ON storage.objects FOR SELECT TO authenticated
USING (
  bucket_id = 'project-files' AND
  (storage.foldername(name))[1] = auth.uid()::text
);

-- POLICY 3: Delete — μόνο τα δικά σου
CREATE POLICY "Users delete own files"
ON storage.objects FOR DELETE TO authenticated
USING (
  bucket_id = 'project-files' AND
  (storage.foldername(name))[1] = auth.uid()::text
);

-- POLICY 4: Service role (backend) διαβάζει όλα
-- (Το backend χρησιμοποιεί SUPABASE_SERVICE_ROLE_KEY — δεν χρειάζεται policy)
```

**ΣΗΜΑΝΤΙΚΟ:** Κάθε upload αποθηκεύεται ως `{userId}/{filename}`.
Το backend ΕΠΑΛΗΘΕΥΕΙ ότι το storagePath ξεκινά με τον userId του logged-in user
(δες `generate-from-storage/route.ts` — ownership check).

---

## 2. VERCEL ENVIRONMENT VARIABLES
### Τα prompts και η λογική ΠΟΤΕ δεν εκτίθενται στο frontend

Στο Vercel Dashboard → Settings → Environment Variables:

**Server-only (ΜΗΝ βάλεις NEXT_PUBLIC_ prefix):**
```
ANTHROPIC_API_KEY=sk-ant-...
CLERK_SECRET_KEY=sk_...
SUPABASE_SERVICE_ROLE_KEY=eyJ...
STRIPE_SECRET_KEY=sk_...
STRIPE_WEBHOOK_SECRET=whsec_...
RESEND_API_KEY=re_...
UPSTASH_REDIS_URL=https://...
UPSTASH_REDIS_TOKEN=...
ADMIN_CLERK_USER_ID=user_...
VIRUSTOTAL_API_KEY=...  (optional)
```

**Public (safe για frontend):**
```
NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=pk_...
NEXT_PUBLIC_SUPABASE_URL=https://...supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJ...
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_...
NEXT_PUBLIC_APP_URL=https://boqnow.com
```

**ΚΑΝΟΝΑΣ:** Αν ένα env var δεν χρειάζεται στο browser → χωρίς NEXT_PUBLIC_.
Ο Anthropic API key, τα prompts, και η λογική τρέχουν ΜΟΝΟ στο server.

---

## 3. API ROUTE AUTHENTICATION
### Κάθε API endpoint ελέγχει auth ΠΡΩΤΑ

Το pattern σε κάθε route.ts:
```typescript
import { auth } from '@clerk/nextjs/server'

export async function POST(req: NextRequest) {
  const { userId } = auth()
  if (!userId) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }
  // ... υπόλοιπος κώδικας
}
```

**ΕΛΕΓΞΕ ότι ΟΛΑ τα API routes έχουν auth check:**
- `/api/boq/*` ✓ (υπάρχει)
- `/api/export/*` — πρόσθεσε auth check
- `/api/stripe/*` — πρόσθεσε auth check
- `/api/admin/*` — πρόσθεσε admin check (userId === ADMIN_CLERK_USER_ID)

---

## 4. SIGNED URLs για file access
### Τα αρχεία δεν είναι ποτέ public

Αντί για public URLs, χρησιμοποίησε signed URLs με expiry:

```typescript
// Στο backend — δημιούργησε temporary signed URL (60 λεπτά)
const { data, error } = await supabaseAdmin.storage
  .from('project-files')
  .createSignedUrl(storagePath, 3600) // 3600 seconds = 1 hour

if (error || !data) throw new Error('Cannot access file')
const signedUrl = data.signedUrl
```

**Χρήση:** Μην αποθηκεύεις ποτέ public URLs στη βάση. Δημιούργησε signed URL
on-demand όταν χρειαστεί να δείξεις το αρχείο.

---

## 5. CLERK ROLES — Admin vs User

Στο Clerk Dashboard:
1. **Users → [user] → Metadata → Public Metadata:**
```json
{ "role": "admin" }
```
Ή χρησιμοποίησε απλά το `ADMIN_CLERK_USER_ID` env var (απλούστερο για MVP).

Το middleware (`src/middleware.ts`) ήδη ελέγχει:
```typescript
if (userId !== process.env.ADMIN_CLERK_USER_ID) return 403
```

---

## 6. RATE LIMITING (ήδη υπάρχει με Upstash)

Τα limits στο `src/lib/rate-limit.ts`:
- BOQ generation: 10/ώρα/user
- Auth endpoints: 20/15min/IP
- Waitlist: 3/ώρα/IP
- General API: 100/λεπτό/user

**Πρόσθεσε rate limit και στα export endpoints** αν δεν υπάρχει.

---

## 7. SECURITY HEADERS (ήδη στο middleware)

Το `src/middleware.ts` προσθέτει αυτόματα:
- `X-Frame-Options: DENY` — αποτρέπει clickjacking
- `X-Content-Type-Options: nosniff` — αποτρέπει MIME sniffing
- `Content-Security-Policy` — αποτρέπει XSS
- `Referrer-Policy` — ιδιωτικότητα

---

## 8. FILE SECURITY (ήδη υπάρχει)

Το `src/lib/engine/file-security.ts` κάνει:
- Magic bytes validation (PDF, PNG, JPG, XLSX, DWG)
- Executable content detection (PHP, scripts κλπ.)
- SHA256 hash για duplicate detection
- VirusTotal hash lookup (optional, free tier)
- Filename sanitization

---

## 9. GDPR / DATA RETENTION

Πρόσθεσε στο Supabase scheduled function (ή cron job):

```sql
-- Διέγραψε αρχεία από storage αν το project είναι > 90 ημέρες
-- (τρέξε ως weekly cron)
SELECT storage.delete_objects(
  'project-files',
  ARRAY(
    SELECT name FROM storage.objects
    WHERE bucket_id = 'project-files'
    AND created_at < NOW() - INTERVAL '90 days'
  )
);
```

Ενημέρωσε τα Terms of Service: "Τα αρχεία σου διατηρούνται για 90 ημέρες."

---

## 10. ANTI-ABUSE (ήδη υπάρχει)

Το `src/lib/stripe-guard.ts` ήδη έχει:
- Disposable email blocking (mailinator, tempmail κλπ.)
- Multi-account detection από ίδιο domain
- Trial abuse detection

---

## CHECKLIST ΓΙΑ ΤΟΝ DEVELOPER πριν το launch:

```
□ Supabase RLS policies εκτελέστηκαν (Section 1)
□ Vercel env vars — ΚΑΝΕΝΑ secret με NEXT_PUBLIC_ prefix
□ Κάθε API route έχει auth() check στην αρχή
□ Supabase bucket "project-files" → Private (ΌΧΙ public)
□ Signed URLs παντού — ποτέ public file URLs
□ ADMIN_CLERK_USER_ID set στο Vercel env
□ Middleware security headers ενεργά
□ Rate limiting σε export endpoints
□ GDPR cron job ρυθμισμένο (90 ημέρες retention)
□ Test: user A δεν μπορεί να δει αρχεία user B
□ Test: /api/admin επιστρέφει 403 για non-admin
□ Test: /api/boq χωρίς auth επιστρέφει 401
```

---

## 11. HISTORICAL QUOTES BUCKET (Νέο — Price Intelligence)

Δημιούργησε νέο Supabase bucket:
- Name: `historical-quotes`
- Public: **OFF** (private)
- Max file size: 100MB

RLS Policy — μόνο service_role έχει πρόσβαση (admin uploads μόνο μέσω server):
```sql
-- Δεν χρειάζεται policy για users — μόνο service_role key χρησιμοποιείται
-- Το endpoint /api/admin/quotes/upload κάνει auth check για ADMIN_CLERK_USER_ID
```

Pre-launch checklist addition:
```
□ Supabase bucket "historical-quotes" → Private
□ Ανέβασε 5-10 παλιές προσφορές για να seed'αρεις τη βάση τιμών
□ Επαλήθευσε ότι το /admin → 💰 Τιμές tab δείχνει data
□ Τρέξε npx prisma db push για τα νέα models (HistoricalQuote, PriceLineItem, PriceReference)
```
