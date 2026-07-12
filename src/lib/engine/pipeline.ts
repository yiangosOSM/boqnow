// src/lib/engine/pipeline.ts
// 5-step BOQ generation pipeline
// Each step uses the right model for the right task

import Anthropic from '@anthropic-ai/sdk'
import { safeParseJSON, withRetry, withTimeout } from '../errors'
import { logger } from '../logger'
import {
  STEP1_CLASSIFICATION as STEP1_CLASSIFICATION_PROMPT,
  STEP2_EXTRACTION    as STEP2_EXTRACTION_PROMPT,
  STEP3_REVIEW        as STEP3_REVIEW_PROMPT,
  STEP4_CLARIFICATION as STEP4_CLARIFICATION_PROMPT,
  STEP5_FINAL_ASSEMBLY as STEP5_FINAL_ASSEMBLY_PROMPT,
} from './prompts/system-prompts'
import { getRatesByCategory } from './cost-database'
import type { Region } from './cost-database'
import { getLivePriceMap, formatPriceMapForPrompt } from './price-engine'

const client = new Anthropic()

// ── Models per step ───────────────────────────────────────────
const MODELS = {
  fast:    'claude-sonnet-4-6',   // classification, review, questions
  quality: 'claude-opus-4-5',     // extraction, final assembly
}

// ── Types ─────────────────────────────────────────────────────
export interface PipelineFile {
  type: 'pdf' | 'image' | 'text'
  name: string
  data: string         // base64 for pdf/image, text for text
  mediaType?: string
}

export interface ClarificationQuestion {
  id: string
  question: string
  type: 'yes_no' | 'multiple_choice' | 'text'
  options?: string[]
  default?: string
  impact: 'high' | 'medium'
  affects_categories: string[]
  estimated_cost_impact: string
}

export interface ClarificationAnswer {
  questionId: string
  answer: string
}

export interface PipelineProgress {
  step: 1 | 2 | 3 | 4 | 5
  status: 'running' | 'done' | 'error'
  message: string
  pct: number
}

export type ProgressCallback = (p: PipelineProgress) => void

// ── Build message content from files ─────────────────────────
function buildContent(
  files: PipelineFile[],
  extraText?: string
): Anthropic.MessageParam['content'] {
  const content: Anthropic.MessageParam['content'] = []

  for (const f of files) {
    if (f.type === 'pdf') {
      content.push({ type: 'document', source: { type: 'base64', media_type: 'application/pdf', data: f.data } } as any)
    } else if (f.type === 'image') {
      content.push({ type: 'image', source: { type: 'base64', media_type: (f.mediaType || 'image/jpeg') as any, data: f.data } } as any)
    } else {
      content.push({ type: 'text', text: `--- ${f.name} ---\n${f.data}\n---` })
    }
  }

  if (extraText) content.push({ type: 'text', text: extraText })
  return content
}

async function callClaude(
  model: string,
  system: string,
  content: Anthropic.MessageParam['content'],
  maxTokens = 4096
): Promise<any> {
  const resp = await withRetry(
    async () => {
      const r = await client.messages.create({ model, max_tokens: maxTokens, system, messages: [{ role: 'user', content }] })
      const text = r.content[0].type === 'text' ? r.content[0].text : ''
      const parsed = safeParseJSON<any>(text)
      if (!parsed) throw new Error('Invalid JSON from Claude')
      return parsed
    },
    { maxAttempts: 2, initialDelay: 2000 }
  )
  return resp
}

// ══════════════════════════════════════════════════════════════
// MAIN PIPELINE
// ══════════════════════════════════════════════════════════════

export async function runStep1Classification(
  files: PipelineFile[],
  onProgress?: ProgressCallback
): Promise<any> {
  onProgress?.({ step: 1, status: 'running', message: 'Αναγνώριση τύπων σχεδίων...', pct: 5 })

  const content = buildContent(files, `Κατηγοριοποίησε αυτά τα ${files.length} αρχεία.`)
  const result = await withTimeout(
    () => callClaude(MODELS.fast, STEP1_CLASSIFICATION_PROMPT, content, 2048),
    30_000
  )

  onProgress?.({ step: 1, status: 'done', message: `Αναγνωρίστηκαν ${result.files?.length || 0} αρχεία`, pct: 15 })
  logger.info('Step 1 complete', { fileCount: result.files?.length, buildingType: result.projectSummary?.buildingType })
  return result
}

export async function runStep2Extraction(
  files: PipelineFile[],
  classification: any,
  projectName: string,
  onProgress?: ProgressCallback
): Promise<any> {
  onProgress?.({ step: 2, status: 'running', message: 'Εξαγωγή ποσοτήτων...', pct: 20 })

  const context = `Έργο: "${projectName}"
Τύπος κτιρίου: ${classification.projectSummary?.buildingType || 'άγνωστο'}
Αριθμός ορόφων: ${classification.projectSummary?.floorCount || 'άγνωστο'}
Εκτιμώμενο εμβαδόν: ${classification.projectSummary?.estimatedTotalArea || 'άγνωστο'}
Διαθέσιμα σχέδια: ${classification.files?.map((f: any) => `${f.filename} (${f.drawingType}, ${f.floor})`).join(', ')}
Λείπουν: ${classification.missingCriticalDrawings?.join(', ') || 'κανένα'}

Εξήγαγε ποσότητες για όλες τις ΜΕΔΣΚ κατηγορίες που υποστηρίζονται από τα διαθέσιμα σχέδια.`

  const content = buildContent(files, context)
  const result = await withTimeout(
    () => callClaude(MODELS.quality, STEP2_EXTRACTION_PROMPT, content, 8192),
    90_000
  )

  onProgress?.({ step: 2, status: 'done', message: `Εξήχθησαν ${result.sections?.length || 0} κατηγορίες`, pct: 45 })
  logger.info('Step 2 complete', { sections: result.sections?.length, confidence: result.extraction_confidence })
  return result
}

export async function runStep3Review(
  extraction: any,
  classification: any,
  onProgress?: ProgressCallback
): Promise<any> {
  onProgress?.({ step: 3, status: 'running', message: 'Cross-check & επαλήθευση...', pct: 50 })

  const context = `Κάνε review σε αυτό το BOQ:

ΚΑΤΗΓΟΡΙΕΣ ΕΞΑΧΘΕΙΣΕΣ: ${extraction.sections?.map((s: any) => s.categoryTitle).join(', ')}
ASSUMPTIONS: ${JSON.stringify(extraction.assumptions_list || [])}
MISSING INFO: ${extraction.missing_information?.join(', ') || 'κανένα'}
EXTRACTION CONFIDENCE: ${extraction.extraction_confidence}

BOQ DATA:
${JSON.stringify(extraction.sections || [], null, 2)}`

  const content: Anthropic.MessageParam['content'] = [{ type: 'text', text: context }]
  const result = await withTimeout(
    () => callClaude(MODELS.fast, STEP3_REVIEW_PROMPT, content, 3000),
    30_000
  )

  onProgress?.({ step: 3, status: 'done', message: `Βρέθηκαν ${result.issues_found?.length || 0} θέματα`, pct: 65 })
  logger.info('Step 3 complete', { issues: result.issues_found?.length, quality: result.overall_quality })
  return result
}

export async function runStep4Clarifications(
  extraction: any,
  review: any,
  onProgress?: ProgressCallback
): Promise<ClarificationQuestion[]> {
  onProgress?.({ step: 4, status: 'running', message: 'Δημιουργία ερωτήσεων διευκρίνισης...', pct: 70 })

  const context = `Με βάση:

FLAGGED ITEMS: ${extraction.sections?.flatMap((s: any) => s.items?.filter((i: any) => i.flaggedForReview).map((i: any) => i.description)).join(', ') || 'κανένα'}
ASSUMPTIONS: ${extraction.assumptions_list?.map((a: any) => a.assumption).join(', ') || 'κανένα'}
MISSING ITEMS: ${review.missing_medsko_items?.join(', ') || 'κανένα'}
CRITICAL ISSUES: ${review.issues_found?.filter((i: any) => i.severity === 'critical').map((i: any) => i.description).join(', ') || 'κανένα'}

Φτιάξε 3-5 στοχευμένες ερωτήσεις για τον εργολάβο.`

  const content: Anthropic.MessageParam['content'] = [{ type: 'text', text: context }]
  const result = await withTimeout(
    () => callClaude(MODELS.fast, STEP4_CLARIFICATION_PROMPT, content, 2048),
    20_000
  )

  onProgress?.({ step: 4, status: 'done', message: `${result.questions?.length || 0} ερωτήσεις έτοιμες`, pct: 75 })
  return result.questions || []
}

export async function runStep5FinalAssembly(
  files: PipelineFile[],
  extraction: any,
  review: any,
  answers: ClarificationAnswer[],
  projectName: string,
  region: Region = 'cyprus',
  onProgress?: ProgressCallback,
  clerkUserId?: string
): Promise<any> {
  onProgress?.({ step: 5, status: 'running', message: 'Δημιουργία τελικού BOQ...', pct: 80 })

  const priceMap = await getLivePriceMap(region, clerkUserId)
  const livePricePrompt = formatPriceMapForPrompt(priceMap, {})

  // Build cost database context
  const costContext = ['ΣΚ', 'ΤΟ', 'ΕΠ', 'ΜΟ', 'ΔΑ', 'ΚΟ', 'ΥΔ', 'ΗΛ', 'ΧΡ', 'ΕΞ', 'ΠΡ']
    .map(cat => `${cat}: ${getRatesByCategory(cat, region).map(r => `${r.description} = €${r[region]}/${r.unit}`).join('; ')}`)
    .join('\n')

  const answersText = answers.length > 0
    ? `\nΑΠΑΝΤΗΣΕΙΣ ΕΡΓΟΛΑΒΟΥ:\n${answers.map(a => `- ${a.questionId}: ${a.answer}`).join('\n')}`
    : '\nΔεν δόθηκαν απαντήσεις.'

  const reviewFixes = review.issues_found?.filter((i: any) => i.severity !== 'low')
    .map((i: any) => `- ${i.type}: ${i.description} → ${i.suggested_fix}`)
    .join('\n') || 'Κανένα κρίσιμο θέμα'

  const context = `Έργο: "${projectName}" | Περιοχή: ${region}

ΕΞΑΧΘΕΙΣΕΣ ΠΟΣΟΤΗΤΕΣ:
${JSON.stringify(extraction.sections || [], null, 2)}

ΔΙΟΡΘΩΣΕΙΣ ΑΠΟ REVIEW:
${reviewFixes}
${answersText}

ΒΑΣΗ ΔΕΔΟΜΕΝΩΝ ΚΟΣΤΟΥΣ (${region.toUpperCase()} 2024):
${costContext}
${livePricePrompt}

Δημιούργησε το τελικό, επαληθευμένο ΜΕΔΣΚ BOQ.`

  const content: Anthropic.MessageParam['content'] = [{ type: 'text', text: context }]
  const result = await withTimeout(
    () => callClaude(MODELS.quality, STEP5_FINAL_ASSEMBLY_PROMPT, content, 8192),
    90_000
  )

  result.generatedAt = new Date().toISOString()
  onProgress?.({ step: 5, status: 'done', message: 'BOQ ολοκληρώθηκε ✓', pct: 100 })
  logger.info('Step 5 complete', { grandTotal: result.grandTotal, confidence: result.confidence })
  return result
}

// ══════════════════════════════════════════════════════════════
// SYNCHRONOUS PIPELINE (no clarification — auto mode)
// Use when you want a result without waiting for user input
// ══════════════════════════════════════════════════════════════
export async function runFullPipeline(
  files: PipelineFile[],
  projectName: string,
  region: Region = 'cyprus',
  onProgress?: ProgressCallback,
  clerkUserId?: string
): Promise<any> {
  const classification = await runStep1Classification(files, onProgress)
  const extraction     = await runStep2Extraction(files, classification, projectName, onProgress)
  const review         = await runStep3Review(extraction, classification, onProgress)
  const boq            = await runStep5FinalAssembly(files, extraction, review, [], projectName, region, onProgress, clerkUserId)
  return { boq, classification, extraction, review, questions: [] }
}

// ══════════════════════════════════════════════════════════════
// INTERACTIVE PIPELINE (with clarification questions)
// Phase A: run steps 1-4, return questions to user
// Phase B: receive answers, run step 5
// ══════════════════════════════════════════════════════════════
export async function runPipelinePhaseA(
  files: PipelineFile[],
  projectName: string,
  onProgress?: ProgressCallback
): Promise<{ classification: any; extraction: any; review: any; questions: ClarificationQuestion[] }> {
  const classification = await runStep1Classification(files, onProgress)
  const extraction     = await runStep2Extraction(files, classification, projectName, onProgress)
  const review         = await runStep3Review(extraction, classification, onProgress)
  const questions      = await runStep4Clarifications(extraction, review, onProgress)
  return { classification, extraction, review, questions }
}

export async function runPipelinePhaseB(
  files: PipelineFile[],
  phaseA: { classification: any; extraction: any; review: any },
  answers: ClarificationAnswer[],
  projectName: string,
  region: Region = 'cyprus',
  onProgress?: ProgressCallback,
  clerkUserId?: string
): Promise<any> {
  return runStep5FinalAssembly(files, phaseA.extraction, phaseA.review, answers, projectName, region, onProgress, clerkUserId)
}
