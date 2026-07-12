// src/lib/engine/queue.ts
// Async BOQ generation queue using BullMQ + Redis (Upstash)
// Prevents Vercel timeout on large file sets

import { Queue, Worker, Job } from 'bullmq'
import { getRedisConnection } from '@/lib/redis-connection'

const connection = getRedisConnection()

// ── Queue definition ──────────────────────────────────────────
export const BOQ_QUEUE_NAME = 'boq-generation'

export interface BOQJobData {
  projectId: string
  userId: string
  clerkId: string
  projectName: string
  storagePaths: string[]
  plan: string
  stripeCustomerId?: string
  userEmail: string
  userName?: string
  region?: 'cyprus' | 'greece'
}

export interface BOQJobResult {
  success: boolean
  boq?: any
  error?: string
}

// ── Producer (API route calls this) ──────────────────────────
let _queue: Queue | null = null

export function getBOQQueue(): Queue<BOQJobData, BOQJobResult> {
  if (!_queue) {
    _queue = new Queue<BOQJobData, BOQJobResult>(BOQ_QUEUE_NAME, {
      connection,
      defaultJobOptions: {
        attempts: 2,
        backoff: { type: 'exponential', delay: 3000 },
        removeOnComplete: { count: 100 },
        removeOnFail: { count: 50 },
      },
    })
  }
  return _queue as Queue<BOQJobData, BOQJobResult>
}

export async function enqueueBOQJob(data: BOQJobData): Promise<string> {
  const queue = getBOQQueue()
  const job = await queue.add(`boq:${data.projectId}`, data, {
    jobId: data.projectId, // idempotent — same project won't queue twice
    priority: getPriority(data.plan),
  })
  return job.id ?? data.projectId
}

export async function getBOQJobStatus(jobId: string): Promise<{
  status: 'waiting' | 'active' | 'completed' | 'failed' | 'unknown'
  progress?: number
  result?: BOQJobResult
  failReason?: string
}> {
  const queue = getBOQQueue()
  const job = await queue.getJob(jobId)
  if (!job) return { status: 'unknown' }

  const state = await job.getState()
  return {
    status: state as any,
    progress: job.progress as number,
    result: job.returnvalue,
    failReason: job.failedReason,
  }
}

// Higher plan = higher priority (lower number = higher priority in BullMQ)
function getPriority(plan: string): number {
  return { AGENCY: 1, PRO: 2, STARTER: 3, FREE: 4 }[plan] ?? 3
}
