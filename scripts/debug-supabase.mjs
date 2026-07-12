import { chromium } from 'playwright'
import { mkdirSync } from 'fs'
import { join } from 'path'
import { getProvisionCredentials } from './lib/load-env-file.mjs'

const { email: EMAIL, password: PASSWORD } = getProvisionCredentials()
const dir = join(process.cwd(), 'deploy/screenshots')
mkdirSync(dir, { recursive: true })

async function acceptCookies(page) {
  await page.getByRole('button', { name: /^accept$/i }).click({ timeout: 3000 }).catch(() => {})
}

async function supabaseLogin(page) {
  await page.goto('https://supabase.com/dashboard/sign-in', { waitUntil: 'domcontentloaded' })
  await acceptCookies(page)
  await page.locator('#email, input[type="email"]').first().fill(EMAIL)
  await page.locator('#password, input[type="password"]').first().fill(PASSWORD)
  await page.getByRole('button', { name: /^sign in$/i }).click()
  await page.waitForTimeout(8000)
  await acceptCookies(page)
}

const browser = await chromium.launch({ headless: true })
const ctx = await browser.newContext()
const page = await ctx.newPage()

await supabaseLogin(page)
console.log('After login URL:', page.url())
await page.screenshot({ path: join(dir, 'supabase-after-login.png'), fullPage: true })

const body = await page.locator('body').innerText()
console.log('Page text:', body.slice(0, 1200))

// Try create organization
const newOrg = page.getByRole('button', { name: /new organization|create organization/i })
if (await newOrg.isVisible({ timeout: 3000 }).catch(() => false)) {
  await newOrg.click()
  await page.waitForTimeout(2000)
  await page.screenshot({ path: join(dir, 'supabase-new-org.png'), fullPage: true })
}

// Try new project link
for (const link of [/new project/i, /create a project/i, /new organization/i]) {
  const el = page.getByRole('link', { name: link }).or(page.getByRole('button', { name: link }))
  if (await el.first().isVisible({ timeout: 2000 }).catch(() => false)) {
    console.log('Found:', link)
    await el.first().click()
    await page.waitForTimeout(3000)
    break
  }
}

await page.screenshot({ path: join(dir, 'supabase-final.png'), fullPage: true })
console.log('Final URL:', page.url())

await browser.close()
