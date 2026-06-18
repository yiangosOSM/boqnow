// src/lib/engine/cost-control.ts
export const COST_LIMITS = {
  MAX_FILES_PER_PROJECT:  30,
  MAX_FILE_SIZE_MB:       100,
  MAX_TOTAL_SIZE_MB:      300,
  MAX_PDF_PAGES:          50,
  MAX_TOKENS_PER_REQUEST: 8192,
  EXCEL_MAX_ROWS:         500,
  TEXT_MAX_CHARS:         40000,
  DAILY_REQUESTS: { FREE: 2, STARTER: 5, PRO: 15, AGENCY: 50 },
  EST_COST_PER_REQUEST: { geometry_extraction: 0.04, supplementary: 0.03, ai_only: 0.08, total_hybrid: 0.07 },
}

export interface FileInfo { name: string; sizeBytes: number; pdfPages?: number }

export interface CostCheckResult {
  allowed: boolean
  reasons: string[]
  warnings: string[]
  totalSizeMB: number
  estimatedCostEUR: number
}

export function checkRequestCost(files: FileInfo[]): CostCheckResult {
  const reasons: string[] = []
  const warnings: string[] = []

  if (files.length > COST_LIMITS.MAX_FILES_PER_PROJECT) {
    reasons.push(`Μέγιστο ${COST_LIMITS.MAX_FILES_PER_PROJECT} αρχεία ανά project (ανέβασες ${files.length})`)
  }

  const totalMB = files.reduce((s, f) => s + f.sizeBytes, 0) / (1024 * 1024)
  if (totalMB > COST_LIMITS.MAX_TOTAL_SIZE_MB) {
    reasons.push(`Συνολικό μέγεθος ${totalMB.toFixed(0)}MB υπερβαίνει το όριο ${COST_LIMITS.MAX_TOTAL_SIZE_MB}MB`)
  }

  for (const f of files) {
    const mb = f.sizeBytes / (1024 * 1024)
    if (mb > COST_LIMITS.MAX_FILE_SIZE_MB) {
      reasons.push(`"${f.name}": ${mb.toFixed(0)}MB υπερβαίνει τα ${COST_LIMITS.MAX_FILE_SIZE_MB}MB`)
    }
    if (f.pdfPages && f.pdfPages > COST_LIMITS.MAX_PDF_PAGES) {
      reasons.push(`"${f.name}": ${f.pdfPages} σελίδες υπερβαίνουν το όριο ${COST_LIMITS.MAX_PDF_PAGES}`)
    }
  }

  // Warnings (allow but inform)
  const largePDFs = files.filter(f => f.name.toLowerCase().endsWith('.pdf') && f.sizeBytes > 20 * 1024 * 1024)
  if (largePDFs.length > 0) warnings.push(`${largePDFs.length} PDF >20MB — ανάλυση θα αργήσει`)
  if (files.length > 20) warnings.push(`${files.length} αρχεία — αναμένεται 2-3 λεπτά`)

  return { allowed: reasons.length === 0, reasons, warnings, totalSizeMB: parseFloat(totalMB.toFixed(1)), estimatedCostEUR: COST_LIMITS.EST_COST_PER_REQUEST.total_hybrid }
}

// ── Estimate PDF pages from buffer size (proxy before parsing) ─
export function estimatePDFPages(buffer: Buffer): number {
  // Count /Page objects in PDF — rough but fast
  const text = buffer.toString('binary', 0, Math.min(buffer.length, 500000))
  const matches = text.match(/\/Type\s*\/Page[^s]/g)
  return matches ? matches.length : Math.ceil(buffer.length / 150000) // fallback: ~150KB/page
}

export function truncateToTokenBudget(text: string, maxChars = COST_LIMITS.TEXT_MAX_CHARS): string {
  if (text.length <= maxChars) return text
  return text.slice(0, maxChars) + `\n\n[... περιεχόμενο περικόπηκε — ${text.length - maxChars} χαρακτήρες παραλείφθηκαν]`
}

export function formatMB(bytes: number): string {
  return `${(bytes / (1024 * 1024)).toFixed(1)}MB`
}
