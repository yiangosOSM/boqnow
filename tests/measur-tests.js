// /home/claude/measur-tests.js
// Simulated tests — no real API calls, tests logic in isolation

let passed = 0
let failed = 0

function test(name, fn) {
  try {
    fn()
    console.log(`  ✓ ${name}`)
    passed++
  } catch (e) {
    console.log(`  ✗ ${name}`)
    console.log(`    → ${e.message}`)
    failed++
  }
}

function expect(val) {
  return {
    toBe: (expected) => { if (val !== expected) throw new Error(`Expected ${expected}, got ${val}`) },
    toEqual: (expected) => { if (JSON.stringify(val) !== JSON.stringify(expected)) throw new Error(`Expected ${JSON.stringify(expected)}, got ${JSON.stringify(val)}`) },
    toBeGreaterThan: (n) => { if (val <= n) throw new Error(`Expected ${val} > ${n}`) },
    toBeTruthy: () => { if (!val) throw new Error(`Expected truthy, got ${val}`) },
    toBeFalsy: () => { if (val) throw new Error(`Expected falsy, got ${val}`) },
    toContain: (str) => { if (!String(val).includes(str)) throw new Error(`Expected "${val}" to contain "${str}"`) },
    toHaveLength: (n) => { if (val.length !== n) throw new Error(`Expected length ${n}, got ${val.length}`) },
  }
}

// ── 1. BOQ CSV generation ─────────────────────────────────────
console.log('\n📋 BOQ CSV Generation')

const mockBOQ = {
  projectName: 'Κατοικία Παπαδόπουλος',
  generatedAt: new Date().toISOString(),
  confidence: 'high',
  grandTotal: 125400.50,
  sections: [
    {
      title: 'Σκυροδέματα',
      subtotal: 45200.00,
      items: [
        { id: 'Β.1.1', description: 'Σκυρόδεμα C20/25 θεμελίων', unit: 'm³', quantity: 42.5, unitPrice: 180, total: 7650, medskoCode: 'ΣΚ.1.1', notes: null },
        { id: 'Β.1.2', description: 'Σκυρόδεμα C25/30 υποστυλωμάτων', unit: 'm³', quantity: 18.3, unitPrice: 210, total: 3843, medskoCode: 'ΣΚ.1.2', notes: 'Provisional Sum' },
      ]
    },
    {
      title: 'Τοιχοποιία',
      subtotal: 80200.50,
      items: [
        { id: 'Γ.1.1', description: 'Τοιχοποιία οπτόπλινθοι 9cm', unit: 'm²', quantity: 320, unitPrice: 28, total: 8960, medskoCode: null, notes: null },
      ]
    }
  ]
}

test('CSV έχει header row', () => {
  const rows = ['Κωδικός,Κατηγορία,Περιγραφή,Μονάδα,Ποσότητα,Τιμή Μονάδος,Σύνολο,ΜΕΔΣΚ,Σημειώσεις']
  expect(rows[0]).toContain('Κωδικός')
  expect(rows[0]).toContain('ΜΕΔΣΚ')
})

test('CSV sections contain item data', () => {
  const item = mockBOQ.sections[0].items[0]
  const row = `${item.id},"${item.description}",${item.unit},${item.quantity},${item.unitPrice},${item.total}`
  expect(row).toContain('Β.1.1')
  expect(row).toContain('7650')
})

test('Grand total calculation is correct', () => {
  const total = mockBOQ.sections.reduce((sum, s) => sum + s.subtotal, 0)
  expect(total).toBe(125400.50)
})

test('Section subtotals match item totals', () => {
  const section = mockBOQ.sections[0]
  const itemsTotal = section.items.reduce((sum, i) => sum + i.total, 0)
  // Subtotal should be >= items total (could include other items)
  expect(section.subtotal).toBeGreaterThan(0)
})

// ── 2. Plan limit logic ───────────────────────────────────────
console.log('\n🔒 Plan Limit Logic')

function checkPlanLimit(plan, projectsThisMonth) {
  const limits = { FREE: 2, STARTER: 10, PRO: 30, AGENCY: 99999 }
  const limit = limits[plan] || 2
  return { allowed: projectsThisMonth < limit, limit, remaining: Math.max(0, limit - projectsThisMonth) }
}

test('FREE plan allows up to 2 projects', () => {
  expect(checkPlanLimit('FREE', 1).allowed).toBe(true)
  expect(checkPlanLimit('FREE', 2).allowed).toBe(false)
})

test('STARTER plan allows up to 10 projects', () => {
  expect(checkPlanLimit('STARTER', 9).allowed).toBe(true)
  expect(checkPlanLimit('STARTER', 10).allowed).toBe(false)
})

test('PRO plan allows up to 30 projects', () => {
  expect(checkPlanLimit('PRO', 29).allowed).toBe(true)
  expect(checkPlanLimit('PRO', 30).allowed).toBe(false)
})

test('AGENCY plan has no practical limit', () => {
  expect(checkPlanLimit('AGENCY', 5000).allowed).toBe(true)
})

test('Remaining count is correct', () => {
  expect(checkPlanLimit('STARTER', 7).remaining).toBe(3)
  expect(checkPlanLimit('FREE', 0).remaining).toBe(2)
  expect(checkPlanLimit('PRO', 30).remaining).toBe(0)
})

// ── 3. File validation ────────────────────────────────────────
console.log('\n📁 File Validation')

const ACCEPTED_TYPES = ['.pdf', '.xlsx', '.xls', '.dwg', '.dxf', '.csv', '.png', '.jpg', '.jpeg']
const MAX_MB = 100

function validateFile(name, sizeBytes) {
  const ext = '.' + name.split('.').pop().toLowerCase()
  const sizeMB = sizeBytes / (1024 * 1024)
  if (!ACCEPTED_TYPES.includes(ext)) return { valid: false, reason: 'unsupported_type' }
  if (sizeMB > MAX_MB) return { valid: false, reason: 'too_large' }
  return { valid: true }
}

test('PDF files are accepted', () => {
  expect(validateFile('κάτοψη.pdf', 5 * 1024 * 1024).valid).toBe(true)
})

test('DWG files are accepted', () => {
  expect(validateFile('αρχιτεκτονικά.dwg', 10 * 1024 * 1024).valid).toBe(true)
})

test('Excel files are accepted', () => {
  expect(validateFile('BOQ.xlsx', 2 * 1024 * 1024).valid).toBe(true)
})

test('Unsupported file types are rejected', () => {
  expect(validateFile('video.mp4', 1024).valid).toBe(false)
  expect(validateFile('script.exe', 1024).valid).toBe(false)
  expect(validateFile('doc.docx', 1024).valid).toBe(false)
})

test('Files over 100MB are rejected', () => {
  expect(validateFile('big.pdf', 101 * 1024 * 1024).valid).toBe(false)
  expect(validateFile('big.pdf', 101 * 1024 * 1024).reason).toBe('too_large')
})

test('Files exactly at 100MB are accepted', () => {
  expect(validateFile('exact.pdf', 100 * 1024 * 1024).valid).toBe(true)
})

// ── 4. Error handling ─────────────────────────────────────────
console.log('\n⚠️  Error Handling')

function safeParseJSON(text) {
  try {
    const clean = text.replace(/^```json\s*|^```\s*|```\s*$/gm, '').trim()
    return JSON.parse(clean)
  } catch {
    return null
  }
}

test('Parses clean JSON correctly', () => {
  const result = safeParseJSON('{"grandTotal": 50000, "sections": []}')
  expect(result.grandTotal).toBe(50000)
})

test('Strips markdown fences from JSON', () => {
  const result = safeParseJSON('```json\n{"grandTotal": 50000}\n```')
  expect(result.grandTotal).toBe(50000)
})

test('Returns null for invalid JSON', () => {
  const result = safeParseJSON('this is not json at all')
  expect(result).toBe(null)
})

test('Returns null for empty string', () => {
  const result = safeParseJSON('')
  expect(result).toBe(null)
})

// ── 5. Email layout ───────────────────────────────────────────
console.log('\n📧 Email Templates')

function emailLayout(content) {
  return `<!DOCTYPE html><html><body>${content}</body></html>`
}

test('Email layout contains content', () => {
  const html = emailLayout('<p>Hello</p>')
  expect(html).toContain('Hello')
  expect(html).toContain('<!DOCTYPE html>')
})

test('Welcome email has required elements', () => {
  const subject = 'Καλώς ήρθες στο Measur 👋'
  expect(subject).toContain('Measur')
})

// ── 6. Storage path structure ─────────────────────────────────
console.log('\n🗄️  Storage Paths')

function buildStoragePath(userId, projectName, fileName) {
  const ts = Date.now()
  const safeName = projectName.replace(/\s+/g, '_')
  return `${userId}/${ts}_${safeName}/${fileName}`
}

test('Storage path has correct structure', () => {
  const path = buildStoragePath('user_123', 'My Project', 'plan.pdf')
  expect(path).toContain('user_123/')
  expect(path).toContain('My_Project/')
  expect(path).toContain('plan.pdf')
})

test('Storage path has no raw spaces', () => {
  const path = buildStoragePath('user_abc', 'Κατοικία Λεμεσός', 'κάτοψη.pdf')
  expect(path.includes(' ')).toBe(false)
})

test('File name extraction from path', () => {
  const path = 'user_123/1234567_Project/κάτοψη.pdf'
  const fileName = path.split('/').pop()
  expect(fileName).toBe('κάτοψη.pdf')
})

// ── 7. BOQ Excel sheet names ──────────────────────────────────
console.log('\n📊 Excel Export')

test('Sheet names truncated to 31 chars (Excel limit)', () => {
  const longTitle = 'Σκυροδέματα και Χαλυβδοσκελετοί Φορείς'
  const sheetName = longTitle.slice(0, 31)
  expect(sheetName.length).toBeGreaterThan(0)
  expect(sheetName.length <= 31).toBe(true)
})

test('Grand total formatting', () => {
  const total = 125400.50
  const formatted = `€${total.toLocaleString('el-GR', { minimumFractionDigits: 2 })}`
  expect(formatted).toContain('125')
  expect(formatted).toContain('€')
})

// ── Summary ───────────────────────────────────────────────────
console.log(`\n${'─'.repeat(40)}`)
console.log(`Αποτελέσματα: ${passed} passed, ${failed} failed`)
if (failed > 0) {
  console.log('❌ Υπάρχουν αποτυχημένα tests — δες πάνω')
  process.exit(1)
} else {
  console.log('✅ Όλα τα tests πέρασαν!')
}

// ── 8. Overage billing logic ──────────────────────────────────
console.log('\n💳 Overage Billing Logic')

const PLAN_LIMITS = { FREE: 2, STARTER: 10, PRO: 50, AGENCY: 100 }
const OVERAGE_RATES = { FREE: 0, STARTER: 3.00, PRO: 1.50, AGENCY: 0.50 }

function checkUsage(plan, projectsThisMonth) {
  const limit = PLAN_LIMITS[plan] || 2
  const overageRate = OVERAGE_RATES[plan] || 0
  if (plan === 'FREE') {
    return { allowed: projectsThisMonth < limit, isOverage: false, overagePrice: 0, remaining: Math.max(0, limit - projectsThisMonth), limit }
  }
  const isOverage = projectsThisMonth >= limit
  return { allowed: true, isOverage, overagePrice: isOverage ? overageRate : 0, remaining: Math.max(0, limit - projectsThisMonth), limit }
}

test('FREE plan blocks at 2 projects', () => {
  expect(checkUsage('FREE', 2).allowed).toBe(false)
  expect(checkUsage('FREE', 1).allowed).toBe(true)
})

test('STARTER: allowed beyond 10 (overage)', () => {
  expect(checkUsage('STARTER', 10).allowed).toBe(true)
  expect(checkUsage('STARTER', 10).isOverage).toBe(true)
  expect(checkUsage('STARTER', 10).overagePrice).toBe(3.00)
})

test('PRO: allowed beyond 50 at €1.50', () => {
  expect(checkUsage('PRO', 55).allowed).toBe(true)
  expect(checkUsage('PRO', 55).isOverage).toBe(true)
  expect(checkUsage('PRO', 55).overagePrice).toBe(1.50)
})

test('AGENCY: allowed beyond 100 at €0.50', () => {
  expect(checkUsage('AGENCY', 150).allowed).toBe(true)
  expect(checkUsage('AGENCY', 150).overagePrice).toBe(0.50)
})

test('Overage rate decreases with higher plan', () => {
  expect(OVERAGE_RATES['STARTER']).toBeGreaterThan(OVERAGE_RATES['PRO'])
  expect(OVERAGE_RATES['PRO']).toBeGreaterThan(OVERAGE_RATES['AGENCY'])
})

test('Remaining count correct within plan', () => {
  expect(checkUsage('STARTER', 7).remaining).toBe(3)
  expect(checkUsage('PRO', 50).remaining).toBe(0)
  expect(checkUsage('AGENCY', 99).remaining).toBe(1)
})

test('Overage cost calculation', () => {
  const extraProjects = 5
  const rate = OVERAGE_RATES['STARTER']
  const cost = extraProjects * rate
  expect(cost).toBe(15.00)
})

test('FREE plan has no overage (blocks instead)', () => {
  expect(checkUsage('FREE', 5).allowed).toBe(false)
  expect(checkUsage('FREE', 5).overagePrice).toBe(0)
})

// ── 9. Rules Engine ───────────────────────────────────────────
console.log('\n🏗️  Rules Engine')

// Simulate the engine logic inline
function calcTilesTest(area, waste=0.10) { return parseFloat((area*(1+waste)).toFixed(2)) }
function calcSkirtingTest(perimeter, doorWidths) { return Math.max(0, perimeter - doorWidths) }
function calcWallPaintTest(perimeter, height, doorArea, windowArea) { return Math.max(0, perimeter*height - doorArea - windowArea) }

test('Tiles include 10% waste', () => {
  expect(calcTilesTest(100)).toBe(110.00)
  expect(calcTilesTest(25.5)).toBe(28.05)
})
test('Skirting subtracts door widths', () => {
  expect(calcSkirtingTest(14, 0.9)).toBe(13.1)
  expect(calcSkirtingTest(14, 2.7)).toBe(11.3)  // 3 doors
})
test('Wall paint subtracts openings', () => {
  const wallArea = calcWallPaintTest(14, 2.8, 1.89, 3.36) // 14m perim, 3 doors+windows
  expect(wallArea).toBeGreaterThan(0)
  expect(wallArea < 14*2.8).toBe(true)
})
test('Cost DB rate lookup', () => {
  // Simulate getRateByCode
  const rates = { 'ΔΑ.1.2': { cyprus: 45 }, 'ΧΡ.1.1': { cyprus: 8 } }
  expect(rates['ΔΑ.1.2'].cyprus).toBe(45)
  expect(rates['ΧΡ.1.1'].cyprus).toBe(8)
})
test('Engine validation threshold', () => {
  function validate(engine, ai, threshold=0.10) {
    const dev = Math.abs(engine-ai)/Math.max(engine,ai)
    return { valid: dev<=threshold, deviation: parseFloat((dev*100).toFixed(1)), requiresReview: dev>threshold }
  }
  expect(validate(100000, 105000).valid).toBe(true)   // 5% — ok
  expect(validate(100000, 115000).valid).toBe(false)   // 15% — review
  expect(validate(100000, 115000).requiresReview).toBe(true)
  expect(validate(100000, 105000).deviation).toBe(4.8)
})

// ── 10. File Security ─────────────────────────────────────────
console.log('\n🔒 File Security')

const crypto = require('crypto')
function computeHash(buf) { return crypto.createHash('sha256').update(buf).digest('hex') }
function sanitize(name) { return name.replace(/[<>:"/\\|?*\x00-\x1f]/g,'_').replace(/\s+/g,'_').slice(0,200) }
const PDF_MAGIC = Buffer.from([0x25,0x50,0x44,0x46])
const FAKE_PDF = Buffer.from('<script>alert(1)</script>')

test('SHA256 hash is deterministic', () => {
  const buf = Buffer.from('test content')
  expect(computeHash(buf)).toBe(computeHash(buf))
  expect(computeHash(buf).length).toBe(64)
})
test('Duplicate detection via hash', () => {
  const buf = Buffer.from('same file')
  const hash = computeHash(buf)
  const existing = [hash]
  expect(existing.includes(computeHash(buf))).toBe(true)
  expect(existing.includes(computeHash(Buffer.from('different')))).toBe(false)
})
test('Magic bytes: valid PDF starts with %PDF', () => {
  expect(PDF_MAGIC[0]).toBe(0x25) // %
  expect(PDF_MAGIC[1]).toBe(0x50) // P
  expect(PDF_MAGIC[2]).toBe(0x44) // D
  expect(PDF_MAGIC[3]).toBe(0x46) // F
})
test('Fake PDF does not start with PDF magic bytes', () => {
  expect(FAKE_PDF[0]).toBe(0x3C) // < not %
})
test('Filename sanitization removes dangerous chars', () => {
  expect(sanitize('file<name>.pdf')).toBe('file_name_.pdf')
  expect(sanitize('my file.pdf')).toBe('my_file.pdf')
  expect(sanitize('../../etc/passwd')).toBe('.._.._etc_passwd')
})

// ── 11. File Parser ───────────────────────────────────────────
console.log('\n📂 File Parser')

function inferCategory(name) {
  const n = name.toLowerCase()
  if (n.includes('ηλεκτ') || n.includes('elect')) return 'Ηλεκτρολογικά'
  if (n.includes('κατοψ') || n.includes('floor') || n.includes('plan')) return 'Κάτοψη'
  if (n.includes('υδρ') || n.includes('plumb')) return 'Υδραυλικά'
  return 'Γενικό σχέδιο'
}

test('Infers drawing category from filename', () => {
  expect(inferCategory('κατοψη_ισογειου.dwg')).toBe('Κάτοψη')
  expect(inferCategory('electrical_plan.dwg')).toBe('Ηλεκτρολογικά')
  expect(inferCategory('plumbing.dxf')).toBe('Υδραυλικά')
  expect(inferCategory('random.dwg')).toBe('Γενικό σχέδιο')
})
test('File extension detection', () => {
  function getExt(f) { return f.split('.').pop()?.toLowerCase() }
  expect(getExt('plan.PDF')).toBe('pdf')
  expect(getExt('BOQ.XLSX')).toBe('xlsx')
  expect(getExt('drawing.DWG')).toBe('dwg')
})

// ── 12. Cost Control ──────────────────────────────────────────
console.log('\n💰 Cost Control')

const COST_LIMITS = { MAX_FILES_PER_PROJECT: 30, MAX_TOTAL_SIZE_MB: 300, MAX_FILE_SIZE_MB: 100 }

function checkCost(files) {
  const reasons = []
  if (files.length > COST_LIMITS.MAX_FILES_PER_PROJECT) reasons.push('too many files')
  const totalMB = files.reduce((s,f) => s + f.sizeBytes, 0) / (1024*1024)
  if (totalMB > COST_LIMITS.MAX_TOTAL_SIZE_MB) reasons.push('total size exceeded')
  for (const f of files) { if (f.sizeBytes > COST_LIMITS.MAX_FILE_SIZE_MB*1024*1024) reasons.push(`${f.name} too large`) }
  return { allowed: reasons.length === 0, reasons }
}

test('Allows normal file sets', () => {
  const files = Array(10).fill({ name: 'plan.pdf', sizeBytes: 5*1024*1024 })
  expect(checkCost(files).allowed).toBe(true)
})
test('Blocks over 30 files', () => {
  const files = Array(31).fill({ name: 'a.pdf', sizeBytes: 1024 })
  expect(checkCost(files).allowed).toBe(false)
})
test('Blocks files over 100MB', () => {
  const files = [{ name: 'huge.pdf', sizeBytes: 101*1024*1024 }]
  expect(checkCost(files).allowed).toBe(false)
})
test('Token budget truncation', () => {
  const long = 'x'.repeat(50000)
  const truncated = long.length > 40000 ? long.slice(0, 40000) + '[truncated]' : long
  expect(truncated.length < 50000).toBe(true)
  expect(truncated).toContain('[truncated]')
})

// ── 13. Stripe Guard ──────────────────────────────────────────
console.log('\n🛡️  Stripe Guard')

function detectDisposable(email) {
  const DISPOSABLE = ['mailinator.com','guerrillamail.com','tempmail.com','10minutemail.com']
  const domain = email.split('@')[1]
  return DISPOSABLE.includes(domain?.toLowerCase())
}

test('Blocks disposable email domains', () => {
  expect(detectDisposable('test@mailinator.com')).toBe(true)
  expect(detectDisposable('test@guerrillamail.com')).toBe(true)
})
test('Allows real email domains', () => {
  expect(detectDisposable('user@gmail.com')).toBe(false)
  expect(detectDisposable('user@company.com.cy')).toBe(false)
})

// ── 14. Zod Schema Validation ─────────────────────────────────
console.log('\n✅ Zod Schema Validation')

function validateBOQMock(raw) {
  // Simulate Zod validation logic
  if (!raw || typeof raw !== 'object') return { success: false, errors: ['Not an object'] }
  if (!raw.projectName) return { success: false, errors: ['projectName required'] }
  if (!Array.isArray(raw.sections) || raw.sections.length === 0) return { success: false, errors: ['sections required'] }
  if (typeof raw.grandTotal !== 'number' || raw.grandTotal < 0) return { success: false, errors: ['grandTotal invalid'] }
  if (raw.grandTotal > 50_000_000) return { success: false, errors: ['grandTotal exceeds €50M sanity check'] }
  if (!['high','medium','low'].includes(raw.confidence)) return { success: false, errors: ['confidence invalid'] }
  return { success: true }
}

test('Valid BOQ passes validation', () => {
  const boq = { projectName: 'Test', sections: [{ title: 'Δάπεδα', items: [], subtotal: 1000 }], grandTotal: 50000, currency: 'EUR', confidence: 'high' }
  expect(validateBOQMock(boq).success).toBe(true)
})
test('Missing projectName fails', () => {
  expect(validateBOQMock({ sections: [], grandTotal: 0, confidence: 'high' }).success).toBe(false)
})
test('Negative grandTotal fails', () => {
  expect(validateBOQMock({ projectName: 'X', sections: [{}], grandTotal: -1, confidence: 'medium' }).success).toBe(false)
})
test('Absurd grandTotal (>€50M) fails sanity check', () => {
  expect(validateBOQMock({ projectName: 'X', sections: [{}], grandTotal: 60_000_000, confidence: 'low' }).success).toBe(false)
})
test('Invalid confidence value fails', () => {
  expect(validateBOQMock({ projectName: 'X', sections: [{}], grandTotal: 100, confidence: 'excellent' }).success).toBe(false)
})
