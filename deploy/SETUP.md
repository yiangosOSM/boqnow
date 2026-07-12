# BOQNOW — Live hosting setup (one service at a time)

Paste keys from each dashboard into `.env.local` (local) and Vercel/Render env (production).
**Do not commit `.env.local` or `services.md`.**

---

## 1. Supabase (database + file storage)

1. [supabase.com](https://supabase.com) → **New project**
   - Name: `boqnow`
   - Region: **EU Central (Frankfurt)**
   - Save the database password
2. **Settings → Database** → copy connection strings:
   ```
   DATABASE_URL=postgresql://postgres:[PASSWORD]@db.[REF].supabase.co:5432/postgres?pgbouncer=true&connection_limit=1
   DIRECT_URL=postgresql://postgres:[PASSWORD]@db.[REF].supabase.co:5432/postgres
   ```
3. **Settings → API** → copy:
   ```
   NEXT_PUBLIC_SUPABASE_URL=https://[REF].supabase.co
   NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJ...
   SUPABASE_SERVICE_ROLE_KEY=eyJ...
   ```
4. **Storage** → New bucket `project-files` (private, 100MB limit)
5. **SQL Editor** → run `deploy/01-supabase.sql`
6. Locally:
   ```bash
   cp .env.example .env.local   # paste Supabase vars above
   npx prisma db push
   ```

---

## 2. Upstash (Redis — rate limits + job queue)

1. [upstash.com](https://upstash.com) → **Create database**
   - Name: `boqnow`
   - Region: **EU-West-1**
   - Type: Regional (free tier)
2. **Details** → copy:
   ```
   UPSTASH_REDIS_URL=https://....upstash.io
   UPSTASH_REDIS_TOKEN=...
   ```

---

## 3. Resend (transactional email)

1. [resend.com](https://resend.com) → **API Keys** → Create
   ```
   RESEND_API_KEY=re_...
   ```
2. (Optional) **Domains** → add `boqnow.io` and verify DNS before production sends

---

## 4. Clerk (authentication)

1. [dashboard.clerk.com](https://dashboard.clerk.com) → **Create application** `BOQNOW`
   - Sign-in: Email + Google
2. **API Keys**:
   ```
   NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=pk_...
   CLERK_SECRET_KEY=sk_...
   ```
3. **Paths** (set in Clerk + Vercel env):
   ```
   NEXT_PUBLIC_CLERK_SIGN_IN_URL=/sign-in
   NEXT_PUBLIC_CLERK_SIGN_UP_URL=/sign-up
   NEXT_PUBLIC_CLERK_AFTER_SIGN_IN_URL=/dashboard
   NEXT_PUBLIC_CLERK_AFTER_SIGN_UP_URL=/dashboard
   ```
4. **Webhooks** → endpoint `https://YOUR-DOMAIN/api/webhooks/clerk`
   - Events: `user.created`, `user.updated`, `user.deleted`
   ```
   CLERK_WEBHOOK_SECRET=whsec_...
   ```
5. **Users** → your user → copy ID:
   ```
   ADMIN_CLERK_USER_ID=user_...
   ```

---

## 5. Anthropic (Claude — BOQ generation)

1. [console.anthropic.com](https://console.anthropic.com) → **API Keys** → Create
   ```
   ANTHROPIC_API_KEY=sk-ant-...
   ```

---

## 6. Stripe (payments — not in services.md but required)

1. [dashboard.stripe.com](https://dashboard.stripe.com) → create 3 products (Starter €49, Pro €99, Agency €179/mo)
2. Copy price IDs + API keys + webhook secret (see `DEVELOPER_SETUP.md` §5)

---

## 7. Vercel (Next.js app)

1. Push repo to GitHub
2. [vercel.com](https://vercel.com) → **Import** this repo → Framework: Next.js
3. Add **all** env vars from `.env.example`
4. Deploy → copy production URL → set:
   ```
   NEXT_PUBLIC_APP_URL=https://your-app.vercel.app
   ```
5. Redeploy after env is complete
6. Update Clerk + Stripe webhook URLs to production domain

CLI (if already logged in):
```bash
vercel link
vercel env pull .env.local
vercel --prod
```

---

## 8. Render (background worker)

1. [render.com](https://render.com) → **New → Blueprint** → connect repo
2. Uses `render.yaml` at repo root (worker only)
3. Paste the same server-side env vars as Vercel (no `NEXT_PUBLIC_*` needed except `NEXT_PUBLIC_SUPABASE_URL` and `NEXT_PUBLIC_APP_URL`)

---

## Go-live checklist

```bash
npm run validate && npm run build
curl https://YOUR-DOMAIN/api/health   # → {"status":"ok"}
```

- [ ] Sign up / sign in works (Clerk)
- [ ] Upload PDF → BOQ generates (worker + Redis + Anthropic)
- [ ] Waitlist email sends (Resend)
- [ ] Stripe checkout opens (if configured)
