// src/app/api/boq/pipeline/phase-a/route.ts
// Runs Steps 1-4: classification → extraction → review → questions
// Returns questions for user to answer before final BOQ

import { auth } from '@clerk/nextjs/server'
import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { prisma } from '@/lib/prisma'
import { limiters, getIdentifier, applyRateLimit } from '@/lib/rate-limit'
import { validateSubscription } from '@/lib/stripe-guard'
import { checkUsage } from '@/lib/stripe'
import { securityCheck } from '@/lib/engine/file-security'
import { COST_LIMITS, estimatePDFPages } from '@/lib/engine/cost-control'
import { formatErrorResponse } from '@/lib/errors'
import { logger } from '@/lib/logger'
import { runPipelinePhaseA } from '@/lib/engine/pipeline'
import type { PipelineFile } from '@/lib/engine/pipeline'

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

export async function POST(req: NextRequest) {
  try {
    const { userId } = auth()
    if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const identifier = getIdentifier(req, userId)
    const { blocked, response } = await applyRateLimit(limiters.boq, identifier)
    if (blocked) return response!

    const { projectName, storagePaths } = await req.json()
    if (!projectName?.trim() || !storagePaths?.length) {
      return NextResponse.json({ error: 'Missing projectName or storagePaths' }, { status: 400 })
    }

    // Ownership check
    const invalid = (storagePaths as string[]).filter((p: string) => p.split('/')[0] !== userId)
    if (invalid.length > 0) {
      logger.securityEvent('Unauthorized storage path', { userId, invalid })
      return NextResponse.json({ error: 'Unauthorized file access' }, { status: 403 })
    }

    if (storagePaths.length > COST_LIMITS.MAX_FILES_PER_PROJECT) {
      return NextResponse.json({ error: `Μέγιστο ${COST_LIMITS.MAX_FILES_PER_PROJECT} αρχεία` }, { status: 400 })
    }

    const subStatus = await validateSubscription(userId)
    if (!subStatus.allowed) return NextResponse.json({ error: subStatus.reason }, { status: 403 })

    const user = await prisma.user.findUnique({ where: { clerkId: userId }, include: { subscription: true } })
    if (!user) return NextResponse.json({ error: 'User not found' }, { status: 404 })

    const startOfMonth = new Date(); startOfMonth.setDate(1); startOfMonth.setHours(0,0,0,0)
    const count = await prisma.project.count({ where: { userId: user.id, createdAt: { gte: startOfMonth } } })
    const usage = checkUsage(subStatus.plan, count)
    if (!usage.allowed) return NextResponse.json({ error: 'Έφτασες το όριο projects', code: 'PLAN_LIMIT' }, { status: 429 })

    // Create project record
    const project = await prisma.project.create({
      data: { userId: user.id, name: projectName, inputFiles: storagePaths.map((p: string) => p.split('/').pop() || p), status: 'PROCESSING' },
    })

    // Download and prepare files
    const files: PipelineFile[] = []
    const warnings: string[] = []

    for (const storagePath of storagePaths as string[]) {
      const fileName = storagePath.split('/').pop() || storagePath
      const ext = fileName.split('.').pop()?.toLowerCase() || ''

      try {
        const { data, error } = await supabaseAdmin.storage.from('project-files').download(storagePath)
        if (error || !data) continue

        const buffer = Buffer.from(await data.arrayBuffer())
        const check = securityCheck(buffer, fileName)
        if (!check.valid) { warnings.push(`"${fileName}" απορρίφθηκε`); continue }

        const b64 = buffer.toString('base64')

        if (ext === 'pdf') {
          const pages = estimatePDFPages(buffer)
          if (pages > COST_LIMITS.MAX_PDF_PAGES) {
            warnings.push(`"${fileName}": ${pages} σελίδες — πολύ μεγάλο`)
            continue
          }
          files.push({ type: 'pdf', name: fileName, data: b64 })
        } else if (['png','jpg','jpeg'].includes(ext)) {
          files.push({ type: 'image', name: fileName, data: b64, mediaType: ext === 'png' ? 'image/png' : 'image/jpeg' })
        } else if (['xlsx','xls','csv'].includes(ext)) {
          files.push({ type: 'text', name: fileName, data: buffer.toString('utf-8', 0, 40000) })
        } else if (['dwg','dxf'].includes(ext)) {
          files.push({ type: 'text', name: fileName, data: `[DWG/DXF: ${fileName} — Provisional Sum]` })
          warnings.push(`"${fileName}": DWG — αποτέλεσμα ως Provisional Sum`)
        }
      } catch { warnings.push(`"${fileName}": σφάλμα`) }
    }

    if (files.length === 0) {
      await prisma.project.update({ where: { id: project.id }, data: { status: 'ERROR' } })
      return NextResponse.json({ error: 'Κανένα αρχείο δεν επεξεργάστηκε', warnings }, { status: 400 })
    }

    // Run Phase A (steps 1-4)
    const phaseA = await runPipelinePhaseA(files, projectName)

    // Store intermediate results in project description (temporary)
    await prisma.project.update({
      where: { id: project.id },
      data: { description: JSON.stringify({ phaseA, storagePaths }) },
    })

    return NextResponse.json({
      success: true,
      projectId: project.id,
      questions: phaseA.questions,
      classification: phaseA.classification.projectSummary,
      extractionConfidence: phaseA.extraction.extraction_confidence,
      reviewIssues: phaseA.review.issues_found?.length || 0,
      warnings,
    })

  } catch (error) {
    logger.error('Pipeline Phase A failed', error)
    const { error: msg } = formatErrorResponse(error)
    return NextResponse.json({ error: msg }, { status: 500 })
  }
}
