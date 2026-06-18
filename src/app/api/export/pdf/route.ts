// src/app/api/export/pdf/route.ts
// Generates real PDF using Puppeteer + @sparticuz/chromium (Vercel compatible)

import { auth } from '@clerk/nextjs/server'
import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

// Build the HTML for the BOQ

// ── HTML escape to prevent injection ─────────────────────────
function esc(str: unknown): string {
  return String(str ?? '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#x27;')
}

function buildBOQHtml(boq: any, project: any): string {
  return `<!DOCTYPE html>
<html lang="el">
<head>
<meta charset="UTF-8">
<style>
  * { box-sizing: border-box; margin: 0; padding: 0; }
  body { font-family: Arial, sans-serif; font-size: 10pt; color: #0A0A0A; padding: 15mm 20mm; }
  .header { display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 20px; padding-bottom: 12px; border-bottom: 2px solid #0A0A0A; }
  .logo { font-family: Georgia, serif; font-size: 20pt; }
  .meta { text-align: right; font-size: 9pt; color: #5A5A5A; }
  .meta strong { color: #0A0A0A; display: block; font-size: 12pt; margin-bottom: 4px; }
  .confidence { display: inline-block; padding: 2px 7px; border-radius: 8px; font-size: 8pt; font-weight: bold; text-transform: uppercase;
    background: ${boq.confidence === 'high' ? '#E6F4ED' : boq.confidence === 'medium' ? '#FFF8E6' : '#FFF0F0'};
    color: ${boq.confidence === 'high' ? '#1A7A4A' : boq.confidence === 'medium' ? '#B8860B' : '#CC0000'}; }
  .section { margin-bottom: 16px; page-break-inside: avoid; }
  .section-title { background: #0A0A0A; color: #FAFAFA; padding: 5px 10px; font-weight: bold; font-size: 10pt; }
  table { width: 100%; border-collapse: collapse; font-size: 8.5pt; }
  th { background: #F0F0F0; padding: 5px 8px; text-align: left; font-weight: 600; border-bottom: 1px solid #E0E0E0; }
  th.r { text-align: right; }
  td { padding: 4px 8px; border-bottom: 1px solid #F8F8F8; vertical-align: top; }
  td.r { text-align: right; }
  tr:nth-child(even) td { background: #FAFAFA; }
  .subtotal td { background: #F0F0F0 !important; font-weight: bold; border-top: 1px solid #E0E0E0; }
  .grand-total { background: #0A0A0A; color: #FAFAFA; padding: 10px 14px; display: flex; justify-content: space-between; margin-top: 20px; }
  .grand-total .amount { font-family: Georgia, serif; font-size: 16pt; }
  .footer { margin-top: 24px; padding-top: 10px; border-top: 1px solid #E0E0E0; font-size: 7.5pt; color: #9A9A9A; text-align: center; }
</style>
</head>
<body>
  <div class="header">
    <div class="logo">BOQNOW</div>
    <div class="meta">
      <strong>${esc(boq.projectName)}</strong>
      Ημερομηνία: ${new Date(boq.generatedAt).toLocaleDateString('el-GR')}<br>
      Αρχεία: ${project.inputFiles?.length ?? 0}<br><br>
      <span class="confidence">Ακρίβεια: ${esc(boq.confidence)}</span>
    </div>
  </div>

  ${boq.sections.map((section: any) => `
  <div class="section">
    <div class="section-title">${esc(section.title)}</div>
    <table>
      <thead><tr>
        <th style="width:7%">Κωδ.</th>
        <th style="width:40%">Περιγραφή</th>
        <th class="r" style="width:6%">Μον.</th>
        <th class="r" style="width:8%">Ποσ.</th>
        <th class="r" style="width:12%">Τιμή (€)</th>
        <th class="r" style="width:12%">Σύνολο (€)</th>
        <th style="width:8%">ΜΕΔΣΚ</th>
      </tr></thead>
      <tbody>
        ${section.items.map((item: any) => `
        <tr>
          <td style="color:#9A9A9A;font-size:7.5pt">${esc(item.id)}</td>
          <td>${esc(item.description)}${item.notes ? `<br><span style="color:#9A9A9A;font-size:7.5pt">${esc(item.notes)}</span>` : ''}</td>
          <td class="r">${esc(item.unit)}</td>
          <td class="r">${Number(item.quantity).toFixed(2)}</td>
          <td class="r">${Number(item.unitPrice).toFixed(2)}</td>
          <td class="r" style="font-weight:500">${Number(item.total).toLocaleString('el-GR', { minimumFractionDigits: 2 })}</td>
          <td style="font-size:7.5pt;color:#5A5A5A">${item.medskoCode || ''}</td>
        </tr>`).join('')}
        <tr class="subtotal">
          <td colspan="5" style="text-align:right">Σύνολο ${esc(section.title)}</td>
          <td class="r">€${Number(section.subtotal).toLocaleString('el-GR', { minimumFractionDigits: 2 })}</td>
          <td></td>
        </tr>
      </tbody>
    </table>
  </div>`).join('')}

  <div class="grand-total">
    <span>ΓΕΝΙΚΟ ΣΥΝΟΛΟ ΕΡΓΟΥ</span>
    <span class="amount">€${Number(boq.grandTotal).toLocaleString('el-GR', { minimumFractionDigits: 2 })}</span>
  </div>

  <div class="footer">
    Δημιουργήθηκε από BOQNOW AI BOQ Generator · boqnow.com · ${new Date().toLocaleDateString('el-GR')}<br>
    Αυτό το BOQ δημιουργήθηκε αυτόματα. Συνιστάται επαλήθευση από εξουσιοδοτημένο QS πριν τη χρήση σε επίσημες προσφορές.
  </div>
</body></html>`
}

export async function POST(req: NextRequest) {
  try {
    const { userId } = auth()
    if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const { projectId } = await req.json()
    const user = await prisma.user.findUnique({ where: { clerkId: userId } })
    if (!user) return NextResponse.json({ error: 'User not found' }, { status: 404 })

    const project = await prisma.project.findFirst({
      where: { id: projectId, userId: user.id },
    })
    if (!project?.boqData) return NextResponse.json({ error: 'Project not found' }, { status: 404 })

    const boq = project.boqData as any
    const html = buildBOQHtml(boq, project)

    // Use Puppeteer with @sparticuz/chromium (works on Vercel)
    let browser = null
    try {
      const chromium = await import('@sparticuz/chromium')
      const puppeteer = await import('puppeteer-core')

      browser = await puppeteer.default.launch({
        args: chromium.default.args,
        defaultViewport: chromium.default.defaultViewport,
        executablePath: await chromium.default.executablePath(),
        headless: true,
      })

      const page = await browser.newPage()
      await page.setContent(html, { waitUntil: 'networkidle0' })

      const pdfBuffer = await page.pdf({
        format: 'A3',
        landscape: true,
        printBackground: true,
        margin: { top: '10mm', right: '10mm', bottom: '10mm', left: '10mm' },
      })

      const filename = `BOQ_${project.name.replace(/[^a-zA-Z0-9\u0370-\u03FF]/g, '_')}.pdf`

      return new NextResponse(pdfBuffer as unknown as BodyInit, {
        headers: {
          'Content-Type': 'application/pdf',
          'Content-Disposition': `attachment; filename="${filename}"`,
        },
      })
    } finally {
      if (browser) await browser.close()
    }
  } catch (error) {
    console.error('PDF export error:', error)
    return NextResponse.json({ error: 'PDF generation failed' }, { status: 500 })
  }
}
