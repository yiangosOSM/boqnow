// src/app/api/export/excel/route.ts
import { auth } from '@/lib/auth'
import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import type { BOQResult } from '@/lib/types'
import * as XLSX from 'xlsx'

export async function POST(req: NextRequest) {
  const { userId } = auth()
  if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { projectId } = await req.json()

  const user = await prisma.user.findUnique({ where: { clerkId: userId } })
  if (!user) return NextResponse.json({ error: 'User not found' }, { status: 404 })

  const project = await prisma.project.findFirst({
    where: { id: projectId, userId: user.id },
  })
  if (!project || !project.boqData) {
    return NextResponse.json({ error: 'Project not found' }, { status: 404 })
  }

  const boq = project.boqData as unknown as BOQResult
  const wb = XLSX.utils.book_new()

  // ── Sheet 1: Summary ──────────────────────────────────────────
  const summaryRows: any[][] = [
    ['MEASUR — BILL OF QUANTITIES'],
    [],
    ['Έργο:', boq.projectName],
    ['Ημερομηνία:', new Date(boq.generatedAt).toLocaleDateString('el-GR')],
    ['Ακρίβεια AI:', boq.confidence?.toUpperCase()],
    [],
    ['ΚΑΤΗΓΟΡΙΑ', 'ΣΥΝΟΛΟ (€)'],
  ]

  for (const section of boq.sections) {
    summaryRows.push([section.title, section.subtotal])
  }
  summaryRows.push([])
  summaryRows.push(['ΓΕΝΙΚΟ ΣΥΝΟΛΟ', boq.grandTotal])

  const wsSummary = XLSX.utils.aoa_to_sheet(summaryRows)

  // Column widths
  wsSummary['!cols'] = [{ wch: 40 }, { wch: 18 }]

  // Style header
  wsSummary['A1'] = { v: 'MEASUR — BILL OF QUANTITIES', t: 's', s: { font: { bold: true, sz: 14 } } }
  wsSummary['A7'] = { v: 'ΚΑΤΗΓΟΡΙΑ', t: 's', s: { font: { bold: true } } }
  wsSummary['B7'] = { v: 'ΣΥΝΟΛΟ (€)', t: 's', s: { font: { bold: true } } }

  XLSX.utils.book_append_sheet(wb, wsSummary, 'Σύνοψη')

  // ── Sheet 2: Full BOQ ─────────────────────────────────────────
  const boqRows: any[][] = [
    ['Κωδικός', 'Κατηγορία', 'Περιγραφή', 'Μονάδα', 'Ποσότητα', 'Τιμή Μονάδος (€)', 'Σύνολο (€)', 'ΜΕΔΣΚ', 'Σημειώσεις'],
  ]

  for (const section of boq.sections) {
    boqRows.push([section.title, '', '', '', '', '', '', '', ''])
    for (const item of section.items) {
      boqRows.push([
        item.id,
        item.category,
        item.description,
        item.unit,
        item.quantity,
        item.unitPrice,
        item.total,
        item.medskoCode || '',
        item.notes || '',
      ])
    }
    boqRows.push(['', '', `Σύνολο: ${section.title}`, '', '', '', section.subtotal, '', ''])
    boqRows.push([])
  }

  boqRows.push(['', '', 'ΓΕΝΙΚΟ ΣΥΝΟΛΟ', '', '', '', boq.grandTotal, '', ''])

  const wsBoq = XLSX.utils.aoa_to_sheet(boqRows)
  wsBoq['!cols'] = [
    { wch: 10 }, { wch: 18 }, { wch: 45 }, { wch: 8 },
    { wch: 10 }, { wch: 16 }, { wch: 14 }, { wch: 12 }, { wch: 30 },
  ]

  XLSX.utils.book_append_sheet(wb, wsBoq, 'Αναλυτικό BOQ')

  // ── Sheet 3: Per-category sheets ─────────────────────────────
  for (const section of boq.sections) {
    const rows: any[][] = [
      [section.title],
      [],
      ['Κωδικός', 'Περιγραφή', 'Μονάδα', 'Ποσότητα', 'Τιμή (€)', 'Σύνολο (€)'],
    ]
    for (const item of section.items) {
      rows.push([item.id, item.description, item.unit, item.quantity, item.unitPrice, item.total])
    }
    rows.push([])
    rows.push(['', 'ΣΥΝΟΛΟ', '', '', '', section.subtotal])

    const ws = XLSX.utils.aoa_to_sheet(rows)
    ws['!cols'] = [{ wch: 10 }, { wch: 45 }, { wch: 8 }, { wch: 10 }, { wch: 12 }, { wch: 14 }]

    // Truncate sheet name to 31 chars (Excel limit)
    const sheetName = section.title.slice(0, 31)
    XLSX.utils.book_append_sheet(wb, ws, sheetName)
  }

  const buffer = XLSX.write(wb, { type: 'buffer', bookType: 'xlsx' })
  const filename = `BOQ_${boq.projectName.replace(/[^a-zA-Z0-9\u0370-\u03FF]/g, '_')}.xlsx`

  return new NextResponse(buffer, {
    headers: {
      'Content-Type': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      'Content-Disposition': `attachment; filename="${filename}"`,
    },
  })
}
