import { PrismaClient, Plan, ProjectStatus } from '@prisma/client'
import { buildMockBOQ, MOCK_CLERK_ID, MOCK_USER } from '../src/lib/dev/mock-data'

const prisma = new PrismaClient()

async function main() {
  console.log('🌱 Seeding mock database...')

  const user = await prisma.user.upsert({
    where: { clerkId: MOCK_CLERK_ID },
    create: {
      clerkId: MOCK_CLERK_ID,
      email: MOCK_USER.email,
      name: MOCK_USER.name,
      subscription: {
        create: {
          stripeCustomerId: 'cus_mock_demo',
          stripeSubscriptionId: 'sub_mock_demo',
          stripePriceId: 'price_mock_pro',
          plan: Plan.PRO,
          status: 'active',
          currentPeriodEnd: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
        },
      },
    },
    update: { email: MOCK_USER.email, name: MOCK_USER.name },
    include: { subscription: true },
  })

  const boq = buildMockBOQ('Κατοικία Παπαδόπουλος — Seed')

  const completeProject = await prisma.project.upsert({
    where: { id: 'seed_project_complete' },
    create: {
      id: 'seed_project_complete',
      userId: user.id,
      name: 'Κατοικία Παπαδόπουλος',
      description: 'Seeded demo project with mock BOQ',
      status: ProjectStatus.COMPLETE,
      inputFiles: [`${MOCK_CLERK_ID}/sample-floorplan.pdf`],
      boqData: boq,
      totalAmount: boq.grandTotal,
      versions: {
        create: {
          version: 1,
          boqData: boq,
          totalAmount: boq.grandTotal,
          method: 'hybrid',
          confidence: 'high',
        },
      },
    },
    update: {
      status: ProjectStatus.COMPLETE,
      boqData: boq,
      totalAmount: boq.grandTotal,
    },
  })

  await prisma.project.upsert({
    where: { id: 'seed_project_processing' },
    create: {
      id: 'seed_project_processing',
      userId: user.id,
      name: 'Μεζονέτα Λεμεσού',
      status: ProjectStatus.PROCESSING,
      inputFiles: [`${MOCK_CLERK_ID}/plans.pdf`],
    },
    update: { status: ProjectStatus.PROCESSING },
  })

  await prisma.waitlist.upsert({
    where: { email: 'waitlist@boqnow.local' },
    create: { email: 'waitlist@boqnow.local', company: 'Demo Construction Ltd' },
    update: {},
  })

  await prisma.priceReference.upsert({
    where: { materialGroup_region: { materialGroup: 'concrete_c2530', region: 'cyprus' } },
    create: {
      materialGroup: 'concrete_c2530',
      region: 'cyprus',
      unit: 'm³',
      avgPrice: 195,
      minPrice: 170,
      maxPrice: 220,
      medianPrice: 195,
      weightedAvg: 198,
      sampleCount: 12,
      lastQuoteDate: new Date(),
      confidence: 'high',
    },
    update: { sampleCount: 12 },
  })

  await prisma.auditLog.create({
    data: {
      userId: user.id,
      action: 'LOGIN',
      projectId: completeProject.id,
      metadata: { source: 'seed' },
    },
  })

  console.log(`✅ Seeded user ${user.email} with ${2} projects`)
}

main()
  .catch((e) => {
    console.error(e)
    process.exit(1)
  })
  .finally(() => prisma.$disconnect())
