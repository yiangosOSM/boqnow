// src/app/api/boq/pipeline/phase-b/route.ts
// Receives clarification answers, runs Step 5, saves final BOQ

import { auth } from '@/lib/auth'
import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { prisma } from '@/lib/prisma'
import { runPipelinePhaseB } from '@/lib/engine/pipeline'
import { reportOverageUsage } from '@/lib/stripe'
import { checkUsage } from '@/lib/stripe'
import { COST_LIMITS } from '@/lib/engine/cost-control'
import { logger } from '@/lib/logger'
import { formatErrorResponse } from '@/lib/errors'
import type { ClarificationAnswer, PipelineFile } from '@/lib/engine/pipeline'

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

export async function POST(req: NextRequest) {
  try {
    const { userId } = auth()
    if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const { projectId, answers } = await req.json() as { projectId: string; answers: ClarificationAnswer[] }
    if (!projectId) return NextResponse.json({ error: 'Missing projectId' }, { status: 400 })

    const user = await prisma.user.findUnique({ where: { clerkId: userId }, include: { subscription: true } })
    if (!user) return NextResponse.json({ error: 'User not found' }, { status: 404 })

    // Load project + phase A data
    const project = await prisma.project.findFirst({ where: { id: projectId, userId: user.id } })
    if (!project?.description) return NextResponse.json({ error: 'Project not found or Phase A not complete' }, { status: 404 })

    const { phaseA, storagePaths } = JSON.parse(project.description)

    // Re-download files for Step 5
    const files: PipelineFile[] = []
    for (const storagePath of storagePaths as string[]) {
      const fileName = storagePath.split('/').pop() || storagePath
      const ext = fileName.split('.').pop()?.toLowerCase() || ''
      try {
        const { data } = await supabaseAdmin.storage.from('project-files').download(storagePath)
        if (!data) continue
        const buffer = Buffer.from(await data.arrayBuffer())
        const b64 = buffer.toString('base64')
        if (ext === 'pdf') files.push({ type: 'pdf', name: fileName, data: b64 })
        else if (['png','jpg','jpeg'].includes(ext)) files.push({ type: 'image', name: fileName, data: b64, mediaType: ext === 'png' ? 'image/png' : 'image/jpeg' })
        else files.push({ type: 'text', name: fileName, data: buffer.toString('utf-8', 0, 40000) })
      } catch {}
    }

    // Run Phase B (Step 5)
    const start = Date.now()
    const boqResult = await runPipelinePhaseB(files, phaseA, answers || [], project.name, 'cyprus', undefined, userId)
    const durationMs = Date.now() - start

    // Get next version
    const lastVersion = await prisma.bOQVersion.findFirst({ where: { projectId }, orderBy: { version: 'desc' } })
    const nextVersion = (lastVersion?.version ?? 0) + 1

    // Save
    const startOfMonth = new Date(); startOfMonth.setDate(1); startOfMonth.setHours(0,0,0,0)
    const count = await prisma.project.count({ where: { userId: user.id, createdAt: { gte: startOfMonth } } })
    const plan = user.subscription?.plan || 'FREE'
    const usage = checkUsage(plan, count)

    await prisma.$transaction([
      prisma.bOQVersion.create({
        data: { projectId, version: nextVersion, boqData: boqResult as any, totalAmount: boqResult.grandTotal, method: 'multi_step_verified', confidence: boqResult.confidence },
      }),
      prisma.project.update({
        where: { id: projectId },
        data: { status: 'COMPLETE', totalAmount: boqResult.grandTotal, boqData: boqResult as any, description: null },
      }),
      prisma.aIRequestLog.create({
        data: { projectId, userId: user.id, model: 'pipeline-5step', estimatedCost: COST_LIMITS.EST_COST_PER_REQUEST.total_hybrid * 2, method: 'multi_step_verified', durationMs },
      }),
    ])

    logger.boqGenerated({ userId, projectId, plan, method: 'multi_step_verified', total: boqResult.grandTotal, durationMs })

    if (usage.isOverage && user.subscription) {
      reportOverageUsage(user.subscription.stripeCustomerId, user.subscription.id, plan, projectId).catch(() => null)
    }

    try {
      const { sendBOQReadyEmail } = await import('@/lib/email')
      await sendBOQReadyEmail(user.email, user.name || '', project.name, projectId, boqResult.grandTotal)
    } catch {}

    return NextResponse.json({ success: true, projectId, version: nextVersion, boq: boqResult })

  } catch (error) {
    logger.error('Pipeline Phase B failed', error)
    const { error: msg } = formatErrorResponse(error)
    return NextResponse.json({ error: msg }, { status: 500 })
  }
}
