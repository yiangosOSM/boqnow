// src/app/api/boq/status/[jobId]/route.ts
// Client polls this endpoint to get async BOQ job status

import { auth } from '@/lib/auth'
import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import type { BOQResult } from '@/lib/types'

export async function GET(
  req: NextRequest,
  { params }: { params: { jobId: string } }
) {
  const { userId } = auth()
  if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const user = await prisma.user.findUnique({ where: { clerkId: userId } })
  if (!user) return NextResponse.json({ error: 'Not found' }, { status: 404 })

  // jobId is the projectId
  const project = await prisma.project.findFirst({
    where: { id: params.jobId, userId: user.id },
    select: { id: true, status: true, boqData: true, totalAmount: true, name: true },
  })

  if (!project) return NextResponse.json({ error: 'Project not found' }, { status: 404 })

  return NextResponse.json({
    projectId: project.id,
    status: project.status,    // 'processing' | 'complete' | 'error'
    boq: project.status === 'COMPLETE' ? (project.boqData as unknown as BOQResult) : null,
    totalAmount: project.totalAmount,
    projectName: project.name,
  })
}
