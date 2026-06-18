// src/app/api/boq/pre-check/route.ts
// Runs BEFORE pipeline starts — warns user upfront about file quality
import { auth } from '@clerk/nextjs/server'
import { NextRequest, NextResponse } from 'next/server'
import { preUploadCheck, ALLOWED_EXTENSIONS } from '@/lib/engine/file-parser'

export async function POST(req: NextRequest) {
  const { userId } = auth()
  if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { filenames, filesizes } = await req.json()
  if (!filenames?.length) return NextResponse.json({ error: 'No files' }, { status: 400 })

  const result = preUploadCheck(filenames, filesizes || filenames.map(() => 0))

  return NextResponse.json({
    ...result,
    supportedTypes: ALLOWED_EXTENSIONS,
    message: buildMessage(result),
  })
}

function buildMessage(result: ReturnType<typeof preUploadCheck>): string {
  const lines: string[] = []

  if (result.missingDrawingTypes?.length) {
    lines.push(`⚠️ Δεν εντοπίστηκαν ${result.missingDrawingTypes.join(' & ')} σχέδια — οι αντίστοιχες κατηγορίες θα είναι Provisional. Αν έχεις αυτά τα σχέδια, πρόσθεσέ τα πριν συνεχίσεις.`)
  }

  if (result.warning) {
    lines.push(result.warning)
  }

  if (result.isProvisional) {
    lines.push(`🔴 Το BOQ θα βασιστεί κυρίως σε εκτιμήσεις λόγω έλλειψης σχεδίων. Συνιστάται να προσθέσεις PDF ή εικόνες αρχιτεκτονικών σχεδίων.`)
  }

  return lines.join('\n') || '✓ Τα αρχεία φαίνονται κατάλληλα για ανάλυση.'
}
