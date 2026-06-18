'use client'
// src/components/dashboard/ProjectClient.tsx
import { useState } from 'react'
import Link from 'next/link'
import { ArrowLeft, Download, ChevronDown, ChevronUp, FileSpreadsheet, FileText } from 'lucide-react'

import type { BOQResult, BOQSection, BOQItem } from '@/lib/types'

export default function ProjectClient({ project }: { project: { id: string; name: string; createdAt: Date; inputFiles: string[]; boqData: BOQResult | null } }) {
  const boq = project.boqData
  const [expanded, setExpanded] = useState<Set<string>>(new Set())

  const toggle = (title: string) => setExpanded(prev => {
    const next = new Set(prev)
    next.has(title) ? next.delete(title) : next.add(title)
    return next
  })

  const downloadExcel = async () => {
    const res = await fetch('/api/export/excel', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ projectId: project.id }),
    })
    const blob = await res.blob()
    const a = document.createElement('a')
    a.href = URL.createObjectURL(blob)
    a.download = `BOQ_${project.name.replace(/\s/g, '_')}.xlsx`
    a.click()
  }

  const openPDF = async () => {
    const res = await fetch('/api/export/pdf', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ projectId: project.id }),
    })
    const html = await res.text()
    const win = window.open('', '_blank')
    if (win) { win.document.write(html); win.document.close(); win.print() }
  }

  const downloadCSV = () => {
    if (!boq) return
    const rows = ['Κωδικός,Περιγραφή,Μονάδα,Ποσότητα,Τιμή,Σύνολο']
    boq.sections?.forEach((s: any) => {
      rows.push(`\n## ${s.title}`)
      s.items?.forEach((i: any) => rows.push(`${i.id},"${i.description}",${i.unit},${i.quantity},${i.unitPrice},${i.total}`))
    })
    rows.push(`\nΣΥΝΟΛΟ,,,,,${boq.grandTotal}`)
    const blob = new Blob([rows.join('\n')], { type: 'text/csv;charset=utf-8;' })
    const a = document.createElement('a'); a.href = URL.createObjectURL(blob)
    a.download = `BOQ_${project.name.replace(/\s/g, '_')}.csv`; a.click()
  }

  if (!boq) {
    return (
      <div style={{ minHeight: '100vh', background: '#FAFAFA', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <div style={{ textAlign: 'center' }}>
          <p style={{ color: '#9A9A9A', marginBottom: 16 }}>Το BOQ δεν είναι διαθέσιμο ακόμα.</p>
          <Link href="/dashboard" style={{ color: '#0A0A0A', fontSize: 14 }}>← Πίσω στο dashboard</Link>
        </div>
      </div>
    )
  }

  return (
    <div style={{ minHeight: '100vh', background: '#FAFAFA', fontFamily: 'Inter, sans-serif' }}>
      <header style={{ background: '#0A0A0A', padding: '0 32px', height: 56, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <Link href="/dashboard" style={{ display: 'flex', alignItems: 'center', gap: 8, color: '#9A9A9A', textDecoration: 'none', fontSize: 14 }}>
          <ArrowLeft size={16} /> Dashboard
        </Link>
        <span style={{ fontFamily: 'Georgia, serif', fontSize: 18, color: '#FAFAFA' }}>BOQNOW</span>
      </header>

      <div style={{ maxWidth: 900, margin: '0 auto', padding: '40px 24px' }}>
        {/* Header */}
        <div style={{ marginBottom: 32 }}>
          <h1 style={{ fontFamily: 'Georgia, serif', fontSize: 26, color: '#0A0A0A', marginBottom: 6 }}>{project.name}</h1>
          <div style={{ display: 'flex', gap: 16, alignItems: 'center', flexWrap: 'wrap' }}>
            <span style={{ fontSize: 13, color: '#9A9A9A' }}>
              {new Date(project.createdAt).toLocaleDateString('el-GR', { day: 'numeric', month: 'long', year: 'numeric' })}
            </span>
            <span style={{ fontSize: 13, color: '#9A9A9A' }}>{project.inputFiles?.length || 0} αρχεία</span>
            <span style={{
              fontSize: 11, fontWeight: 600, padding: '2px 8px', borderRadius: 10, textTransform: 'uppercase',
              background: boq.confidence === 'high' ? '#E6F4ED' : boq.confidence === 'medium' ? '#FFF8E6' : '#FFF0F0',
              color: boq.confidence === 'high' ? '#1A7A4A' : boq.confidence === 'medium' ? '#B8860B' : '#CC0000',
            }}>
              {boq.confidence === 'high' ? 'Υψηλή ακρίβεια' : boq.confidence === 'medium' ? 'Μέτρια ακρίβεια' : 'Χαμηλή ακρίβεια'}
            </span>
          </div>
        </div>

        {/* Export buttons */}
        <div style={{ display: 'flex', gap: 8, marginBottom: 28, flexWrap: 'wrap' }}>
          {[
            { label: 'Excel', icon: <FileSpreadsheet size={14} />, fn: downloadExcel },
            { label: 'PDF', icon: <FileText size={14} />, fn: openPDF },
            { label: 'CSV', icon: <Download size={14} />, fn: downloadCSV },
          ].map(({ label, icon, fn }) => (
            <button key={label} onClick={fn} style={{
              display: 'flex', alignItems: 'center', gap: 6, padding: '8px 16px',
              background: label === 'Excel' ? '#0A0A0A' : '#fff',
              color: label === 'Excel' ? '#FAFAFA' : '#0A0A0A',
              border: '1px solid #E0E0E0', borderRadius: 6, fontSize: 13, cursor: 'pointer',
            }}>
              {icon} {label}
            </button>
          ))}
        </div>

        {/* BOQ Sections */}
        <div style={{ background: '#fff', border: '1px solid #E0E0E0', borderRadius: 8, overflow: 'hidden', marginBottom: 24 }}>
          {boq.sections?.map((section: BOQSection) => (
            <div key={section.title} style={{ borderBottom: '1px solid #F0F0F0' }}>
              <button onClick={() => toggle(section.title)} style={{
                width: '100%', padding: '14px 20px', background: '#F8F8F8',
                border: 'none', cursor: 'pointer', display: 'flex', justifyContent: 'space-between', alignItems: 'center',
              }}>
                <span style={{ fontWeight: 600, fontSize: 14 }}>{section.title}</span>
                <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                  <span style={{ fontFamily: 'Georgia, serif', fontSize: 15 }}>
                    €{section.subtotal.toLocaleString('el-GR', { minimumFractionDigits: 2 })}
                  </span>
                  {expanded.has(section.title) ? <ChevronUp size={15} /> : <ChevronDown size={15} />}
                </div>
              </button>

              {expanded.has(section.title) && (
                <div style={{ overflowX: 'auto' }}>
                  <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
                    <thead>
                      <tr style={{ background: '#F0F0F0' }}>
                        {['Κωδ.', 'Περιγραφή', 'Μον.', 'Ποσ.', 'Τιμή/μον.', 'Σύνολο'].map(h => (
                          <th key={h} style={{ padding: '8px 14px', textAlign: h === 'Περιγραφή' ? 'left' : 'right', fontWeight: 500, color: '#5A5A5A', whiteSpace: 'nowrap' }}>{h}</th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {section.items?.map((item: BOQItem, i: number) => (
                        <tr key={item.id} style={{ borderTop: '1px solid #F0F0F0', background: i % 2 === 0 ? '#fff' : '#FAFAFA' }}>
                          <td style={{ padding: '8px 14px', color: '#9A9A9A', fontSize: 11 }}>{item.id}</td>
                          <td style={{ padding: '8px 14px' }}>
                            {item.description}
                            {item.notes && <span style={{ display: 'block', fontSize: 11, color: '#9A9A9A', marginTop: 2 }}>{item.notes}</span>}
                            {item.medskoCode && <span style={{ display: 'inline-block', fontSize: 10, color: '#1A7A4A', background: '#E6F4ED', padding: '1px 5px', borderRadius: 3, marginTop: 3 }}>{item.medskoCode}</span>}
                          </td>
                          <td style={{ padding: '8px 14px', textAlign: 'right', color: '#5A5A5A' }}>{item.unit}</td>
                          <td style={{ padding: '8px 14px', textAlign: 'right' }}>{item.quantity?.toFixed(2)}</td>
                          <td style={{ padding: '8px 14px', textAlign: 'right' }}>€{item.unitPrice?.toFixed(2)}</td>
                          <td style={{ padding: '8px 14px', textAlign: 'right', fontWeight: 600 }}>€{item.total?.toLocaleString('el-GR', { minimumFractionDigits: 2 })}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          ))}
        </div>

        {/* Grand total */}
        <div style={{ padding: '18px 24px', background: '#0A0A0A', borderRadius: 8, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <span style={{ color: '#FAFAFA', fontWeight: 600, fontSize: 15 }}>Γενικό Σύνολο Έργου</span>
          <span style={{ color: '#FAFAFA', fontFamily: 'Georgia, serif', fontSize: 28 }}>
            €{boq.grandTotal?.toLocaleString('el-GR', { minimumFractionDigits: 2 })}
          </span>
        </div>


        {/* QS Disclaimer */}
        <div style={{ marginTop: 16, padding: '14px 20px', background: '#F8F0F0', border: '1px solid #E8D0D0', borderRadius: 8, fontSize: 12, color: '#8B4444', lineHeight: 1.7 }}>
          <strong>Αποποίηση ευθύνης BOQNOW:</strong> Το παρόν Bill of Quantities παρήχθη αυτόματα από το σύστημα BOQNOW βάσει των ανεβασμένων αρχιτεκτονικών σχεδίων.
          Αποτελεί εκτίμηση αναφοράς και <strong>ΔΕΝ αντικαθιστά</strong> επαγγελματικό Δελτίο Ποσοτήτων εκδοθέν από πιστοποιημένο Ποσομετρητή (QS).
          Όλες οι τιμές είναι χωρίς ΦΠΑ. Απαιτείται επαλήθευση από εξουσιοδοτημένο QS πριν από χρήση σε επίσημη προσφορά, διαγωνισμό ή σύμβαση.
          Η BOQNOW δεν φέρει ευθύνη για αποκλίσεις μεταξύ του εκτιμώμενου και του πραγματικού κόστους.
        </div>

        {boq.analysisNotes && (
          <div style={{ marginTop: 12, padding: '14px 18px', background: '#FFF8E6', border: '1px solid #FFE0A0', borderRadius: 6, fontSize: 13, color: '#7A5A00' }}>
            <strong>Σημειώσεις AI:</strong> {boq.analysisNotes}
          </div>
        )}

        {/* Feedback Widget */}
        <BOQFeedback projectId={project.id} />

        {/* Footer branding */}
        <div style={{ marginTop: 24, textAlign: 'center', fontSize: 11, color: '#C0C0C0' }}>
          Παράχθηκε από <strong style={{ color: '#9A9A9A' }}>BOQNOW</strong> · boqnow.com · {new Date().toLocaleDateString('el-GR')}
        </div>

      </div>
    </div>
  )
}

// ── BOQNOW Feedback Widget ────────────────────────────────────
export function BOQFeedback({ projectId }: { projectId: string }) {
  const [rating, setRating] = useState<number | null>(null)
  const [comment, setComment] = useState('')
  const [submitted, setSubmitted] = useState(false)
  const [loading, setLoading] = useState(false)

  const submit = async () => {
    if (!rating) return
    setLoading(true)
    await fetch('/api/boq/feedback', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ projectId, rating, comment }),
    })
    setLoading(false)
    setSubmitted(true)
  }

  if (submitted) {
    return (
      <div style={{ marginTop: 32, padding: '20px 24px', background: '#F0F8F4', border: '1px solid #B8DFC8', borderRadius: 8, textAlign: 'center' }}>
        <span style={{ fontSize: 20 }}>✓</span>
        <p style={{ fontSize: 14, color: '#1A7A4A', marginTop: 6 }}>Ευχαριστούμε για την αξιολόγησή σου. Μας βοηθάς να βελτιωθούμε.</p>
      </div>
    )
  }

  return (
    <div style={{ marginTop: 32, padding: '24px', border: '1px solid #E8E8E8', borderRadius: 8, background: '#fff' }}>
      <h3 style={{ fontSize: 14, fontWeight: 600, marginBottom: 4, color: '#0A0A0A' }}>Πόσο ακριβές ήταν το BOQ;</h3>
      <p style={{ fontSize: 12, color: '#9A9A9A', marginBottom: 16 }}>Η αξιολόγησή σου βοηθά να βελτιώσουμε την ακρίβεια για όλους τους εργολάβους.</p>
      <div style={{ display: 'flex', gap: 8, marginBottom: 16 }}>
        {[1, 2, 3, 4, 5].map(n => (
          <button
            key={n}
            onClick={() => setRating(n)}
            style={{
              width: 44, height: 44, borderRadius: 8, border: '1px solid',
              borderColor: rating === n ? '#0A0A0A' : '#E0E0E0',
              background: rating === n ? '#0A0A0A' : '#fff',
              color: rating === n ? '#FAFAFA' : '#5A5A5A',
              fontSize: 16, cursor: 'pointer', fontWeight: 600,
            }}
          >
            {['😞', '😕', '😐', '😊', '😄'][n - 1]}
          </button>
        ))}
        <span style={{ fontSize: 12, color: '#9A9A9A', alignSelf: 'center', marginLeft: 4 }}>
          {rating ? ['Πολύ ανακριβές', 'Ανακριβές', 'Μέτριο', 'Ακριβές', 'Πολύ ακριβές'][rating - 1] : ''}
        </span>
      </div>
      {rating && rating <= 3 && (
        <textarea
          value={comment}
          onChange={e => setComment(e.target.value)}
          placeholder="Πού εντόπισες αποκλίσεις; (προαιρετικό)"
          rows={3}
          style={{ width: '100%', border: '1px solid #E0E0E0', borderRadius: 6, padding: '10px 12px', fontSize: 13, fontFamily: 'Inter, sans-serif', resize: 'vertical', marginBottom: 12, boxSizing: 'border-box' }}
        />
      )}
      <button
        onClick={submit}
        disabled={!rating || loading}
        style={{
          padding: '10px 20px', background: rating ? '#0A0A0A' : '#E0E0E0',
          color: rating ? '#FAFAFA' : '#9A9A9A', border: 'none', borderRadius: 6,
          fontSize: 13, fontWeight: 600, cursor: rating ? 'pointer' : 'not-allowed',
        }}
      >
        {loading ? 'Αποστολή...' : 'Υποβολή αξιολόγησης'}
      </button>
    </div>
  )
}
