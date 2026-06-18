// src/lib/engine/file-parser.ts v2.0
// Supports: PDF, Excel, Word (DOCX), CSV, DWG, DXF, PNG, JPG
// Word parsing via mammoth (plain text extraction)

import * as XLSX from 'xlsx'

export interface ParsedFile {
  type: 'excel' | 'csv' | 'pdf' | 'image' | 'dwg' | 'word' | 'unknown'
  text: string
  structured?: any[][]
  metadata: {
    filename: string
    sheets?: string[]
    rowCount?: number
    wordCount?: number
    hasQuantities?: boolean   // Excel/Word with numbers likely to be BOQ-relevant
    hasDimensions?: boolean   // contains m², m³, τεμ etc
  }
}

export interface PreUploadCheck {
  allowed: boolean
  fileType: string
  warning?: string          // shown to user before pipeline starts
  isProvisional?: boolean   // will this produce mostly provisional items?
  missingDrawingTypes?: string[]  // e.g. ['Υδραυλικά', 'Ηλεκτρολογικά']
}

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// SUPPORTED FILE TYPES (expanded)
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
export const ALLOWED_EXTENSIONS = [
  'pdf',           // Αρχιτεκτονικά σχέδια, BOQ, specs
  'xlsx', 'xls',  // Excel BOQ, τιμοκατάλογοι, διαστάσεις
  'csv',           // Εξαγωγές από CAD, υλικά
  'dwg', 'dxf',   // CAD αρχεία (Provisional)
  'png', 'jpg', 'jpeg', // Σκαν σχεδίων, φωτογραφίες
  'docx', 'doc',  // Word περιγραφές, specs, τεχνικές προδιαγραφές
]

export const FILE_TYPE_LABELS: Record<string, string> = {
  pdf:  'Σχέδιο PDF',
  xlsx: 'Excel (διαστάσεις/BOQ)',
  xls:  'Excel (διαστάσεις/BOQ)',
  csv:  'CSV δεδομένα',
  dwg:  'CAD σχέδιο (DWG)',
  dxf:  'CAD σχέδιο (DXF)',
  png:  'Εικόνα σχεδίου',
  jpg:  'Εικόνα σχεδίου',
  jpeg: 'Εικόνα σχεδίου',
  docx: 'Word περιγραφή/specs',
  doc:  'Word περιγραφή/specs',
}

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// PRE-UPLOAD QUALITY CHECK
// Runs BEFORE pipeline — warns user upfront
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
export function preUploadCheck(
  filenames: string[],
  fileSizes: number[]
): PreUploadCheck & { fileAnalysis: Array<{ name: string; type: string; warning?: string }> } {
  const exts = filenames.map(f => f.split('.').pop()?.toLowerCase() || '')
  const fileAnalysis: Array<{ name: string; type: string; warning?: string }> = []

  const warnings: string[] = []
  const missingTypes: string[] = []
  let hasArchitectural = false
  let hasElectrical = false
  let hasPlumbing = false
  let hasSizes = false

  for (let i = 0; i < filenames.length; i++) {
    const name = filenames[i]
    const ext = exts[i]
    const sizeMB = fileSizes[i] / (1024 * 1024)
    const label = FILE_TYPE_LABELS[ext] || `Άγνωστος τύπος (.${ext})`
    let fileWarning: string | undefined

    // Detect content type from filename
    const n = name.toLowerCase()
    if (n.includes('κατοψ') || n.includes('plan') || n.includes('floor') ||
        n.includes('τομ') || n.includes('section') || n.includes('οψ') || n.includes('elev') ||
        ext === 'pdf' || ['png','jpg','jpeg'].includes(ext)) {
      hasArchitectural = true
    }
    if (n.includes('ηλεκτ') || n.includes('elect')) hasElectrical = true
    if (n.includes('υδρ') || n.includes('plumb') || n.includes('sanit')) hasPlumbing = true
    if (['xlsx','xls','csv'].includes(ext)) hasSizes = true
    if (ext === 'docx' || ext === 'doc') hasSizes = true // may contain specs

    // Per-file warnings
    if (!ALLOWED_EXTENSIONS.includes(ext)) {
      fileWarning = `Μη υποστηριζόμενος τύπος — θα αγνοηθεί`
    } else if (['dwg','dxf'].includes(ext)) {
      fileWarning = `CAD αρχείο — δεν αναλύεται άμεσα, οι κατηγορίες του θα είναι Provisional`
    } else if (sizeMB > 50) {
      fileWarning = `Μεγάλο αρχείο (${sizeMB.toFixed(0)}MB) — ενδέχεται να επιβραδύνει την ανάλυση`
    } else if (['png','jpg','jpeg'].includes(ext) && sizeMB > 20) {
      fileWarning = `Μεγάλη εικόνα — συνιστάται μετατροπή σε PDF`
    }

    fileAnalysis.push({ name, type: label, warning: fileWarning })
  }

  // Missing drawing type alerts
  if (!hasArchitectural && !hasSizes) {
    warnings.push('Δεν εντοπίστηκαν αρχιτεκτονικά σχέδια — το BOQ θα βασιστεί μόνο σε κείμενο/λίστες')
  }
  if (!hasElectrical) missingTypes.push('Ηλεκτρολογικά')
  if (!hasPlumbing) missingTypes.push('Υδραυλικά')

  const isProvisional = !hasArchitectural && !hasSizes
  const onlyDWG = exts.every(e => ['dwg','dxf'].includes(e))
  if (onlyDWG) {
    warnings.push('Μόνο DWG/DXF αρχεία — το BOQ θα είναι εξ ολοκλήρου Provisional. Συνιστάται εξαγωγή σε PDF πρώτα.')
  }

  return {
    allowed: filenames.some(f => ALLOWED_EXTENSIONS.includes(f.split('.').pop()?.toLowerCase() || '')),
    fileType: exts.length === 1 ? (FILE_TYPE_LABELS[exts[0]] || 'Άγνωστο') : `${exts.length} αρχεία`,
    warning: warnings.length > 0 ? warnings.join(' | ') : undefined,
    isProvisional,
    missingDrawingTypes: missingTypes.length > 0 ? missingTypes : undefined,
    fileAnalysis,
  }
}

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// EXCEL / XLS / XLSX
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
export function parseExcel(buffer: Buffer, filename: string): ParsedFile {
  try {
    const workbook = XLSX.read(buffer, { type: 'buffer', cellDates: true, cellText: true })
    const sheets = workbook.SheetNames
    let fullText = `[Excel: ${filename}]\n`
    const allRows: any[][] = []
    let hasDimensions = false

    for (const sheetName of sheets) {
      const ws = workbook.Sheets[sheetName]
      const rows: any[][] = XLSX.utils.sheet_to_json(ws, { header: 1, defval: '', blankrows: false }) as any[][]
      fullText += `\n--- Φύλλο: ${sheetName} ---\n`

      for (const row of rows.slice(0, 500)) {
        const cells = (row as any[]).map(c => String(c ?? '').trim()).filter(c => c)
        if (cells.length > 0) {
          fullText += cells.join('\t') + '\n'
          allRows.push(row as any[])
          const rowStr = cells.join(' ').toLowerCase()
          if (rowStr.match(/m²|m³|τεμ|kg|μ\.μ\.|m\.m\.|ποσ|qty|quantity|εμβαδ|διαστ/)) {
            hasDimensions = true
          }
        }
      }
      if (rows.length > 500) fullText += `[... ${rows.length - 500} ακόμα γραμμές]\n`
    }

    return {
      type: 'excel',
      text: fullText,
      structured: allRows,
      metadata: { filename, sheets, rowCount: allRows.length, hasQuantities: allRows.length > 5, hasDimensions },
    }
  } catch (err) {
    return { type: 'excel', text: `[Excel error: ${filename} — ${(err as Error).message}]`, metadata: { filename } }
  }
}

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// WORD (DOCX/DOC) — text extraction
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
export async function parseWord(buffer: Buffer, filename: string): Promise<ParsedFile> {
  try {
    // Dynamic import — mammoth is optional dep
    const mammoth = await import('mammoth')
    const result = await mammoth.extractRawText({ buffer })
    const text = result.value?.trim() || ''
    const words = text.split(/\s+/).length
    const hasDimensions = !!(text.match(/m²|m³|τεμ|kg|\d+\.\d+\s*m|εμβαδ|διαστ|ύψος|μήκος|πλάτος/i))

    return {
      type: 'word',
      text: `[Word: ${filename}]\n${text.slice(0, 20000)}${text.length > 20000 ? '\n[...κείμενο περικόπηκε]' : ''}`,
      metadata: { filename, wordCount: words, hasDimensions },
    }
  } catch {
    // Fallback: try raw text extraction for .doc
    try {
      const raw = buffer.toString('utf-8').replace(/[^\x20-\x7E\u0370-\u03FF\u1F00-\u1FFF\n\t]/g, ' ').replace(/\s{3,}/g, '\n').trim()
      if (raw.length > 100) {
        return { type: 'word', text: `[Word (raw): ${filename}]\n${raw.slice(0, 10000)}`, metadata: { filename } }
      }
    } catch {}
    return { type: 'word', text: `[Word: ${filename} — δεν ήταν δυνατή η ανάλυση. Μετατρέψτε σε PDF.]`, metadata: { filename } }
  }
}

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// CSV
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
export function parseCSV(buffer: Buffer, filename: string): ParsedFile {
  try {
    const text = buffer.toString('utf-8')
    const workbook = XLSX.read(text, { type: 'string' })
    const ws = workbook.Sheets[workbook.SheetNames[0]]
    const rows: any[][] = XLSX.utils.sheet_to_json(ws, { header: 1, defval: '' }) as any[][]
    let fullText = `[CSV: ${filename}]\n`
    for (const row of rows.slice(0, 1000)) {
      const cells = (row as any[]).map(c => String(c ?? '').trim()).filter(c => c)
      if (cells.length > 0) fullText += cells.join('\t') + '\n'
    }
    return { type: 'csv', text: fullText, structured: rows, metadata: { filename, rowCount: rows.length } }
  } catch {
    const raw = buffer.toString('utf-8', 0, 50000)
    return { type: 'csv', text: `[CSV: ${filename}]\n${raw}`, metadata: { filename } }
  }
}

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// DWG/DXF — binary, cannot parse directly
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
export function parseDWG(filename: string): ParsedFile {
  const category = inferCategoryFromName(filename.replace(/\.(dwg|dxf)$/i, ''))
  return {
    type: 'dwg',
    text: `[CAD: ${filename}]
Εκτιμώμενη κατηγορία: ${category}
Σημείωση: Το DWG/DXF δεν αναλύεται απευθείας. Χρησιμοποίησε τα PDF/εικόνες για ποσότητες.
Αν δεν υπάρχουν άλλα σχέδια, δημιούργησε Provisional Sum για αυτή την κατηγορία.`,
    metadata: { filename },
  }
}

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// ROUTER — routes each file to correct parser
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
export async function parseFile(buffer: Buffer, filename: string): Promise<ParsedFile> {
  const ext = filename.split('.').pop()?.toLowerCase() || ''
  switch (ext) {
    case 'xlsx': case 'xls': return parseExcel(buffer, filename)
    case 'csv':              return parseCSV(buffer, filename)
    case 'dwg': case 'dxf': return parseDWG(filename)
    case 'docx': case 'doc': return parseWord(buffer, filename)
    case 'pdf': case 'png': case 'jpg': case 'jpeg':
      return { type: ext === 'pdf' ? 'pdf' : 'image', text: `[${ext.toUpperCase()}: ${filename}]`, metadata: { filename } }
    default:
      return { type: 'unknown', text: `[Άγνωστος τύπος: ${filename}]`, metadata: { filename } }
  }
}

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// MAGIC BYTES — add Word formats
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
export const MAGIC_BYTES_EXTENDED: Record<string, number[][]> = {
  pdf:  [[0x25, 0x50, 0x44, 0x46]],
  png:  [[0x89, 0x50, 0x4E, 0x47]],
  jpg:  [[0xFF, 0xD8, 0xFF]],
  jpeg: [[0xFF, 0xD8, 0xFF]],
  xlsx: [[0x50, 0x4B, 0x03, 0x04]],  // ZIP container (also docx)
  docx: [[0x50, 0x4B, 0x03, 0x04]],  // Same as xlsx — both are ZIP
  xls:  [[0xD0, 0xCF, 0x11, 0xE0]],
  doc:  [[0xD0, 0xCF, 0x11, 0xE0]],  // Same as xls — both OLE2
  dwg:  [[0x41, 0x43, 0x31, 0x30], [0x41, 0x43, 0x31, 0x35]],
  dxf:  [],  // ASCII text, no magic bytes
}

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// VALIDATE UPLOAD
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
export function validateUploadedFile(filename: string, sizeBytes: number): { valid: boolean; reason?: string } {
  const MAX_SIZE = 100 * 1024 * 1024
  const ext = filename.split('.').pop()?.toLowerCase() || ''

  if (!ALLOWED_EXTENSIONS.includes(ext)) {
    return { valid: false, reason: `Μη υποστηριζόμενος τύπος .${ext}. Αποδεκτά: PDF, Excel, Word, CSV, DWG, PNG, JPG` }
  }
  if (sizeBytes > MAX_SIZE) {
    return { valid: false, reason: `Αρχείο πολύ μεγάλο: ${(sizeBytes / 1024 / 1024).toFixed(1)}MB (μέγιστο 100MB)` }
  }
  if (sizeBytes === 0) {
    return { valid: false, reason: 'Κενό αρχείο' }
  }
  return { valid: true }
}

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// HELPERS
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
function inferCategoryFromName(name: string): string {
  const n = name.toLowerCase()
  if (n.match(/ηλεκτ|elect/)) return 'Ηλεκτρολογικά'
  if (n.match(/υδρ|plumb|sanit/)) return 'Υδραυλικά'
  if (n.match(/κατοψ|katops|floor|plan/)) return 'Κάτοψη'
  if (n.match(/τομ|section/)) return 'Τομή'
  if (n.match(/στατ|struct/)) return 'Στατικά'
  if (n.match(/λεπτ|detail/)) return 'Λεπτομέρεια'
  if (n.match(/οψ|facade|elev/)) return 'Όψη'
  if (n.match(/θεμελ|found/)) return 'Θεμελίωση'
  return 'Γενικό σχέδιο'
}
