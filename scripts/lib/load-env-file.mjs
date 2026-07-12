/**
 * Load key=value pairs from .env.local and .env (local files only — never committed).
 * Later files do not override earlier ones; .env.local wins over .env.
 */
import { existsSync, readFileSync } from 'fs'
import { join, dirname } from 'path'
import { fileURLToPath } from 'url'

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '../..')

function parseEnvFile(path) {
  const env = {}
  if (!existsSync(path)) return env
  for (const line of readFileSync(path, 'utf8').split('\n')) {
    const trimmed = line.trim()
    if (!trimmed || trimmed.startsWith('#')) continue
    const eq = trimmed.indexOf('=')
    if (eq === -1) continue
    const key = trimmed.slice(0, eq).trim()
    let value = trimmed.slice(eq + 1).trim()
    if (
      (value.startsWith('"') && value.endsWith('"')) ||
      (value.startsWith("'") && value.endsWith("'"))
    ) {
      value = value.slice(1, -1)
    }
    env[key] = value
  }
  return env
}

/** @param {string} [root] */
export function loadEnvFiles(root = ROOT) {
  return {
    ...parseEnvFile(join(root, '.env')),
    ...parseEnvFile(join(root, '.env.local')),
  }
}

/** @param {string} key @param {string} [root] */
export function requireEnv(key, root = ROOT) {
  const value = loadEnvFiles(root)[key]
  if (!value) {
    throw new Error(
      `Missing ${key}. Add it to .env.local (see .env.example). Never commit real credentials.`
    )
  }
  return value
}

export function getProvisionCredentials(root = ROOT) {
  const env = loadEnvFiles(root)
  const email = env.PROVISION_EMAIL
  const password = env.PROVISION_PASSWORD
  const resendPassword = env.PROVISION_RESEND_PASSWORD || password
  const dbPassword = env.PROVISION_DB_PASSWORD

  if (!email || !password) {
    throw new Error(
      'Missing PROVISION_EMAIL or PROVISION_PASSWORD in .env.local. See .env.example.'
    )
  }

  return { email, password, resendPassword, dbPassword }
}
