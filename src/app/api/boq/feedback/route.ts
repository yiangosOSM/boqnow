// src/app/api/boq/feedback/route.ts
import { auth } from '@clerk/nextjs/server'
import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function POST(req: NextRequest) {
  const { userId } = auth()
  if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { projectId, rating, comment } = await req.json()
  if (!projectId || !rating || rating < 1 || rating > 5) {
    return NextResponse.json({ error: 'Invalid feedback data' }, { status: 400 })
  }

  const user = await prisma.user.findUnique({ where: { clerkId: userId } })
  if (!user) return NextResponse.json({ error: 'User not found' }, { status: 404 })

  // Verify ownership
  const project = await prisma.project.findFirst({
    where: { id: projectId, userId: user.id }
  })
  if (!project) return NextResponse.json({ error: 'Project not found' }, { status: 404 })

  // Store feedback via audit log
  await prisma.auditLog.create({
    data: {
      userId: user.id,
      action: 'FEEDBACK',
      projectId,
      metadata: { rating, comment: comment?.slice(0, 500) || null }
    }
  })

  return NextResponse.json({ success: true })
}
