// src/lib/boq-generator.ts — Hybrid Rules Engine + Claude
import Anthropic from '@anthropic-ai/sdk'
import { runQuantityEngine, validateEngineVsAI, BuildingGeometry } from './engine/quantity-rules'
import { Region } from './engine/cost-database'
import { safeParseJSON } from './errors'

const client = new Anthropic()

export interface BOQItem {
  id: string; category: string; description: string; unit: string
  quantity: number; unitPrice: number; total: number
  medskoCode?: string | null; notes?: string | null
}
export interface BOQSection { title: string; items: BOQItem[]; subtotal: number }
export interface BOQResult {
  projectName: string; sections: BOQSection[]; grandTotal: number
  currency: 'EUR'; generatedAt: string; confidence: 'high' | 'medium' | 'low'
  method: 'hybrid' | 'ai_only'
  engineValidation?: { engineTotal: number; aiTotal: number; deviation: number; requiresReview: boolean }
  warnings?: string[]
}

const GEOMETRY_PROMPT = `Αναλύεις αρχιτεκτονικά σχέδια και εξάγεις ΜΟΝΟ γεωμετρικά δεδομένα. Απάντα ΜΟΝΟ JSON χωρίς markdown:
{"rooms":[{"name":"string","area":0,"perimeter":0,"height":2.80,"doors":[{"width":0.9,"height":2.1,"type":"internal","count":1}],"windows":[{"width":1.2,"height":1.4,"type":"openable","count":1}],"wetRoom":false}],"totalFloorArea":0,"floors":1,"hasPatio":false,"patioArea":0,"hasPool":false,"poolArea":0,"extractionConfidence":"high|medium|low","extractionNotes":"string"}`

const SUPPLEMENTARY_PROMPT = `Είσαι QS Κύπρου. Πρόσθεσε μόνο τις κατηγορίες που λείπουν: Προκαταρκτικά, Χωματουργικά, Σκυροδέματα, Τοιχοποιία, Μονώσεις, Υδραυλικά, Ηλεκτρολογικά. Τιμές EUR Κύπρος 2024.
Απάντα ΜΟΝΟ JSON: {"supplementarySections":[{"title":"string","items":[{"id":"string","category":"string","description":"string","unit":"string","quantity":0,"unitPrice":0,"total":0,"medskoCode":null,"notes":null}],"subtotal":0}]}`

const AI_ONLY_PROMPT = `Είσαι QS Κύπρου. ΜΕΔΣΚ BOQ. EUR 2024. Απάντα ΜΟΝΟ JSON:
{"projectName":"string","sections":[{"title":"string","items":[{"id":"string","category":"string","description":"string","unit":"string","quantity":0,"unitPrice":0,"total":0,"medskoCode":null,"notes":null}],"subtotal":0}],"grandTotal":0,"currency":"EUR","confidence":"high|medium|low","analysisNotes":"string"}`

export async function generateBOQ(
  messageContent: Anthropic.MessageParam['content'],
  projectName: string,
  region: Region = 'cyprus'
): Promise<BOQResult> {
  try {
    const geoResp = await client.messages.create({
      model: 'claude-sonnet-4-6', max_tokens: 4096, system: GEOMETRY_PROMPT,  // Sonnet: structured extraction
      messages: [{ role: 'user', content: messageContent }],
    })
    const geoText = geoResp.content[0].type === 'text' ? geoResp.content[0].text : ''
    const geometry = safeParseJSON<BuildingGeometry>(geoText)

    if (geometry && Array.isArray(geometry.rooms) && geometry.rooms.length > 0) {
      const engineResult = runQuantityEngine(geometry, region)
      const existingTitles = engineResult.sections.map(s => s.title).join(', ')

      const textContent: Anthropic.TextBlockParam = {
        type: 'text',
        text: `Υπάρχουν ήδη: ${existingTitles}. Έργο: ${projectName}, ${geometry.totalFloorArea}m².`,
      }
      const suppContent: Anthropic.MessageParam['content'] = typeof messageContent === 'string'
        ? [{ type: 'text', text: messageContent }, textContent]
        : [...(messageContent as any[]), textContent]

      const suppResp = await client.messages.create({
        model: 'claude-sonnet-4-6', max_tokens: 4096, system: SUPPLEMENTARY_PROMPT,  // Sonnet: structured JSON
        messages: [{ role: 'user', content: suppContent }],
      })
      const suppText = suppResp.content[0].type === 'text' ? suppResp.content[0].text : ''
      const supp = safeParseJSON<{ supplementarySections: BOQSection[] }>(suppText)

      const engineSections: BOQSection[] = engineResult.sections.map(s => ({
        ...s,
        items: s.items.map((i: any) => ({
          ...i, category: s.title,
          notes: `[Rules Engine: ${i.calculationNote}]${i.notes ? ' ' + i.notes : ''}`,
        })),
      }))

      const allSections: BOQSection[] = [...engineSections, ...(supp?.supplementarySections ?? [])]
      const grandTotal = parseFloat(allSections.reduce((s, sec) => s + sec.subtotal, 0).toFixed(2))
      const validation = validateEngineVsAI(engineResult.grandTotal, grandTotal)

      return {
        projectName, sections: allSections, grandTotal, currency: 'EUR',
        generatedAt: new Date().toISOString(),
        confidence: (geometry as any).extractionConfidence ?? 'medium',
        method: 'hybrid',
        engineValidation: { ...validation, engineTotal: engineResult.grandTotal, aiTotal: grandTotal },
        warnings: [
          ...engineResult.warnings,
          ...(validation.requiresReview ? [`Απόκλιση ${validation.deviation}% — συνιστάται QS έλεγχος`] : []),
        ],
      }
    }
  } catch (e) {
    console.warn('Hybrid mode failed, fallback to AI-only:', e)
  }

  // Fallback AI-only
  const resp = await client.messages.create({
    model: 'claude-opus-4-5', max_tokens: 8192, system: AI_ONLY_PROMPT,  // Opus: complex full BOQ fallback
    messages: [{ role: 'user', content: messageContent }],
  })
  const text = resp.content[0].type === 'text' ? resp.content[0].text : ''
  const result = safeParseJSON<any>(text)
  if (!result?.sections) throw new Error('AI failed to generate BOQ')
  return { ...result, generatedAt: new Date().toISOString(), method: 'ai_only', warnings: ['AI-only mode — συνιστάται QS validation'] }
}
