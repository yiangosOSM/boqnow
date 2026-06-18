// src/app/dashboard/page.tsx
import { auth, currentUser } from '@clerk/nextjs/server'
import { redirect } from 'next/navigation'
import { prisma } from '@/lib/prisma'
import DashboardClient from '@/components/dashboard/DashboardClient'

export default async function DashboardPage() {
  const { userId } = auth()
  if (!userId) redirect('/sign-in')

  // Get real email from Clerk — never use empty string
  const clerkUser = await currentUser()
  const email = clerkUser?.emailAddresses?.[0]?.emailAddress
  if (!email) redirect('/sign-in')

  let user = await prisma.user.findUnique({
    where: { clerkId: userId },
    include: {
      subscription: true,
      projects: { orderBy: { createdAt: 'desc' }, take: 20 },
    },
  })

  // Auto-create user on first login — with real email from Clerk
  if (!user) {
    user = await prisma.user.upsert({
      where: { clerkId: userId },
      create: {
        clerkId: userId,
        email,
        name: [clerkUser.firstName, clerkUser.lastName].filter(Boolean).join(' ') || null,
      },
      update: { email }, // keep email in sync
      include: {
        subscription: true,
        projects: { orderBy: { createdAt: 'desc' }, take: 20 },
      },
    })
  }

  const startOfMonth = new Date()
  startOfMonth.setDate(1); startOfMonth.setHours(0, 0, 0, 0)
  const projectsThisMonth = await prisma.project.count({
    where: { userId: user.id, createdAt: { gte: startOfMonth } },
  })

  return <DashboardClient user={user} projectsThisMonth={projectsThisMonth} />
}
