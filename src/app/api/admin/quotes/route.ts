// src/app/api/admin/quotes/route.ts
// Admin-only: upload + list historical quotes
import { auth } from '@/lib/auth'
import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { prisma } from '@/lib/prisma'
import { extractQuoteLineItems } from '@/lib/engine/quote-extractor'

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

function isAdmin(userId: string) {
  return userId === process.env.ADMIN_CLERK_USER_ID
}

// GET — list all quotes + stats
export async function GET(req: NextRequest) {
  const { userId } = auth()
  if (!userId || !isAdmin(userId)) return NextResponse.json({ error: 'Forbidden' }, { status: 403 })

  const [quotes, priceRefs, totalItems] = await Promise.all([
    prisma.historicalQuote.findMany({
      include: { _count: { select: { lineItems: true } } },
      orderBy: { createdAt: 'desc' },
      take: 100,
    }),
    prisma.priceReference.findMany({ orderBy: { sampleCount: 'desc' } }),
    prisma.priceLineItem.count(),
  ])

  return NextResponse.json({ quotes, priceRefs, totalItems })
}

// POST — upload quote file + trigger extraction
export async function POST(req: NextRequest) {
  const { userId } = auth()
  if (!userId || !isAdmin(userId)) return NextResponse.json({ error: 'Forbidden' }, { status: 403 })

  const body = await req.json()
  const { filename, storagePath, fileType, projectDate, projectType, region, scope } = body

  if (!filename || !storagePath || !projectDate) {
    return NextResponse.json({ error: 'Missing required fields' }, { status: 400 })
  }

  // Create quote record
  const quote = await prisma.historicalQuote.create({
    data: {
      uploadedBy: userId,
      filename,
      storagePath,
      fileType: fileType || 'pdf',
      projectDate: new Date(projectDate),
      projectType: projectType || 'house',
      region: region || 'cyprus',
      scope: scope === 'PERSONAL' ? 'PERSONAL' : 'SHARED',
      status: 'PENDING',
    }
  })

  // Download and prepare for AI extraction (async — don't await)
  triggerExtraction(quote.id, storagePath).catch(console.error)

  return NextResponse.json({ success: true, quoteId: quote.id, status: 'PENDING' })
}

// DELETE — remove quote + its line items + recompute
export async function DELETE(req: NextRequest) {
  const { userId } = auth()
  if (!userId || !isAdmin(userId)) return NextResponse.json({ error: 'Forbidden' }, { status: 403 })

  const { quoteId } = await req.json()
  if (!quoteId) return NextResponse.json({ error: 'Missing quoteId' }, { status: 400 })

  await prisma.historicalQuote.delete({ where: { id: quoteId } })

  // Recompute after deletion
  const { recomputeAllPriceReferences } = await import('@/lib/engine/price-engine')
  await recomputeAllPriceReferences()

  return NextResponse.json({ success: true })
}

// ── Background extraction ─────────────────────────────────────
async function triggerExtraction(quoteId: string, storagePath: string) {
  // Download file from Supabase
  const { data, error } = await supabaseAdmin.storage
    .from('historical-quotes')
    .download(storagePath)

  if (error || !data) {
    await prisma.historicalQuote.update({
      where: { id: quoteId },
      data: { status: 'FAILED', extractionNotes: 'Αδυναμία λήψης αρχείου' }
    })
    return
  }

  const buffer = Buffer.from(await data.arrayBuffer())
  const filename = storagePath.split('/').pop() || ''
  const ext = filename.split('.').pop()?.toLowerCase() || ''

  // Prepare content for Claude
  const Anthropic = (await import('@anthropic-ai/sdk')).default
  const fileContent: any[] = []

  if (ext === 'pdf') {
    fileContent.push({ type: 'document', source: { type: 'base64', media_type: 'application/pdf', data: buffer.toString('base64') } })
  } else if (['xlsx','xls'].includes(ext)) {
    const { parseExcel } = await import('@/lib/engine/file-parser')
    const parsed = parseExcel(buffer, filename)
    fileContent.push({ type: 'text', text: parsed.text })
  } else if (ext === 'docx') {
    const { parseWord } = await import('@/lib/engine/file-parser')
    const parsed = await parseWord(buffer, filename)
    fileContent.push({ type: 'text', text: parsed.text })
  } else {
    fileContent.push({ type: 'text', text: `[${filename}: unsupported format for extraction]` })
  }

  fileContent.push({ type: 'text', text: 'Εξήγαγε όλα τα line items με τιμές από αυτή την προσφορά.' })

  await extractQuoteLineItems(quoteId, fileContent)
}
