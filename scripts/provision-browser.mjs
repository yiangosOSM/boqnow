/**
 * Browser provisioning for BOQNOW services.
 * Usage: node scripts/provision-browser.mjs <service>
 * Services: supabase | upstash | resend | clerk | anthropic | vercel | render
 */
import { chromium } from 'playwright'
import { readFileSync, writeFileSync, existsSync } from 'fs'
import { join, dirname } from 'path'
import { fileURLToPath } from 'url'
import { getProvisionCredentials, loadEnvFiles } from './lib/load-env-file.mjs'

const __dirname = dirname(fileURLToPath(import.meta.url))
const ROOT = join(__dirname, '..')
const ENV_PATH = join(ROOT, '.env.local')
const SCREENSHOTS = join(ROOT, 'deploy', 'screenshots')

const { email: EMAIL, password: PASSWORD, resendPassword: RESEND_PASSWORD, dbPassword: PROVISION_DB_PASSWORD } =
  getProvisionCredentials()

function loadEnv() {
  return loadEnvFiles(ROOT)
}

function saveEnv(updates) {
  const existing = existsSync(ENV_PATH) ? readFileSync(ENV_PATH, 'utf8') : readFileSync(join(ROOT, '.env.example'), 'utf8')
  const lines = existing.split('\n')
  const keys = new Set(Object.keys(updates))

  const out = lines.map((line) => {
    const m = line.match(/^([A-Z_][A-Z0-9_]*)=/)
    if (m && keys.has(m[1])) {
      keys.delete(m[1])
      return `${m[1]}=${updates[m[1]]}`
    }
    return line
  })

  for (const k of keys) {
    out.push(`${k}=${updates[k]}`)
  }

  writeFileSync(ENV_PATH, out.join('\n'))
  console.log(`Updated .env.local with: ${Object.keys(updates).join(', ')}`)
}

async function screenshot(page, name) {
  const { mkdirSync } = await import('fs')
  mkdirSync(SCREENSHOTS, { recursive: true })
  const path = join(SCREENSHOTS, `${name}.png`)
  await page.screenshot({ path, fullPage: true })
  console.log(`Screenshot: ${path}`)
}

async function loginEmailPassword(page, email, password, opts = {}) {
  const { emailSelector, passwordSelector, submitSelector } = opts
  if (emailSelector) await page.fill(emailSelector, email)
  if (passwordSelector) await page.fill(passwordSelector, password)
  if (submitSelector) await page.click(submitSelector)
}

async function provisionSupabase(browser) {
  const ctx = await browser.newContext()
  const page = await ctx.newPage()
  const dbPassword = PROVISION_DB_PASSWORD
  if (!dbPassword) {
    throw new Error('Missing PROVISION_DB_PASSWORD in .env.local (required for new Supabase projects).')
  }

  console.log('=== SUPABASE ===')
  await page.goto('https://supabase.com/dashboard/sign-in', { waitUntil: 'domcontentloaded', timeout: 90000 })

  // Sign in with email
  await page.getByRole('button', { name: /continue with email/i }).click({ timeout: 10000 }).catch(() => {})
  await page.waitForTimeout(1000)

  const emailInput = page.locator('input[type="email"], input[name="email"]').first()
  await emailInput.waitFor({ timeout: 15000 })
  await emailInput.fill(EMAIL)
  await page.getByRole('button', { name: /continue|sign in/i }).first().click()

  await page.waitForTimeout(2000)
  const passInput = page.locator('input[type="password"]').first()
  if (await passInput.isVisible({ timeout: 5000 }).catch(() => false)) {
    await passInput.fill(PASSWORD)
    await page.getByRole('button', { name: /sign in|continue/i }).first().click()
  }

  await page.waitForURL(/dashboard/, { timeout: 60000 }).catch(async () => {
    await screenshot(page, 'supabase-login-fail')
    throw new Error('Supabase login failed — check screenshot')
  })

  console.log('Logged in to Supabase')

  // Check for existing boqnow project
  await page.goto('https://supabase.com/dashboard/projects', { waitUntil: 'domcontentloaded' })
  await page.waitForTimeout(2000)

  const hasBoqnow = await page.getByText('boqnow', { exact: false }).first().isVisible({ timeout: 5000 }).catch(() => false)

  if (!hasBoqnow) {
    console.log('Creating project boqnow...')
    await page.getByRole('link', { name: /new project/i }).click({ timeout: 10000 }).catch(async () => {
      await page.goto('https://supabase.com/dashboard/new', { waitUntil: 'domcontentloaded' })
    })

    await page.waitForTimeout(2000)
    await page.locator('input[name="name"], input[placeholder*="name" i]').first().fill('boqnow')
    await page.locator('input[type="password"]').first().fill(dbPassword)

    // Select EU Central if visible
    await page.getByText(/eu central|frankfurt/i).first().click({ timeout: 5000 }).catch(() => {})

    await page.getByRole('button', { name: /create new project|create project/i }).click()
    await page.waitForTimeout(30000)
  }

  // Open project
  await page.goto('https://supabase.com/dashboard/projects', { waitUntil: 'domcontentloaded' })
  await page.getByText('boqnow', { exact: false }).first().click({ timeout: 30000 })
  await page.waitForTimeout(3000)

  const projectUrl = page.url()
  const refMatch = projectUrl.match(/project\/([a-z0-9]+)/)
  const projectRef = refMatch?.[1]
  if (!projectRef) {
    await screenshot(page, 'supabase-no-ref')
    throw new Error('Could not extract Supabase project ref')
  }

  console.log(`Project ref: ${projectRef}`)

  // API settings
  await page.goto(`https://supabase.com/dashboard/project/${projectRef}/settings/api`, { waitUntil: 'domcontentloaded' })
  await page.waitForTimeout(2000)

  const pageText = await page.locator('body').innerText()
  const anonMatch = pageText.match(/eyJ[a-zA-Z0-9_-]+\.[a-zA-Z0-9_-]+\.[a-zA-Z0-9_-]+/g)

  let anonKey = ''
  let serviceKey = ''
  const keys = page.locator('input[readonly], code, pre').allTextContents()
  const allKeys = [...(await keys), ...(anonMatch || [])]
  const jwtKeys = [...new Set(allKeys.join(' ').match(/eyJ[a-zA-Z0-9_-]+\.[a-zA-Z0-9_-]+\.[a-zA-Z0-9_-]+/g) || [])]

  if (jwtKeys.length >= 2) {
    anonKey = jwtKeys[0]
    serviceKey = jwtKeys[1]
  } else if (jwtKeys.length === 1) {
    anonKey = jwtKeys[0]
  }

  // Try reveal service role
  await page.getByRole('button', { name: /reveal|show/i }).first().click({ timeout: 3000 }).catch(() => {})
  await page.waitForTimeout(1000)

  const supabaseUrl = `https://${projectRef}.supabase.co`
  const databaseUrl = `postgresql://postgres:${encodeURIComponent(dbPassword)}@db.${projectRef}.supabase.co:5432/postgres?pgbouncer=true&connection_limit=1`
  const directUrl = `postgresql://postgres:${encodeURIComponent(dbPassword)}@db.${projectRef}.supabase.co:5432/postgres`

  saveEnv({
    DATABASE_URL: databaseUrl,
    DIRECT_URL: directUrl,
    NEXT_PUBLIC_SUPABASE_URL: supabaseUrl,
    NEXT_PUBLIC_SUPABASE_ANON_KEY: anonKey || 'PASTE_FROM_DASHBOARD',
    SUPABASE_SERVICE_ROLE_KEY: serviceKey || 'PASTE_FROM_DASHBOARD',
  })

  // Storage bucket
  await page.goto(`https://supabase.com/dashboard/project/${projectRef}/storage/buckets`, { waitUntil: 'domcontentloaded' })
  const bucketExists = await page.getByText('project-files').isVisible({ timeout: 5000 }).catch(() => false)
  if (!bucketExists) {
    await page.getByRole('button', { name: /new bucket|create bucket/i }).click({ timeout: 10000 }).catch(() => {})
    await page.locator('input[name="name"]').fill('project-files').catch(() => page.getByLabel(/name/i).fill('project-files'))
    await page.getByRole('button', { name: /create|save/i }).last().click()
    console.log('Created storage bucket project-files')
  }

  await screenshot(page, 'supabase-done')
  await ctx.close()
  return { projectRef, supabaseUrl }
}

async function provisionUpstash(browser) {
  const ctx = await browser.newContext()
  const page = await ctx.newPage()
  console.log('=== UPSTASH ===')

  await page.goto('https://console.upstash.com/login', { waitUntil: 'domcontentloaded', timeout: 60000 })
  await page.fill('input[type="email"]', EMAIL)
  await page.fill('input[type="password"]', PASSWORD)
  await page.getByRole('button', { name: /sign in|login/i }).click()
  await page.waitForTimeout(5000)

  await page.goto('https://console.upstash.com/redis', { waitUntil: 'domcontentloaded' })
  const hasDb = await page.getByText('boqnow').isVisible({ timeout: 5000 }).catch(() => false)

  if (!hasDb) {
    await page.getByRole('button', { name: /create database/i }).click({ timeout: 10000 }).catch(() => {})
    await page.waitForTimeout(2000)
    await page.getByLabel(/name/i).fill('boqnow').catch(() => page.locator('input').first().fill('boqnow'))
    await page.getByText(/eu-west|ireland/i).first().click({ timeout: 5000 }).catch(() => {})
    await page.getByRole('button', { name: /create/i }).last().click()
    await page.waitForTimeout(10000)
  }

  await page.getByText('boqnow').first().click({ timeout: 15000 })
  await page.waitForTimeout(3000)

  const body = await page.locator('body').innerText()
  const urlMatch = body.match(/https:\/\/[a-z0-9-]+\.upstash\.io/)
  const tokenMatch = body.match(/[A-Za-z0-9_=-]{20,}/)

  saveEnv({
    UPSTASH_REDIS_URL: urlMatch?.[0] || 'PASTE_FROM_DASHBOARD',
    UPSTASH_REDIS_TOKEN: 'PASTE_FROM_DASHBOARD',
  })

  await screenshot(page, 'upstash-done')
  await ctx.close()
}

async function provisionResend(browser) {
  const ctx = await browser.newContext()
  const page = await ctx.newPage()
  console.log('=== RESEND ===')

  await page.goto('https://resend.com/login', { waitUntil: 'domcontentloaded', timeout: 60000 })
  await page.fill('input[type="email"], input[name="email"]', EMAIL)
  await page.fill('input[type="password"]', RESEND_PASSWORD)
  await page.getByRole('button', { name: /sign in|log in|continue/i }).click()
  await page.waitForTimeout(5000)

  await page.goto('https://resend.com/api-keys', { waitUntil: 'domcontentloaded' })
  await page.getByRole('button', { name: /create api key|add api key/i }).click({ timeout: 10000 }).catch(() => {})
  await page.waitForTimeout(2000)
  await page.getByLabel(/name/i).fill('boqnow-production').catch(() => {})
  await page.getByRole('button', { name: /create|add/i }).last().click().catch(() => {})
  await page.waitForTimeout(3000)

  const body = await page.locator('body').innerText()
  const apiKey = body.match(/re_[a-zA-Z0-9_]+/)?.[0]

  if (apiKey) saveEnv({ RESEND_API_KEY: apiKey })

  await screenshot(page, 'resend-done')
  await ctx.close()
}

async function provisionClerk(browser) {
  const ctx = await browser.newContext()
  const page = await ctx.newPage()
  console.log('=== CLERK ===')

  await page.goto('https://dashboard.clerk.com/sign-in', { waitUntil: 'domcontentloaded', timeout: 60000 })
  await page.fill('input[name="identifier"], input[type="email"]', EMAIL)
  await page.getByRole('button', { name: /continue/i }).click()
  await page.waitForTimeout(2000)
  await page.fill('input[type="password"]', PASSWORD)
  await page.getByRole('button', { name: /continue|sign in/i }).click()
  await page.waitForTimeout(8000)

  // Create app if needed
  const hasBoqnow = await page.getByText('BOQNOW').isVisible({ timeout: 5000 }).catch(() => false)
  if (!hasBoqnow) {
    await page.getByRole('link', { name: /create application|add application/i }).click({ timeout: 10000 }).catch(() => {})
    await page.waitForTimeout(2000)
    await page.fill('input[name="name"]', 'BOQNOW').catch(() => page.locator('input').first().fill('BOQNOW'))
    await page.getByRole('button', { name: /create/i }).click()
    await page.waitForTimeout(5000)
  }

  await page.getByText('BOQNOW').first().click({ timeout: 15000 }).catch(() => {})
  await page.goto('https://dashboard.clerk.com/last-active?path=api-keys', { waitUntil: 'domcontentloaded' })
  await page.waitForTimeout(3000)

  const body = await page.locator('body').innerText()
  const pk = body.match(/pk_(test|live)_[a-zA-Z0-9]+/)?.[0]
  const sk = body.match(/sk_(test|live)_[a-zA-Z0-9]+/)?.[0]

  const updates = {}
  if (pk) updates.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY = pk
  if (sk) updates.CLERK_SECRET_KEY = sk
  updates.NEXT_PUBLIC_CLERK_SIGN_IN_URL = '/sign-in'
  updates.NEXT_PUBLIC_CLERK_SIGN_UP_URL = '/sign-up'
  updates.NEXT_PUBLIC_CLERK_AFTER_SIGN_IN_URL = '/dashboard'
  updates.NEXT_PUBLIC_CLERK_AFTER_SIGN_UP_URL = '/dashboard'
  saveEnv(updates)

  await screenshot(page, 'clerk-done')
  await ctx.close()
}

async function provisionAnthropic(browser) {
  const ctx = await browser.newContext()
  const page = await ctx.newPage()
  console.log('=== ANTHROPIC ===')

  await page.goto('https://platform.claude.com/login', { waitUntil: 'domcontentloaded', timeout: 60000 })
  await page.fill('input[type="email"]', EMAIL)
  await page.getByTestId('continue').click()
  await page.waitForTimeout(2000)
  await page.fill('input[type="password"]', PASSWORD)
  await page.getByRole('button', { name: /sign in|continue|log in/i }).click()
  await page.waitForTimeout(8000)

  await page.goto('https://platform.claude.com/settings/keys', { waitUntil: 'domcontentloaded' })
  await page.getByRole('button', { name: /create key|new key/i }).click({ timeout: 10000 }).catch(() => {})
  await page.waitForTimeout(2000)
  await page.getByLabel(/name/i).fill('boqnow-production').catch(() => {})
  await page.getByRole('combobox', { name: /expires/i }).click().catch(() => {})
  await page.getByRole('option', { name: /never/i }).click().catch(() => {})
  await page.getByRole('button', { name: /^add$/i }).click().catch(() => {})
  await page.waitForTimeout(3000)

  const body = await page.locator('body').innerText()
  const key = body.match(/sk-ant-[a-zA-Z0-9_-]+/)?.[0]
  if (key) saveEnv({ ANTHROPIC_API_KEY: key })

  await screenshot(page, 'anthropic-done')
  await ctx.close()
}

async function provisionVercel(browser) {
  const ctx = await browser.newContext()
  const page = await ctx.newPage()
  console.log('=== VERCEL ===')

  await page.goto('https://vercel.com/login', { waitUntil: 'domcontentloaded', timeout: 60000 })
  await page.getByRole('button', { name: /continue with email/i }).click({ timeout: 10000 }).catch(() => {})
  await page.fill('input[name="email"], input[type="email"]', EMAIL)
  await page.getByRole('button', { name: /continue|sign in/i }).click()
  await page.waitForTimeout(2000)
  await page.fill('input[type="password"]', PASSWORD)
  await page.getByRole('button', { name: /sign in|continue/i }).click()
  await page.waitForTimeout(10000)

  await page.goto('https://vercel.com/new', { waitUntil: 'domcontentloaded' })
  await page.waitForTimeout(3000)

  // Import from GitHub if repo visible
  await page.getByText(/boq/i).first().click({ timeout: 15000 }).catch(async () => {
    console.log('Could not auto-import repo — import manually in Vercel dashboard')
  })

  await screenshot(page, 'vercel-done')
  await ctx.close()
}

async function provisionRender(browser) {
  const ctx = await browser.newContext()
  const page = await ctx.newPage()
  console.log('=== RENDER ===')

  await page.goto('https://dashboard.render.com/login', { waitUntil: 'domcontentloaded', timeout: 60000 })
  await page.fill('input[type="email"]', EMAIL)
  await page.fill('input[type="password"]', PASSWORD)
  await page.getByRole('button', { name: /sign in|log in/i }).click()
  await page.waitForTimeout(8000)

  await page.goto('https://dashboard.render.com/blueprints', { waitUntil: 'domcontentloaded' })
  await screenshot(page, 'render-done')
  await ctx.close()
}

const service = process.argv[2]
const runners = {
  supabase: provisionSupabase,
  upstash: provisionUpstash,
  resend: provisionResend,
  clerk: provisionClerk,
  anthropic: provisionAnthropic,
  vercel: provisionVercel,
  render: provisionRender,
  all: null,
}

if (!service || (!runners[service] && service !== 'all')) {
  console.log('Usage: node scripts/provision-browser.mjs <supabase|upstash|resend|clerk|anthropic|vercel|render|all>')
  process.exit(1)
}

const browser = await chromium.launch({ headless: true })

try {
  if (service === 'all') {
    for (const name of ['supabase', 'upstash', 'resend', 'clerk', 'anthropic', 'vercel', 'render']) {
      try {
        await runners[name](browser)
        console.log(`✓ ${name} done`)
      } catch (err) {
        console.error(`✗ ${name} failed:`, err.message)
      }
    }
  } else {
    await runners[service](browser)
    console.log(`✓ ${service} done`)
  }
} finally {
  await browser.close()
}
