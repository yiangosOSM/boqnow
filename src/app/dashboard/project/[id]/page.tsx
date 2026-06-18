// src/app/dashboard/project/[id]/page.tsx
import { auth } from '@clerk/nextjs/server'
import { redirect, notFound } from 'next/navigation'
import { prisma } from '@/lib/prisma'
import ProjectClient from '@/components/dashboard/ProjectClient'

export default async function ProjectPage({ params }: { params: { id: string } }) {
  const { userId } = auth()
  if (!userId) redirect('/sign-in')

  const user = await prisma.user.findUnique({ where: { clerkId: userId } })
  if (!user) redirect('/dashboard')

  const project = await prisma.project.findFirst({
    where: { id: params.id, userId: user.id },
  })

  if (!project) notFound()

  return <ProjectClient project={project as any} />
}
