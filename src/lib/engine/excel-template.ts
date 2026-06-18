// src/lib/engine/excel-template.ts
// Generates a professional MEDSOK-compliant BOQ Excel file
// With proper formatting, assumptions section, and disclaimer

import * as XLSX from 'xlsx'
import type { BOQResult } from '../types'

interface ExcelBOQOptions {
  project: { id: string; name: string; inputFiles: string[] }
  boq: BOQResult & { assumptions?: { included: string[]; excluded: string[]; assumptions_made: string[]; missing_info: string[] }; disclaimer?: string }
  companyName?: string
  region?: 'cyprus' | 'greece'
}

export function generateMEDSOKExcel(opts: ExcelBOQOptions): Buffer {
  const { project, boq, companyName = 'BOQnow', region = 'cyprus' } = opts
  const wb = XLSX.utils.book_new()
  const now = new Date()
  const dateStr = now.toLocaleDateString('el-GR')

  // ── Sheet 1: COVER ────────────────────────────────────────
  const coverRows: any[][] = [
    [],
    ['', 'BILL OF QUANTITIES'],
    ['', 'Κατάλογος Ποσοτήτων & Κοστολόγηση'],
    [],
    ['', 'Έργο:', project.name],
    ['', 'Ημερομηνία:', dateStr],
    ['', 'Περιοχή:', region === 'cyprus' ? 'Κύπρος' : 'Ελλάδα'],
    ['', 'Αρχεία ανάλυσης:', project.inputFiles.join(', ')],
    ['', 'Μέθοδος:', boq.method === 'multi_step_verified' ? '5-Step AI Pipeline + QS Review' : 'AI Generation'],
    ['', 'Ακρίβεια AI:', boq.confidence?.toUpperCase() || 'MEDIUM'],
    ['', 'Σύνολο BOQ:', `€${boq.grandTotal?.toLocaleString('el-GR', { minimumFractionDigits: 2 })}`],
    [],
    ['', 'ΚΑΤΗΓΟΡΙΕΣ ΕΡΓΑΣΙΩΝ', '', 'ΣΥΝΟΛΟ (€)'],
    ...boq.sections.map((s, i) => ['', `${String.fromCharCode(913 + i)}. ${s.title}`, '', s.subtotal]),
    [],
    ['', '', 'ΓΕΝΙΚΟ ΣΥΝΟΛΟ (χωρίς ΦΠΑ)', boq.grandTotal],
    ['', '', 'ΦΠΑ 19%', (boq.grandTotal * 0.19)],
    ['', '', 'ΣΥΝΟΛΟ ΜΕ ΦΠΑ', (boq.grandTotal * 1.19)],
    [],
    [],
    ['', '⚠️ ΣΗΜΑΝΤΙΚΗ ΣΗΜΕΙΩΣΗ'],
    ['', 'Αυτό το BOQ δημιουργήθηκε με AI και αποτελεί εκτίμηση.'],
    ['', 'Απαιτείται επαλήθευση από εξουσιοδοτημένο Quantity Surveyor'],
    ['', 'πριν από οποιαδήποτε επίσημη προσφορά ή σύμβαση.'],
    [],
    ['', `Δημιουργήθηκε από ${companyName} · boqnow.io`],
  ]
  const wsCover = XLSX.utils.aoa_to_sheet(coverRows)
  wsCover['!cols'] = [{ wch: 4 }, { wch: 30 }, { wch: 40 }, { wch: 18 }]
  wsCover['!merges'] = [
    { s: { r: 1, c: 1 }, e: { r: 1, c: 3 } },
    { s: { r: 2, c: 1 }, e: { r: 2, c: 3 } },
  ]
  XLSX.utils.book_append_sheet(wb, wsCover, 'Εξώφυλλο')

  // ── Sheet 2: FULL BOQ ─────────────────────────────────────
  const boqRows: any[][] = [
    ['Κωδικός ΜΕΔΣΚ', 'Κατηγορία', 'Περιγραφή Εργασίας', 'Μονάδα', 'Ποσότητα', 'Τιμή Μονάδος (€)', 'Σύνολο (€)', 'Βεβαιότητα', 'Provisional', 'Σημειώσεις'],
  ]

  for (const section of boq.sections) {
    boqRows.push([]) // blank row
    boqRows.push([(section as any).medskoCode || '', section.title, '', '', '', '', '', '', '', ''])

    for (const item of section.items) {
      boqRows.push([
        (item as any).medskoCode || item.id || '',
        section.title,
        item.description,
        item.unit,
        item.quantity,
        item.unitPrice,
        item.total,
        (item as any).confidence || 'medium',
        (item as any).isProvisional ? 'ΝΑΙ' : '',
        item.notes || '',
      ])
    }

    boqRows.push(['', `ΣΥΝΟΛΟ: ${section.title}`, '', '', '', '', section.subtotal, '', '', ''])
  }

  boqRows.push([])
  boqRows.push(['', '', '', '', '', 'ΓΕΝΙΚΟ ΣΥΝΟΛΟ', boq.grandTotal, '', '', ''])
  boqRows.push(['', '', '', '', '', 'ΦΠΑ 19%', boq.grandTotal * 0.19, '', '', ''])
  boqRows.push(['', '', '', '', '', 'ΣΥΝΟΛΟ ΜΕ ΦΠΑ', boq.grandTotal * 1.19, '', '', ''])

  const wsBOQ = XLSX.utils.aoa_to_sheet(boqRows)
  wsBOQ['!cols'] = [
    { wch: 12 }, { wch: 20 }, { wch: 45 }, { wch: 8 },
    { wch: 10 }, { wch: 16 }, { wch: 14 }, { wch: 12 }, { wch: 12 }, { wch: 30 },
  ]
  XLSX.utils.book_append_sheet(wb, wsBOQ, 'Αναλυτικό BOQ')

  // ── Sheet 3: Per-category sheets ─────────────────────────
  for (const section of boq.sections) {
    const rows: any[][] = [
      [section.title],
      [],
      ['Κωδ.', 'Περιγραφή', 'Μον.', 'Ποσ.', 'Τιμή (€)', 'Σύνολο (€)', 'Βεβαιότητα', 'Σημ.'],
    ]
    for (const item of section.items) {
      rows.push([item.id || '', item.description, item.unit, item.quantity, item.unitPrice, item.total, (item as any).confidence || '', item.notes || ''])
    }
    rows.push([])
    rows.push(['', 'ΣΥΝΟΛΟ', '', '', '', section.subtotal, '', ''])

    const ws = XLSX.utils.aoa_to_sheet(rows)
    ws['!cols'] = [{ wch: 10 }, { wch: 45 }, { wch: 8 }, { wch: 10 }, { wch: 12 }, { wch: 14 }, { wch: 12 }, { wch: 30 }]
    XLSX.utils.book_append_sheet(wb, ws, section.title.slice(0, 31))
  }

  // ── Sheet 4: ASSUMPTIONS & EXCLUSIONS ────────────────────
  const assumptionsRows: any[][] = [
    ['ASSUMPTIONS & EXCLUSIONS'],
    [],
    ['Έργο:', project.name],
    ['Ημερομηνία:', dateStr],
    [],
  ]

  if (boq.assumptions) {
    assumptionsRows.push(['ΣΥΜΠΕΡΙΛΑΜΒΑΝΕΤΑΙ:', '', ''])
    boq.assumptions.included?.forEach(i => assumptionsRows.push(['✓', i, '']))
    assumptionsRows.push([])

    assumptionsRows.push(['ΔΕΝ ΣΥΜΠΕΡΙΛΑΜΒΑΝΕΤΑΙ:', '', ''])
    boq.assumptions.excluded?.forEach(e => assumptionsRows.push(['✗', e, '']))
    assumptionsRows.push([])

    assumptionsRows.push(['ASSUMPTIONS ΠΟΥ ΕΓΙΝΑΝ:', '', ''])
    boq.assumptions.assumptions_made?.forEach(a => assumptionsRows.push(['→', a, '']))
    assumptionsRows.push([])

    assumptionsRows.push(['ΕΛΛΕΙΠΟΥΣΕΣ ΠΛΗΡΟΦΟΡΙΕΣ:', '', ''])
    boq.assumptions.missing_info?.forEach(m => assumptionsRows.push(['!', m, '']))
    assumptionsRows.push([])
  }

  assumptionsRows.push(['ΑΠΟΠΟΙΗΣΗ ΕΥΘΥΝΗΣ:'])
  assumptionsRows.push(['', boq.disclaimer || 'Αυτό το BOQ δημιουργήθηκε αυτόματα με AI. Απαιτείται επαλήθευση από εξουσιοδοτημένο QS.'])
  assumptionsRows.push([])
  assumptionsRows.push(['', `Δημιουργήθηκε: ${new Date().toLocaleString('el-GR')} | ${companyName}`])

  const wsAssumptions = XLSX.utils.aoa_to_sheet(assumptionsRows)
  wsAssumptions['!cols'] = [{ wch: 28 }, { wch: 60 }, { wch: 20 }]
  XLSX.utils.book_append_sheet(wb, wsAssumptions, 'Assumptions & Exclusions')

  return XLSX.write(wb, { type: 'buffer', bookType: 'xlsx' }) as Buffer
}
