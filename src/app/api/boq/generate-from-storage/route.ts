// src/app/api/boq/generate-from-storage/route.ts — Production-ready
import { auth } from '@clerk/nextjs/server'
import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { prisma } from '@/lib/prisma'
import { limiters, getIdentifier, applyRateLimit } from '@/lib/rate-limit'
import { withRetry, withTimeout, safeParseJSON, AIGenerationError, formatErrorResponse } from '@/lib/errors'
import { checkUsage, reportOverageUsage } from '@/lib/stripe'
import { validateSubscription } from '@/lib/stripe-guard'
import { checkRequestCost, estimatePDFPages, truncateToTokenBudget, COST_LIMITS, FileInfo } from '@/lib/engine/cost-control'
import { securityCheck, virusTotalHashLookup } from '@/lib/engine/file-security'
import { parseFile } from '@/lib/engine/file-parser'
import { generateBOQ } from '@/lib/boq-generator'
import { logger } from '@/lib/logger'
import Anthropic from '@anthropic-ai/sdk'

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

export async function POST(req: NextRequest) {
  const start = Date.now()
  let projectId: string | null = null

  try {
    const { userId } = auth()
    if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const ip = req.headers.get('x-forwarded-for')?.split(',')[0]?.trim() || 'unknown'
    const identifier = getIdentifier(req, userId)
    const { blocked, response } = await applyRateLimit(limiters.boq, identifier)
    if (blocked) return response!

    const { projectName, storagePaths } = await req.json()
    if (!projectName?.trim() || !storagePaths?.length) {
      return NextResponse.json({ error: 'Missing projectName or storagePaths' }, { status: 400 })
    }

    // ── Ownership check ───────────────────────────────────────
    const invalidPaths = (storagePaths as string[]).filter((p: string) => p.split('/')[0] !== userId)
    if (invalidPaths.length > 0) {
      logger.securityEvent('Unauthorized storage path', { userId, invalidPaths })
      return NextResponse.json({ error: 'Unauthorized file access' }, { status: 403 })
    }

    // ── File count pre-check (before download) ────────────────
    if (storagePaths.length > COST_LIMITS.MAX_FILES_PER_PROJECT) {
      return NextResponse.json({ error: `Μέγιστο ${COST_LIMITS.MAX_FILES_PER_PROJECT} αρχεία ανά project` }, { status: 400 })
    }

    // ── Subscription + usage check ────────────────────────────
    const subStatus = await validateSubscription(userId)
    if (!subStatus.allowed) return NextResponse.json({ error: subStatus.reason }, { status: 403 })
    const plan = subStatus.plan

    const user = await prisma.user.findUnique({ where: { clerkId: userId }, include: { subscription: true } })
    if (!user) return NextResponse.json({ error: 'User not found' }, { status: 404 })

    const startOfMonth = new Date(); startOfMonth.setDate(1); startOfMonth.setHours(0,0,0,0)
    const projectsThisMonth = await prisma.project.count({ where: { userId: user.id, createdAt: { gte: startOfMonth } } })
    const usage = checkUsage(plan, projectsThisMonth)
    if (!usage.allowed) {
      return NextResponse.json({ error: 'Έφτασες το όριο δωρεάν projects.', code: 'PLAN_LIMIT', upgradeUrl: `${process.env.NEXT_PUBLIC_APP_URL}/pricing` }, { status: 429 })
    }

    // ── Create project ────────────────────────────────────────
    const project = await prisma.project.create({
      data: {
        userId: user.id,
        name: projectName,
        inputFiles: storagePaths.map((p: string) => p.split('/').pop() || p),
        status: 'PROCESSING',
        description: usage.isOverage ? `overage:${usage.overagePrice}` : null,
      },
    })
    projectId = project.id

    // Audit log
    await prisma.auditLog.create({ data: { userId: user.id, action: 'GENERATE', projectId: project.id, ip, metadata: { fileCount: storagePaths.length, plan } } })

    // ── Download + validate files ─────────────────────────────
    const messageContent: Anthropic.MessageParam['content'] = []
    const filesSummary: string[] = []
    const fileInfos: FileInfo[] = []
    const warnings: string[] = []

    for (const storagePath of storagePaths as string[]) {
      const fileName = storagePath.split('/').pop() || storagePath
      const ext = fileName.split('.').pop()?.toLowerCase() || ''

      try {
        const { data, error } = await supabaseAdmin.storage.from('project-files').download(storagePath)
        if (error || !data) { filesSummary.push(`[${fileName}: failed]`); continue }

        const buffer = Buffer.from(await data.arrayBuffer())
        fileInfos.push({ name: fileName, sizeBytes: buffer.length, pdfPages: ext === 'pdf' ? estimatePDFPages(buffer) : undefined })

        // Security check
        const check = securityCheck(buffer, fileName)
        if (!check.valid) {
          logger.securityEvent('File rejected', { userId, fileName, reasons: check.reasons })
          warnings.push(`"${fileName}" απορρίφθηκε: ${check.reasons.join(', ')}`)
          continue
        }

        // VirusTotal (non-blocking)
        const vt = await virusTotalHashLookup(check.sha256)
        if (!vt.clean && !vt.skipped) {
          logger.securityEvent('VirusTotal hit', { userId, fileName, detections: vt.detections })
          warnings.push(`"${fileName}" επισημάνθηκε ως ύποπτο`)
          continue
        }

        // Build Claude message content
        if (ext === 'pdf') {
          const pages = fileInfos[fileInfos.length-1].pdfPages || 0
          if (pages > COST_LIMITS.MAX_PDF_PAGES) {
            warnings.push(`"${fileName}": ${pages} σελίδες — υπερβαίνει το όριο ${COST_LIMITS.MAX_PDF_PAGES}. Παρεκτείνεται ως Provisional.`)
            messageContent.push({ type: 'text', text: `[${fileName}: ${pages}-page PDF — too large for direct analysis. Include as Provisional Sum.]` })
            filesSummary.push(`${fileName} (PDF-oversized)`)
          } else {
            messageContent.push({ type: 'document', source: { type: 'base64', media_type: 'application/pdf', data: buffer.toString('base64') } } as any)
            filesSummary.push(`${fileName} (PDF/${pages}p)`)
          }
        } else if (['png','jpg','jpeg'].includes(ext)) {
          messageContent.push({ type: 'image', source: { type: 'base64', media_type: ext === 'png' ? 'image/png' : 'image/jpeg', data: buffer.toString('base64') } } as any)
          filesSummary.push(`${fileName} (Image)`)
        } else {
          const parsed = await parseFile(buffer, fileName)
          if (parsed.text) {
            messageContent.push({ type: 'text', text: truncateToTokenBudget(parsed.text) })
            filesSummary.push(`${fileName} (${parsed.type})`)
            if (['dwg','dxf'].includes(ext)) warnings.push(`"${fileName}": DWG/DXF δεν αναλύεται απευθείας — αποτέλεσμα ως Provisional Sum`)
          }
        }
      } catch (e) {
        filesSummary.push(`[${fileName}: error]`)
      }
    }

    // ── Total size check (after download, before AI) ──────────
    const costCheck = checkRequestCost(fileInfos)
    if (!costCheck.allowed) {
      await prisma.project.update({ where: { id: project.id }, data: { status: 'ERROR' } })
      return NextResponse.json({ error: costCheck.reasons.join('; ') }, { status: 400 })
    }
    warnings.push(...costCheck.warnings)

    if (messageContent.length === 0) {
      await prisma.project.update({ where: { id: project.id }, data: { status: 'ERROR' } })
      return NextResponse.json({ error: 'Κανένα αρχείο δεν επεξεργάστηκε', warnings }, { status: 400 })
    }

    messageContent.push({ type: 'text', text: `Αρχεία: ${filesSummary.join(', ')}\nΈργο: "${projectName}"\nΔημιούργησε πλήρες ΜΕΔΣΚ-compliant BOQ.` })

    // ── Generate BOQ ──────────────────────────────────────────
    const boqResult = await withTimeout(
      () => withRetry(() => generateBOQ(messageContent, projectName), { maxAttempts: 2, initialDelay: 2000 }),
      120_000, 'Η ανάλυση άργησε. Δοκίμασε με λιγότερα αρχεία.'
    )

    if (warnings.length > 0) boqResult.warnings = [...(boqResult.warnings || []), ...warnings]

    const durationMs = Date.now() - start

    // ── Get next version number ───────────────────────────────
    const lastVersion = await prisma.bOQVersion.findFirst({
      where: { projectId: project.id },
      orderBy: { version: 'desc' },
    })
    const nextVersion = (lastVersion?.version ?? 0) + 1

    // ── Save BOQ version + update project ─────────────────────
    await prisma.$transaction([
      prisma.bOQVersion.create({
        data: {
          projectId: project.id,
          version: nextVersion,
          boqData: boqResult as any,
          totalAmount: boqResult.grandTotal,
          method: boqResult.method,
          confidence: boqResult.confidence,
        },
      }),
      prisma.project.update({
        where: { id: project.id },
        data: { status: 'COMPLETE', totalAmount: boqResult.grandTotal, boqData: boqResult as any },
      }),
      prisma.aIRequestLog.create({
        data: {
          projectId: project.id,
          userId: user.id,
          model: 'claude-opus-4-5',
          estimatedCost: COST_LIMITS.EST_COST_PER_REQUEST.total_hybrid,
          method: boqResult.method,
          durationMs,
        },
      }),
    ])

    logger.boqGenerated({ userId, projectId: project.id, plan, method: boqResult.method, total: boqResult.grandTotal, durationMs })

    // ── Overage + email (non-blocking) ────────────────────────
    if (usage.isOverage && user.subscription) {
      reportOverageUsage(user.subscription.stripeCustomerId, user.subscription.id, plan, project.id)
        .catch(e => logger.error('Overage failed', e))
    }
    try {
      const { sendBOQReadyEmail } = await import('@/lib/email')
      await sendBOQReadyEmail(user.email, user.name || '', projectName, project.id, boqResult.grandTotal)
    } catch {}

    return NextResponse.json({
      success: true, projectId: project.id, version: nextVersion, boq: boqResult,
      usage: { plan, projectsThisMonth: projectsThisMonth + 1, limit: usage.limit, remaining: Math.max(0, usage.remaining - 1), isOverage: usage.isOverage, overagePrice: usage.overagePrice },
      warnings,
    })

  } catch (error) {
    logger.error('BOQ generation failed', error, { projectId: projectId || undefined })
    if (projectId) await prisma.project.update({ where: { id: projectId }, data: { status: 'ERROR' } }).catch(() => null)
    const { error: msg, code } = formatErrorResponse(error)
    return NextResponse.json({ error: msg, code }, { status: (error as any)?.status || 500 })
  }
}

// NOTE FOR DEVELOPER:
// After messageContent is assembled, inject live price map into the Step 5 prompt:
//
// import { getLivePriceMap, formatPriceMapForPrompt } from '@/lib/engine/price-engine'
// const priceMap = await getLivePriceMap('cyprus', userId)
// const livePrices = formatPriceMapForPrompt(priceMap, {})
// Then append livePrices to the final message before calling generateBOQ()
// The boq-generator.ts Step 5 prompt injection point is already set up.
