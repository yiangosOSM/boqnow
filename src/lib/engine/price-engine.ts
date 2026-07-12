// src/lib/engine/price-engine.ts
// BOQNOW Price Intelligence Engine
// ─────────────────────────────────────────────────────────────
// Πώς δουλεύει:
//   1. Admin ανεβάζει παλιές προσφορές → AI εξάγει line items
//   2. Κάθε line item αποθηκεύεται στο PriceLineItem
//   3. Ο price engine υπολογίζει weighted average (νεότερες = μεγαλύτερο βάρος)
//   4. Αποθηκεύεται στο PriceReference
//   5. Το Step 5 prompt χρησιμοποιεί αυτές τις τιμές αντί των static defaults
//
// Time decay: quotes > 2 χρόνια παίρνουν weight 0.3, < 6 μήνες παίρνουν 1.0

import { prisma } from '@/lib/prisma'

export interface PricePoint {
  materialGroup: string
  medskoCode?: string
  unit: string
  avgPrice: number
  weightedAvg: number
  medianPrice: number
  minPrice: number
  maxPrice: number
  sampleCount: number
  confidence: 'high' | 'medium' | 'low'
  lastQuoteDate: Date
  region: string
}

// ── Time decay weight ─────────────────────────────────────────
// Quotes get lower weight as they age
function timeWeight(quoteDate: Date): number {
  const ageMonths = (Date.now() - quoteDate.getTime()) / (1000 * 60 * 60 * 24 * 30)
  if (ageMonths <= 3)   return 1.00   // last 3 months: full weight
  if (ageMonths <= 6)   return 0.90
  if (ageMonths <= 12)  return 0.75
  if (ageMonths <= 18)  return 0.55
  if (ageMonths <= 24)  return 0.35
  return 0.20                          // > 2 years: 20% weight
}

// ── Recompute PriceReference for a materialGroup ──────────────
export async function recomputePriceReference(
  materialGroup: string,
  region: string = 'cyprus'
): Promise<PriceReference | null> {
  // Get all line items for this material group
  const items = await prisma.priceLineItem.findMany({
    where: {
      materialGroup,
      isOutlier: false,
      quote: {
        status: 'COMPLETE',
        region,
        // Include both SHARED quotes and personal quotes of this user
        scope: 'SHARED',
      }
    },
    include: { quote: { select: { projectDate: true } } },
    orderBy: { quote: { projectDate: 'desc' } }
  })

  if (items.length === 0) return null

  const prices = items.map(i => i.unitPrice)
  const weights = items.map(i => timeWeight(i.quote.projectDate))

  // Weighted average
  const totalWeight = weights.reduce((a, b) => a + b, 0)
  const weightedAvg = items.reduce((sum, item, i) =>
    sum + item.unitPrice * weights[i], 0) / totalWeight

  // Simple stats
  const sorted = [...prices].sort((a, b) => a - b)
  const median = sorted[Math.floor(sorted.length / 2)]
  const avg = prices.reduce((a, b) => a + b, 0) / prices.length

  // Outlier detection (IQR method)
  const q1 = sorted[Math.floor(sorted.length * 0.25)]
  const q3 = sorted[Math.floor(sorted.length * 0.75)]
  const iqr = q3 - q1
  const validPrices = prices.filter(p => p >= q1 - 1.5 * iqr && p <= q3 + 1.5 * iqr)

  const confidence = items.length >= 10 ? 'high' : items.length >= 3 ? 'medium' : 'low'

  const firstItem = items[0]
  const unit = firstItem.unit
  const medskoCode = firstItem.medskoCode ?? undefined

  // Upsert into PriceReference
  return prisma.priceReference.upsert({
    where: { materialGroup_region: { materialGroup, region } },
    create: {
      materialGroup, region, unit,
      medskoCode,
      avgPrice: avg,
      minPrice: Math.min(...validPrices),
      maxPrice: Math.max(...validPrices),
      medianPrice: median,
      weightedAvg: Math.round(weightedAvg * 100) / 100,
      sampleCount: items.length,
      lastQuoteDate: items[0].quote.projectDate,
      confidence,
    },
    update: {
      unit, medskoCode,
      avgPrice: avg,
      minPrice: Math.min(...validPrices),
      maxPrice: Math.max(...validPrices),
      medianPrice: median,
      weightedAvg: Math.round(weightedAvg * 100) / 100,
      sampleCount: items.length,
      lastQuoteDate: items[0].quote.projectDate,
      confidence,
    }
  })
}

// ── Get live prices for BOQ generation ───────────────────────
// Returns price map to inject into Step 5 prompt
export async function getLivePriceMap(
  region: string = 'cyprus',
  personalUserId?: string  // if set, merges personal quotes
): Promise<Record<string, PricePoint>> {
  const refs = await prisma.priceReference.findMany({
    where: { region }
  })

  const priceMap: Record<string, PricePoint> = {}

  for (const ref of refs) {
    priceMap[ref.materialGroup] = {
      materialGroup: ref.materialGroup,
      medskoCode: ref.medskoCode ?? undefined,
      unit: ref.unit,
      avgPrice: ref.avgPrice,
      weightedAvg: ref.weightedAvg,
      medianPrice: ref.medianPrice,
      minPrice: ref.minPrice,
      maxPrice: ref.maxPrice,
      sampleCount: ref.sampleCount,
      confidence: ref.confidence as 'high' | 'medium' | 'low',
      lastQuoteDate: ref.lastQuoteDate,
      region: ref.region,
    }
  }

  // Merge personal quotes if user has uploaded their own
  if (personalUserId) {
    const personalItems = await prisma.priceLineItem.findMany({
      where: {
        isOutlier: false,
        quote: {
          uploadedBy: personalUserId,
          scope: 'PERSONAL',
          status: 'COMPLETE',
        }
      },
      include: { quote: { select: { projectDate: true } } }
    })

    // Group by materialGroup
    const grouped: Record<string, typeof personalItems> = {}
    for (const item of personalItems) {
      const group = item.materialGroup ?? 'unknown'
      if (!grouped[group]) grouped[group] = []
      grouped[group].push(item)
    }

    // Override shared price with personal weighted avg (personal prices take priority)
    for (const [group, items] of Object.entries(grouped)) {
      if (items.length === 0) continue
      const weights = items.map(i => timeWeight(i.quote.projectDate))
      const totalWeight = weights.reduce((a, b) => a + b, 0)
      const personalWeightedAvg = items.reduce((sum, item, i) =>
        sum + item.unitPrice * weights[i], 0) / totalWeight

      if (priceMap[group]) {
        // Blend: 70% personal, 30% market (if user has enough data)
        const blend = items.length >= 5
          ? personalWeightedAvg * 0.70 + priceMap[group].weightedAvg * 0.30
          : personalWeightedAvg * 0.50 + priceMap[group].weightedAvg * 0.50

        priceMap[group] = {
          ...priceMap[group],
          weightedAvg: Math.round(blend * 100) / 100,
          sampleCount: priceMap[group].sampleCount + items.length,
        }
      } else {
        const prices = items.map(i => i.unitPrice)
        priceMap[group] = {
          materialGroup: group,
          unit: items[0].unit,
          avgPrice: personalWeightedAvg,
          weightedAvg: Math.round(personalWeightedAvg * 100) / 100,
          medianPrice: prices.sort((a,b) => a-b)[Math.floor(prices.length/2)],
          minPrice: Math.min(...prices),
          maxPrice: Math.max(...prices),
          sampleCount: items.length,
          confidence: items.length >= 3 ? 'medium' : 'low',
          lastQuoteDate: items[0].quote.projectDate,
          region,
        }
      }
    }
  }

  return priceMap
}

// Maps quote-extractor materialGroup slugs → ΜΕΔΣΚ codes used by the rules engine
export const MATERIAL_GROUP_TO_MEDSKO_CODE: Record<string, string> = {
  excavation: 'ΧΩ.1.1',
  concrete_c1620: 'ΣΚ.1.1',
  concrete_c2025: 'ΣΚ.1.2',
  concrete_c2530: 'ΣΚ.1.3',
  steel_s500: 'ΣΚ.2.1',
  masonry_9cm: 'ΤΟ.1.1',
  masonry_12cm: 'ΤΟ.1.2',
  masonry_25cm: 'ΤΟ.1.3',
  gypsum_board: 'ΤΟ.2.1',
  plaster_exterior: 'ΕΠ.1.1',
  plaster_interior: 'ΕΠ.1.2',
  waterproofing_roof: 'ΜΟ.1.3',
  xps_5cm: 'ΜΟ.1.1',
  xps_8cm: 'ΜΟ.1.2',
  screed_5cm: 'ΔΑ.2.1',
  tiles_30x30: 'ΔΑ.1.1',
  tiles_30x60: 'ΔΑ.1.2',
  tiles_60x60: 'ΔΑ.1.3',
  tiles_60x60plus: 'ΔΑ.1.3',
  marble: 'ΔΑ.1.4',
  aluminium_standard: 'ΚΟ.1.1',
  aluminium_premium: 'ΚΟ.1.3',
  door_interior: 'ΚΟ.2.1',
  door_entrance: 'ΚΟ.2.2',
  door_wc: 'ΚΟ.2.3',
  plumbing_ppr: 'ΥΔ.1.1',
  plumbing_pvc: 'ΥΔ.1.2',
  wc_suite: 'ΥΔ.2.1',
  washbasin: 'ΥΔ.2.2',
  shower: 'ΥΔ.2.3',
  bathtub: 'ΥΔ.2.4',
  water_heater: 'ΥΔ.3.1',
  electrical_circuit: 'ΗΛ.1.1',
  electrical_panel: 'ΗΛ.1.4',
  paint_interior: 'ΧΡ.1.1',
  paint_exterior: 'ΧΡ.1.2',
  scaffolding: 'ΠΡ.1.3',
  site_setup: 'ΠΡ.1.1',
}

// Build ΜΕΔΣΚ-code overrides for the deterministic rules engine
export function buildCodePriceOverrides(
  priceMap: Record<string, PricePoint>
): Record<string, number> {
  const overrides: Record<string, number> = {}

  for (const [group, point] of Object.entries(priceMap)) {
    const code = point.medskoCode ?? MATERIAL_GROUP_TO_MEDSKO_CODE[group]
    if (code) overrides[code] = point.weightedAvg
  }

  return overrides
}

// ── Format price map for injection into Step 5 prompt ─────────
export function formatPriceMapForPrompt(
  priceMap: Record<string, PricePoint>,
  fallbackPrices: Record<string, number>
): string {
  const hasLiveData = Object.keys(priceMap).length > 0

  if (!hasLiveData) {
    return `[Χρησιμοποιείς τις static τιμές αναφοράς Κύπρου 2025 που έχεις ήδη]`
  }

  let prompt = `\n═══════════════════════════════════════════════════════════
LIVE ΤΙΜΕΣ ΑΝΑΦΟΡΑΣ — από ${Object.values(priceMap).reduce((max, p) => p.sampleCount > max ? p.sampleCount : max, 0)} πραγματικές προσφορές Κύπρου
(Χρησιμοποίησε ΑΥΤΕΣ τις τιμές — έχουν προτεραιότητα έναντι των static defaults)
═══════════════════════════════════════════════════════════\n`

  const confidence_icons: Record<string, string> = { high: '✓✓', medium: '✓', low: '~' }

  for (const [group, point] of Object.entries(priceMap)) {
    const icon = confidence_icons[point.confidence]
    const age = Math.round((Date.now() - point.lastQuoteDate.getTime()) / (1000 * 60 * 60 * 24 * 30))
    prompt += `${icon} ${group}: €${point.weightedAvg}/${point.unit} `
    prompt += `(εύρος €${point.minPrice}–€${point.maxPrice}, n=${point.sampleCount}, ${age}μ ago)\n`
  }

  prompt += `\nΓια κατηγορίες που ΔΕΝ αναφέρονται παραπάνω → χρησιμοποίησε τις static τιμές.\n`

  return prompt
}

// ── Recompute ALL price references ────────────────────────────
// Called after each quote extraction completes
export async function recomputeAllPriceReferences(region: string = 'cyprus'): Promise<void> {
  const groups = await prisma.priceLineItem.groupBy({
    by: ['materialGroup'],
    where: { quote: { status: 'COMPLETE', region, scope: 'SHARED' } }
  })

  await Promise.all(
    groups
      .filter((g): g is { materialGroup: string } => g.materialGroup != null)
      .map(g => recomputePriceReference(g.materialGroup, region))
  )
}

// Type alias for return type
type PriceReference = Awaited<ReturnType<typeof prisma.priceReference.upsert>>
