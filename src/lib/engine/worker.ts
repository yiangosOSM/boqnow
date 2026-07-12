// src/lib/engine/worker.ts
// BullMQ Worker — run this as a separate process (not in Vercel)
// Deploy on Railway, Render, or a small VPS alongside the app
//
// Usage: npx tsx src/lib/engine/worker.ts
// Or add to package.json: "worker": "tsx src/lib/engine/worker.ts"

import { Worker, Job, UnrecoverableError } from 'bullmq'
import { createClient } from '@supabase/supabase-js'
import { prisma } from '@/lib/prisma'
import { generateBOQ } from '@/lib/boq-generator'
import { logger } from '@/lib/logger'
import { BOQ_QUEUE_NAME, BOQJobData, BOQJobResult } from './queue'
import { parseFile } from './file-parser'
import { truncateToTokenBudget } from './cost-control'
import { buildMockBOQ } from '@/lib/dev/mock-data'
import { getRedisConnection } from '@/lib/redis-connection'
import Anthropic from '@anthropic-ai/sdk'

const connection = getRedisConnection()

function getSupabaseAdmin() {
  if (process.env.MOCK_AUTH === 'true') return null
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  )
}

// ── Dead Letter Queue — failed jobs land here ─────────────────
const DLQ_NAME = `${BOQ_QUEUE_NAME}:dlq`

// ── Worker ────────────────────────────────────────────────────
const worker = new Worker<BOQJobData, BOQJobResult>(
  BOQ_QUEUE_NAME,
  async (job: Job<BOQJobData>) => {
    const { projectId, userId, projectName, storagePaths, plan, userEmail, userName, region } = job.data

    logger.info('BOQ job started', { jobId: job.id, projectId, fileCount: storagePaths.length })

    await job.updateProgress(5)

    if (process.env.MOCK_AUTH === 'true') {
      await job.updateProgress(50)
      const boqResult = buildMockBOQ(projectName)
      await job.updateProgress(85)

      const lastVersion = await prisma.bOQVersion.findFirst({
        where: { projectId }, orderBy: { version: 'desc' },
      })
      const nextVersion = (lastVersion?.version ?? 0) + 1

      await prisma.$transaction([
        prisma.bOQVersion.create({
          data: { projectId, version: nextVersion, boqData: boqResult as any, totalAmount: boqResult.grandTotal, method: boqResult.method, confidence: boqResult.confidence },
        }),
        prisma.project.update({
          where: { id: projectId },
          data: { status: 'COMPLETE', totalAmount: boqResult.grandTotal, boqData: boqResult as any },
        }),
      ])

      await job.updateProgress(100)
      return { success: true, boq: boqResult }
    }

    const supabaseAdmin = getSupabaseAdmin()
    if (!supabaseAdmin) throw new UnrecoverableError('Supabase not configured')

    // Build message content from storage files
    const messageContent: Anthropic.MessageParam['content'] = []
    const filesSummary: string[] = []
    const total = storagePaths.length

    for (let i = 0; i < storagePaths.length; i++) {
      const storagePath = storagePaths[i]
      const fileName = storagePath.split('/').pop() || storagePath
      const ext = fileName.split('.').pop()?.toLowerCase() || ''

      try {
        const { data, error } = await supabaseAdmin.storage.from('project-files').download(storagePath)
        if (error || !data) { filesSummary.push(`[${fileName}: failed]`); continue }

        const buffer = Buffer.from(await data.arrayBuffer())

        if (ext === 'pdf') {
          messageContent.push({ type: 'document', source: { type: 'base64', media_type: 'application/pdf', data: buffer.toString('base64') } } as any)
          filesSummary.push(`${fileName} (PDF)`)
        } else if (['png','jpg','jpeg'].includes(ext)) {
          messageContent.push({ type: 'image', source: { type: 'base64', media_type: ext === 'png' ? 'image/png' : 'image/jpeg', data: buffer.toString('base64') } } as any)
          filesSummary.push(`${fileName} (Image)`)
        } else {
          const parsed = await parseFile(buffer, fileName)
          if (parsed.text) {
            messageContent.push({ type: 'text', text: truncateToTokenBudget(parsed.text) })
            filesSummary.push(`${fileName} (${parsed.type})`)
          }
        }
      } catch (e) {
        filesSummary.push(`[${fileName}: error]`)
      }

      // Update progress as files are processed
      await job.updateProgress(Math.floor(10 + (i / total) * 40))
    }

    if (messageContent.length === 0) {
      // UnrecoverableError → goes to DLQ immediately, no retry
      throw new UnrecoverableError('No files could be processed')
    }

    messageContent.push({ type: 'text', text: `Αρχεία: ${filesSummary.join(', ')}\nΈργο: "${projectName}"\nΔημιούργησε πλήρες ΜΕΔΣΚ-compliant BOQ.` })
    await job.updateProgress(50)

    // Generate BOQ
    const boqResult = await generateBOQ(messageContent, projectName, region || 'cyprus')
    await job.updateProgress(85)

    // Get next version
    const lastVersion = await prisma.bOQVersion.findFirst({
      where: { projectId }, orderBy: { version: 'desc' },
    })
    const nextVersion = (lastVersion?.version ?? 0) + 1

    // Save to DB
    await prisma.$transaction([
      prisma.bOQVersion.create({
        data: { projectId, version: nextVersion, boqData: boqResult as any, totalAmount: boqResult.grandTotal, method: boqResult.method, confidence: boqResult.confidence },
      }),
      prisma.project.update({
        where: { id: projectId },
        data: { status: 'COMPLETE', totalAmount: boqResult.grandTotal, boqData: boqResult as any },
      }),
    ])

    await job.updateProgress(100)
    logger.info('BOQ job completed', { jobId: job.id, projectId, total: boqResult.grandTotal })

    // Send email
    try {
      const { sendBOQReadyEmail } = await import('@/lib/email')
      await sendBOQReadyEmail(userEmail, userName || '', projectName, projectId, boqResult.grandTotal)
    } catch {}

    return { success: true, boq: boqResult }
  },
  {
    connection,
    concurrency: 3,           // max 3 jobs at once
    stalledInterval: 30000,   // check for stalled jobs every 30s
    maxStalledCount: 2,       // move to failed after 2 stalls
  }
)

// ── Event handlers ─────────────────────────────────────────────
worker.on('completed', (job) => {
  logger.info('Job completed', { jobId: job.id, projectId: job.data.projectId })
})

worker.on('failed', async (job, err) => {
  if (!job) return
  logger.error('Job failed', err, { jobId: job.id, projectId: job.data.projectId, attempts: job.attemptsMade })

  // Mark project as error after all retries exhausted
  if (job.attemptsMade >= (job.opts.attempts || 2)) {
    await prisma.project.update({
      where: { id: job.data.projectId },
      data: { status: 'ERROR' },
    }).catch(() => null)

    logger.error('Job moved to DLQ', undefined, { jobId: job.id, projectId: job.data.projectId })
  }
})

worker.on('stalled', (jobId) => {
  logger.warn('Job stalled', { jobId })
})

worker.on('error', (err) => {
  logger.error('Worker error', err)
})

// ── Graceful shutdown ─────────────────────────────────────────
process.on('SIGTERM', async () => {
  logger.info('Worker shutting down...')
  await worker.close()
  await prisma.$disconnect()
  process.exit(0)
})

logger.info(`BullMQ worker started — queue: ${BOQ_QUEUE_NAME}, concurrency: 3`)
