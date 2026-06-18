// src/lib/engine/quote-extractor.ts
// AI extraction of line items from uploaded historical quotes
// Called after admin uploads a quote file

import Anthropic from '@anthropic-ai/sdk'
import { prisma } from '@/lib/prisma'
import { recomputeAllPriceReferences } from './price-engine'

const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY! })

const EXTRACTION_PROMPT = `Είσαι ειδικός εξαγωγής τιμών από κυπριακές/ελληνικές προσφορές κατασκευαστικών έργων.

ΑΠΟΣΤΟΛΗ: Εξήγαγε ΜΟΝΟ line items με συγκεκριμένη τιμή μονάδας. Αγνόησε γενικά ποσά, αμοιβές, Provisional Sums χωρίς τιμή.

ΓΙΑ ΚΑΘΕ LINE ITEM εξήγαγε:
- medskoCategory: αριθμός κατηγορίας ΜΕΔΣΚ (1-16)
- medskoCode: κωδικός αν υπάρχει (π.χ. ΔΑ.1.2)
- description: ακριβής περιγραφή όπως γράφεται
- unit: μονάδα (m², m³, τεμ., kg, m, Όλον)
- unitPrice: τιμή μονάδας σε EUR (μόνο αριθμός)
- materialGroup: ομάδα υλικού από τη λίστα παρακάτω
- confidence: high (ξεκάθαρη τιμή) | medium | low (αμφίβολο)

MATERIAL GROUPS (χρησιμοποίησε ΑΚΡΙΒΩΣ αυτά τα strings):
excavation | concrete_c1620 | concrete_c2025 | concrete_c2530 | steel_s500 |
masonry_9cm | masonry_12cm | masonry_25cm | gypsum_board |
plaster_exterior | plaster_interior | waterproofing_roof | xps_5cm | xps_8cm |
screed_5cm | tiles_30x30 | tiles_30x60 | tiles_60x60 | tiles_60x60plus | marble |
aluminium_standard | aluminium_premium | door_interior | door_entrance | door_wc |
plumbing_ppr | plumbing_pvc | wc_suite | washbasin | shower | bathtub | water_heater |
electrical_circuit | electrical_panel | paint_interior | paint_exterior |
scaffolding | site_setup |
other

ΚΑΝΟΝΕΣ:
- ΜΗΝ εφευρίσκεις τιμές — μόνο ό,τι γράφεται ρητά
- Αν μια τιμή φαίνεται εκτός εύρους (π.χ. αλουμίνιο €50/m²) → confidence: low, isOutlier: true
- Τιμές ΧΩΡΙΣ ΦΠΑ (αν δεν είναι σαφές → confidence: medium)
- Αγνόησε items χωρίς τιμή μονάδας

Απάντα ΜΟΝΟ JSON χωρίς markdown:
{
  "projectType": "house|apartment|commercial|industrial|unknown",
  "region": "cyprus|greece|unknown",
  "projectDate": "YYYY-MM-DD ή null",
  "currency": "EUR",
  "items": [
    {
      "medskoCategory": "string",
      "medskoCode": "string ή null",
      "description": "string",
      "unit": "string",
      "unitPrice": 0.00,
      "materialGroup": "string",
      "confidence": "high|medium|low",
      "isOutlier": false
    }
  ],
  "totalItemsFound": 0,
  "extractionNotes": "string"
}`

export async function extractQuoteLineItems(
  quoteId: string,
  fileContent: Anthropic.MessageParam['content']
): Promise<{ success: boolean; itemCount: number; error?: string }> {

  // Mark as processing
  await prisma.historicalQuote.update({
    where: { id: quoteId },
    data: { status: 'PROCESSING' }
  })

  try {
    const response = await anthropic.messages.create({
      model: 'claude-sonnet-4-6',  // Sonnet αρκεί για extraction
      max_tokens: 4000,
      system: EXTRACTION_PROMPT,
      messages: [{ role: 'user', content: fileContent }]
    })

    const text = response.content.find(b => b.type === 'text')?.text || ''

    let parsed: any
    try {
      const clean = text.replace(/```json|```/g, '').trim()
      parsed = JSON.parse(clean)
    } catch {
      throw new Error('Invalid JSON from extraction')
    }

    if (!parsed.items?.length) {
      await prisma.historicalQuote.update({
        where: { id: quoteId },
        data: { status: 'FAILED', extractionNotes: 'Δεν βρέθηκαν line items με τιμές' }
      })
      return { success: false, itemCount: 0, error: 'Δεν βρέθηκαν line items' }
    }

    // Normalise descriptions for matching
    const items = parsed.items.map((item: any) => ({
      quoteId,
      medskoCategory: item.medskoCategory || '16',
      medskoCode: item.medskoCode || null,
      description: item.description,
      unit: item.unit,
      unitPrice: parseFloat(item.unitPrice),
      materialGroup: item.materialGroup || 'other',
      normalisedDesc: item.description.toLowerCase().replace(/[^α-ωa-z0-9\s]/g, '').trim(),
      confidence: item.confidence || 'medium',
      isOutlier: item.isOutlier || false,
    })).filter((i: any) => i.unitPrice > 0 && i.unitPrice < 100000)

    // Store line items
    await prisma.$transaction([
      prisma.priceLineItem.createMany({ data: items }),
      prisma.historicalQuote.update({
        where: { id: quoteId },
        data: {
          status: 'COMPLETE',
          extractedAt: new Date(),
          extractionNotes: parsed.extractionNotes || null,
        }
      })
    ])

    // Recompute price references
    await recomputeAllPriceReferences()

    return { success: true, itemCount: items.length }

  } catch (error) {
    await prisma.historicalQuote.update({
      where: { id: quoteId },
      data: { status: 'FAILED', extractionNotes: (error as Error).message }
    })
    return { success: false, itemCount: 0, error: (error as Error).message }
  }
}
