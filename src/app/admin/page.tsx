// src/app/admin/page.tsx
import { auth } from '@/lib/auth'
import { redirect } from 'next/navigation'
import { prisma } from '@/lib/prisma'
import AdminClient from '@/components/admin/AdminClient'

interface UserWithSub {
  id: string
  email: string
  name: string | null
  createdAt: Date
  subscription: { plan: string; status: string } | null
  _count: { projects: number }
}

export default async function AdminPage() {
  const { userId } = auth()
  if (!userId) redirect('/sign-in')
  if (userId !== process.env.ADMIN_CLERK_USER_ID) redirect('/dashboard')

  const [users, projects, waitlist] = await Promise.all([
    prisma.user.findMany({
      include: { subscription: true, _count: { select: { projects: true } } },
      orderBy: { createdAt: 'desc' },
    }),
    prisma.project.findMany({
      orderBy: { createdAt: 'desc' },
      take: 50,
      include: { user: true },
    }),
    prisma.waitlist.findMany({ orderBy: { createdAt: 'desc' } }),
  ])

  const planRevenue: Record<string, number> = { STARTER: 49, PRO: 99, AGENCY: 179 }
  const mrr = (users as UserWithSub[]).reduce((sum: number, u: UserWithSub) => {
    if (!u.subscription || u.subscription.status !== 'active') return sum
    return sum + (planRevenue[u.subscription.plan] || 0)
  }, 0)

  const stats = {
    totalUsers: users.length,
    activeSubscriptions: (users as UserWithSub[]).filter((u: UserWithSub) => u.subscription?.status === 'active').length,
    mrr,
    totalProjects: await prisma.project.count(),
    waitlistCount: waitlist.length,
    planBreakdown: {
      FREE: (users as UserWithSub[]).filter((u: UserWithSub) => !u.subscription || u.subscription.plan === 'FREE').length,
      STARTER: (users as UserWithSub[]).filter((u: UserWithSub) => u.subscription?.plan === 'STARTER').length,
      PRO: (users as UserWithSub[]).filter((u: UserWithSub) => u.subscription?.plan === 'PRO').length,
      AGENCY: (users as UserWithSub[]).filter((u: UserWithSub) => u.subscription?.plan === 'AGENCY').length,
    },
  }

  return <AdminClient stats={stats} users={users as any} projects={projects as any} waitlist={waitlist} />
}
