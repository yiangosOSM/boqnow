// src/lib/engine/quantity-rules.ts
// Deterministic QS calculation rules — no AI involved
// AI provides geometry, this engine calculates quantities

import { getRateByCode, Region, CostRate, ASSEMBLY_RATES } from './cost-database'

export interface RoomGeometry {
  name: string
  area: number          // m²
  perimeter: number     // m
  height: number        // m (default 2.80)
  doors: DoorSpec[]
  windows: WindowSpec[]
  wetRoom?: boolean     // bathroom/kitchen
}

export interface DoorSpec {
  width: number         // m
  height: number        // m
  type: 'internal' | 'entrance' | 'wc'
  count: number
}

export interface WindowSpec {
  width: number         // m
  height: number        // m
  type: 'openable' | 'sliding' | 'fixed'
  count: number
}

export interface BuildingGeometry {
  rooms: RoomGeometry[]
  totalFloorArea: number    // m²
  totalWallArea?: number    // m² (exterior)
  totalPerimeter?: number   // m (building footprint)
  floors: number
  hasPatio?: boolean
  patioArea?: number
  hasPool?: boolean
  poolArea?: number
}

export interface QuantityLineItem {
  code: string
  description: string
  unit: string
  quantity: number
  unitPrice: number
  total: number
  medskoCode: string
  calculationNote: string   // shows the formula used
  confidence: 'calculated' | 'estimated'
}

export interface EngineResult {
  sections: {
    title: string
    items: QuantityLineItem[]
    subtotal: number
  }[]
  grandTotal: number
  totalArea: number
  calculationMethod: 'rules_engine'
  warnings: string[]
}

type RateLookup = (code: string, fallback: number) => number

function makeRateLookup(region: Region, overrides?: Record<string, number>): RateLookup {
  return (code, fallback) => overrides?.[code] ?? getRateByCode(code, region) ?? fallback
}

// ── Core calculation rules ────────────────────────────────────

function calcTiles(room: RoomGeometry, rate: RateLookup, waste = 0.10): QuantityLineItem {
  const qty = room.area * (1 + waste)
  const unitPrice = rate('ΔΑ.1.2', 45)
  return {
    code: 'ΔΑ.1.2',
    description: `Πλακάκι δαπέδου — ${room.name}`,
    unit: 'm²',
    quantity: parseFloat(qty.toFixed(2)),
    unitPrice,
    total: parseFloat((qty * unitPrice).toFixed(2)),
    medskoCode: 'ΔΑ.1.2',
    calculationNote: `${room.area}m² × 1.10 (waste 10%)`,
    confidence: 'calculated',
  }
}

function calcSkirting(room: RoomGeometry, region: Region): QuantityLineItem {
  const doorWidths = room.doors.reduce((s, d) => s + d.width * d.count, 0)
  const qty = Math.max(0, room.perimeter - doorWidths)
  const rate = 12 // skirting per m
  return {
    code: 'ΣΚ.SK',
    description: `Σοβατεπί — ${room.name}`,
    unit: 'm',
    quantity: parseFloat(qty.toFixed(2)),
    unitPrice: rate,
    total: parseFloat((qty * rate).toFixed(2)),
    medskoCode: 'ΔΑ.1.X',
    calculationNote: `${room.perimeter}m περίμετρος − ${doorWidths.toFixed(2)}m πόρτες`,
    confidence: 'calculated',
  }
}

function calcWallPaint(room: RoomGeometry, rate: RateLookup): QuantityLineItem {
  const grossWallArea = room.perimeter * room.height
  const doorArea = room.doors.reduce((s, d) => s + d.width * d.height * d.count, 0)
  const windowArea = room.windows.reduce((s, w) => s + w.width * w.height * w.count, 0)
  const netArea = Math.max(0, grossWallArea - doorArea - windowArea)
  const unitPrice = rate('ΧΡ.1.1', 8)
  return {
    code: 'ΧΡ.1.1',
    description: `Χρωματισμός τοίχων — ${room.name}`,
    unit: 'm²',
    quantity: parseFloat(netArea.toFixed(2)),
    unitPrice,
    total: parseFloat((netArea * unitPrice).toFixed(2)),
    medskoCode: 'ΧΡ.1.1',
    calculationNote: `(${room.perimeter}×${room.height}) − πόρτες ${doorArea.toFixed(1)}m² − παράθυρα ${windowArea.toFixed(1)}m²`,
    confidence: 'calculated',
  }
}

function calcCeilingPaint(room: RoomGeometry, rate: RateLookup): QuantityLineItem {
  const unitPrice = rate('ΧΡ.1.1', 8)
  return {
    code: 'ΧΡ.1.1',
    description: `Χρωματισμός οροφής — ${room.name}`,
    unit: 'm²',
    quantity: parseFloat(room.area.toFixed(2)),
    unitPrice,
    total: parseFloat((room.area * unitPrice).toFixed(2)),
    medskoCode: 'ΧΡ.1.1',
    calculationNote: `Εμβαδόν δωματίου = ${room.area}m²`,
    confidence: 'calculated',
  }
}

function calcPlaster(room: RoomGeometry, rate: RateLookup): QuantityLineItem {
  const grossWallArea = room.perimeter * room.height
  const openings = room.doors.reduce((s, d) => s + d.width * d.height * d.count, 0)
    + room.windows.reduce((s, w) => s + w.width * w.height * w.count, 0)
  const netArea = Math.max(0, grossWallArea - openings) + room.area // walls + ceiling
  const unitPrice = rate('ΕΠ.1.2', 18)
  return {
    code: 'ΕΠ.1.2',
    description: `Επίχρισμα εσωτερικό — ${room.name}`,
    unit: 'm²',
    quantity: parseFloat(netArea.toFixed(2)),
    unitPrice,
    total: parseFloat((netArea * unitPrice).toFixed(2)),
    medskoCode: 'ΕΠ.1.2',
    calculationNote: `τοίχοι ${(grossWallArea - openings).toFixed(1)}m² + οροφή ${room.area}m²`,
    confidence: 'calculated',
  }
}

function calcDoors(room: RoomGeometry, rate: RateLookup): QuantityLineItem[] {
  return room.doors.map(door => {
    const codeMap = { internal: 'ΚΟ.2.1', entrance: 'ΚΟ.2.2', wc: 'ΚΟ.2.3' }
    const code = codeMap[door.type]
    const unitPrice = rate(code, 280)
    return {
      code,
      description: `Πόρτα ${door.type === 'entrance' ? 'εισόδου' : door.type === 'wc' ? 'WC' : 'εσωτερική'} — ${room.name}`,
      unit: 'τεμ',
      quantity: door.count,
      unitPrice,
      total: parseFloat((door.count * unitPrice).toFixed(2)),
      medskoCode: code,
      calculationNote: `${door.count} τεμ × ${door.width}×${door.height}m`,
      confidence: 'calculated' as const,
    }
  })
}

function calcWindows(room: RoomGeometry, rate: RateLookup): QuantityLineItem[] {
  return room.windows.map(win => {
    const area = win.width * win.height * win.count
    const unitPrice = rate('ΚΟ.1.4', 320)
    const type = win.type === 'sliding' ? 'συρόμενο' : 'ανοιγόμενο'
    return {
      code: 'ΚΟ.1.4',
      description: `Κούφωμα αλουμινίου ${type} — ${room.name}`,
      unit: 'm²',
      quantity: parseFloat(area.toFixed(2)),
      unitPrice,
      total: parseFloat((area * unitPrice).toFixed(2)),
      medskoCode: 'ΚΟ.1.4',
      calculationNote: `${win.count} τεμ × ${win.width}×${win.height}m = ${area.toFixed(2)}m²`,
      confidence: 'calculated' as const,
    }
  })
}

// ── Main engine entry point ───────────────────────────────────
export function runQuantityEngine(
  geometry: BuildingGeometry,
  region: Region = 'cyprus',
  priceOverrides?: Record<string, number>
): EngineResult {
  const warnings: string[] = []
  const sections: EngineResult['sections'] = []
  const rate = makeRateLookup(region, priceOverrides)

  // ── Δάπεδα ───────────────────────────────────────────────
  const floorItems: QuantityLineItem[] = []
  for (const room of geometry.rooms) {
    floorItems.push(calcTiles(room, rate))
    floorItems.push(calcSkirting(room, region))
    const screedRate = rate('ΔΑ.2.1', 18)
    floorItems.push({
      code: 'ΔΑ.2.1',
      description: `Τσιμεντοκονία ισοπέδωσης — ${room.name}`,
      unit: 'm²',
      quantity: parseFloat(room.area.toFixed(2)),
      unitPrice: screedRate,
      total: parseFloat((room.area * screedRate).toFixed(2)),
      medskoCode: 'ΔΑ.2.1',
      calculationNote: `Εμβαδόν δωματίου = ${room.area}m²`,
      confidence: 'calculated',
    })
  }
  const floorSubtotal = floorItems.reduce((s, i) => s + i.total, 0)
  sections.push({ title: 'Δάπεδα', items: floorItems, subtotal: parseFloat(floorSubtotal.toFixed(2)) })

  // ── Κουφώματα ─────────────────────────────────────────────
  const joistItems: QuantityLineItem[] = []
  for (const room of geometry.rooms) {
    joistItems.push(...calcDoors(room, rate))
    joistItems.push(...calcWindows(room, rate))
  }
  if (joistItems.length > 0) {
    const sub = joistItems.reduce((s, i) => s + i.total, 0)
    sections.push({ title: 'Κουφώματα — Αλουμίνια', items: joistItems, subtotal: parseFloat(sub.toFixed(2)) })
  }

  // ── Επιχρίσματα ───────────────────────────────────────────
  const plasterItems: QuantityLineItem[] = geometry.rooms.map(r => calcPlaster(r, rate))
  const plasterSub = plasterItems.reduce((s, i) => s + i.total, 0)
  sections.push({ title: 'Επιχρίσματα', items: plasterItems, subtotal: parseFloat(plasterSub.toFixed(2)) })

  // ── Χρωματισμοί ───────────────────────────────────────────
  const paintItems: QuantityLineItem[] = []
  for (const room of geometry.rooms) {
    paintItems.push(calcWallPaint(room, rate))
    paintItems.push(calcCeilingPaint(room, rate))
  }
  const paintSub = paintItems.reduce((s, i) => s + i.total, 0)
  sections.push({ title: 'Χρωματισμοί', items: paintItems, subtotal: parseFloat(paintSub.toFixed(2)) })

  // ── Εξωτερικές εργασίες ───────────────────────────────────
  if (geometry.hasPatio && geometry.patioArea) {
    const unitPrice = rate('ΕΞ.1.1', 42)
    const patioItem: QuantityLineItem = {
      code: 'ΕΞ.1.1', description: 'Πλακόστρωση αυλής/βεράντας', unit: 'm²',
      quantity: geometry.patioArea, unitPrice,
      total: parseFloat((geometry.patioArea * unitPrice).toFixed(2)),
      medskoCode: 'ΕΞ.1.1',
      calculationNote: `Εμβαδόν αυλής = ${geometry.patioArea}m²`,
      confidence: 'calculated',
    }
    sections.push({ title: 'Εξωτερικές Εργασίες', items: [patioItem], subtotal: patioItem.total })
  }

  if (geometry.hasPool && geometry.poolArea) {
    const unitPrice = rate('ΕΞ.1.3', 1200)
    const poolItem: QuantityLineItem = {
      code: 'ΕΞ.1.3', description: 'Κατασκευή πισίνας', unit: 'm²',
      quantity: geometry.poolArea, unitPrice,
      total: parseFloat((geometry.poolArea * unitPrice).toFixed(2)),
      medskoCode: 'ΕΞ.1.3',
      calculationNote: `Εμβαδόν πισίνας = ${geometry.poolArea}m²`,
      confidence: 'calculated',
    }
    const existingExt = sections.find(s => s.title === 'Εξωτερικές Εργασίες')
    if (existingExt) {
      existingExt.items.push(poolItem)
      existingExt.subtotal = parseFloat((existingExt.subtotal + poolItem.total).toFixed(2))
    } else {
      sections.push({ title: 'Εξωτερικές Εργασίες', items: [poolItem], subtotal: poolItem.total })
    }
  }

  if (geometry.rooms.some(r => r.height > 3.5)) {
    warnings.push('Ύψος δωματίου >3.5m — ελέγξτε χειροκίνητα τις ποσότητες τοιχοποιίας')
  }
  if (geometry.totalFloorArea > 500) {
    warnings.push('Μεγάλο έργο (>500m²) — συνιστάται πλήρης QS validation')
  }

  const grandTotal = sections.reduce((s, sec) => s + sec.subtotal, 0)

  return {
    sections,
    grandTotal: parseFloat(grandTotal.toFixed(2)),
    totalArea: geometry.totalFloorArea,
    calculationMethod: 'rules_engine',
    warnings,
  }
}

// ── Validate engine vs AI output ─────────────────────────────
export function validateEngineVsAI(
  engineTotal: number,
  aiTotal: number,
  threshold = 0.10
): { valid: boolean; deviation: number; requiresReview: boolean } {
  const deviation = Math.abs(engineTotal - aiTotal) / Math.max(engineTotal, aiTotal)
  return {
    valid: deviation <= threshold,
    deviation: parseFloat((deviation * 100).toFixed(1)),
    requiresReview: deviation > threshold,
  }
}
