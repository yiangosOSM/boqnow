// src/lib/engine/file-security.ts
import { createHash } from 'crypto'

const MAGIC_BYTES: Record<string, number[][]> = {
  pdf:  [[0x25, 0x50, 0x44, 0x46]],
  png:  [[0x89, 0x50, 0x4E, 0x47]],
  jpg:  [[0xFF, 0xD8, 0xFF]],
  xlsx: [[0x50, 0x4B, 0x03, 0x04]],
  docx: [[0x50, 0x4B, 0x03, 0x04]],
  doc:  [[0xD0, 0xCF, 0x11, 0xE0]],
  xls:  [[0xD0, 0xCF, 0x11, 0xE0]],
  dwg:  [[0x41, 0x43, 0x31, 0x30], [0x41, 0x43, 0x31, 0x35]],
}

export interface SecurityCheckResult {
  valid: boolean
  sha256: string
  isDuplicate?: boolean
  virusScanStatus?: 'clean' | 'pending' | 'infected' | 'skipped'
  reasons: string[]
}

export function computeHash(buffer: Buffer): string {
  return createHash('sha256').update(buffer).digest('hex')
}

export function verifyMagicBytes(buffer: Buffer, ext: string): boolean {
  const signatures = MAGIC_BYTES[ext.toLowerCase()]
  if (!signatures) return true
  return signatures.some(sig => sig.every((byte, i) => buffer[i] === byte))
}

function hasExecutableContent(buffer: Buffer, ext: string): boolean {
  if (!['pdf', 'xlsx', 'xls', 'csv', 'docx', 'doc'].includes(ext)) return false
  const sample = buffer.toString('utf-8', 0, Math.min(buffer.length, 2048))
  return ['<?php', '<script', 'eval(', 'exec(', '/bin/sh', 'cmd.exe', 'powershell', 'base64_decode']
    .some(p => sample.toLowerCase().includes(p))
}

export function securityCheck(
  buffer: Buffer, filename: string, existingHashes: string[] = []
): SecurityCheckResult {
  const reasons: string[] = []
  const ext = filename.split('.').pop()?.toLowerCase() || ''
  const sha256 = computeHash(buffer)

  if (buffer.length === 0) reasons.push('Κενό αρχείο')
  if (buffer.length > 100 * 1024 * 1024) reasons.push('Αρχείο υπερβαίνει τα 100MB')
  if (!verifyMagicBytes(buffer, ext)) reasons.push(`Magic bytes mismatch για .${ext}`)
  if (hasExecutableContent(buffer, ext)) reasons.push('Ύποπτο περιεχόμενο εντοπίστηκε')
  if (/[<>:"/\\|?*\x00-\x1f]/.test(filename)) reasons.push('Μη έγκυρο όνομα αρχείου')

  const isDuplicate = existingHashes.includes(sha256)

  return { valid: reasons.length === 0, sha256, isDuplicate, virusScanStatus: 'skipped', reasons }
}

// ── VirusTotal scan (no server needed — uses their API) ────────
// Free tier: 500 lookups/day, 4 requests/minute
// For files already seen by VT (hash lookup — zero upload needed)
export async function virusTotalHashLookup(sha256: string): Promise<{
  clean: boolean
  detections: number
  total: number
  skipped: boolean
}> {
  const apiKey = process.env.VIRUSTOTAL_API_KEY

  // In production, malware scanning is mandatory
  if (!apiKey) {
    if (process.env.NODE_ENV === 'production') {
      console.error('VIRUSTOTAL_API_KEY missing in production — uploads blocked')
      return { clean: false, detections: -1, total: 0, skipped: false }
    }
    // Dev/test: skip silently
    return { clean: true, detections: 0, total: 0, skipped: true }
  }

  try {
    const res = await fetch(`https://www.virustotal.com/api/v3/files/${sha256}`, {
      headers: { 'x-apikey': apiKey },
    })

    if (res.status === 404) {
      // File not in VT database — not a known malware (new file)
      return { clean: true, detections: 0, total: 0, skipped: false }
    }

    if (!res.ok) return { clean: true, detections: 0, total: 0, skipped: true }

    const data = await res.json()
    const stats = data.data?.attributes?.last_analysis_stats || {}
    const detections = (stats.malicious || 0) + (stats.suspicious || 0)
    const total = Object.values(stats).reduce((a: number, b) => a + (b as number), 0) as number

    return { clean: detections === 0, detections, total, skipped: false }
  } catch {
    return { clean: true, detections: 0, total: 0, skipped: true }
  }
}

export function sanitizeFilename(filename: string): string {
  return filename
    .replace(/[<>:"/\\|?*\x00-\x1f]/g, '_')
    .replace(/\s+/g, '_')
    .replace(/_{2,}/g, '_')
    .slice(0, 200)
}
