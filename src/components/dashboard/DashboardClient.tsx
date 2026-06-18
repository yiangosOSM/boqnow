'use client'
// src/components/dashboard/DashboardClient.tsx
import { useState, useRef } from 'react'
import { UserButton } from '@clerk/nextjs'
import type { BOQResult } from '@/lib/boq-generator'
import { Upload, FileText, Download, ChevronDown, ChevronUp, Zap, Clock, CheckCircle } from 'lucide-react'
import UsageBanner from './UsageBanner'


interface Project {
  id: string
  name: string
  status: string
  totalAmount: number | null
  createdAt: Date
  inputFiles: string[]
  boqData: import('@/lib/types').BOQResult | null
}

interface DashboardClientProps {
  projectsThisMonth: number
  user: {
    subscription: { plan: string; status: string; currentPeriodEnd: Date | null } | null
    projects: Project[]
  }
}

const PLAN_LABELS: Record<string, string> = {
  FREE: 'Free (2 projects/μήνα)',
  STARTER: 'Starter — €49/μήνα',
  PRO: 'Pro — €99/μήνα',
  AGENCY: 'Agency — €179/μήνα',
}

export default function DashboardClient({ user, projectsThisMonth }: DashboardClientProps) {
  const [file, setFile] = useState<File | null>(null)
  const [projectName, setProjectName] = useState('')
  const [loading, setLoading] = useState(false)
  const [result, setResult] = useState<BOQResult | null>(null)
  const [error, setError] = useState('')
  const [expandedSections, setExpandedSections] = useState<Set<string>>(new Set())
  const fileRef = useRef<HTMLInputElement>(null)

  const plan = user.subscription?.plan || 'FREE'

  const handleGenerate = async () => {
    if (!file || !projectName.trim()) return
    setLoading(true)
    setError('')
    setResult(null)

    try {
      const formData = new FormData()
      formData.append('file', file)
      formData.append('projectName', projectName)

      const res = await fetch('/api/boq/generate', { method: 'POST', body: formData })
      const data = await res.json()

      if (!res.ok) throw new Error(data.error || 'Σφάλμα κατά τη δημιουργία BOQ')
      setResult(data.boq)
    } catch (e: any) {
      setError(e.message)
    } finally {
      setLoading(false)
    }
  }

  const toggleSection = (title: string) => {
    setExpandedSections(prev => {
      const next = new Set(prev)
      next.has(title) ? next.delete(title) : next.add(title)
      return next
    })
  }

  const downloadCSV = () => {
    if (!result) return
    const rows = ['Κωδικός,Περιγραφή,Μονάδα,Ποσότητα,Τιμή Μονάδος,Σύνολο']
    result.sections.forEach(s => {
      rows.push(`\n## ${s.title}`)
      s.items.forEach(i => {
        rows.push(`${i.id},"${i.description}",${i.unit},${i.quantity},${i.unitPrice},${i.total}`)
      })
    })
    rows.push(`\nΣΥΝΟΛΟ,,,,, ${result.grandTotal.toFixed(2)}`)
    const blob = new Blob([rows.join('\n')], { type: 'text/csv;charset=utf-8;' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `BOQ_${result.projectName.replace(/\s/g, '_')}.csv`
    a.click()
  }

  return (
    <div style={{ minHeight: '100vh', background: '#FAFAFA', fontFamily: 'Inter, sans-serif' }}>
      {/* Header */}
      <header style={{ background: '#0A0A0A', padding: '0 32px', height: 56, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <span style={{ color: '#FAFAFA', fontFamily: 'Georgia, serif', fontSize: 20, letterSpacing: '-0.5px' }}>BOQNOW</span>
        <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
          <span style={{ color: '#9A9A9A', fontSize: 13 }}>{PLAN_LABELS[plan]}</span>
          <UserButton afterSignOutUrl="/" />
        </div>
      </header>

      <div style={{ maxWidth: 900, margin: '0 auto', padding: '40px 24px' }}>
        {/* New BOQ */}
        <div style={{ background: '#fff', border: '1px solid #E0E0E0', borderRadius: 8, padding: 32, marginBottom: 32 }}>
          <h2 style={{ fontFamily: 'Georgia, serif', fontSize: 22, marginBottom: 16, color: '#0A0A0A' }}>
            Νέο BOQ
          </h2>
          <UsageBanner plan={plan} projectsThisMonth={projectsThisMonth} />

          <div style={{ marginBottom: 16 }}>
            <label style={{ display: 'block', fontSize: 13, color: '#5A5A5A', marginBottom: 6 }}>Όνομα Έργου</label>
            <input
              type="text"
              value={projectName}
              onChange={e => setProjectName(e.target.value)}
              placeholder="π.χ. Κατοικία Παπαδόπουλος — Λεμεσός"
              style={{ width: '100%', padding: '10px 14px', border: '1px solid #E0E0E0', borderRadius: 6, fontSize: 14, outline: 'none' }}
            />
          </div>

          <div
            onClick={() => fileRef.current?.click()}
            style={{
              border: '2px dashed #E0E0E0',
              borderRadius: 8,
              padding: 32,
              textAlign: 'center',
              cursor: 'pointer',
              marginBottom: 16,
              background: file ? '#F8FFF8' : '#F8F8F8',
              transition: 'all 0.2s',
            }}
          >
            <Upload size={24} color={file ? '#1A7A4A' : '#9A9A9A'} style={{ margin: '0 auto 8px' }} />
            <p style={{ fontSize: 14, color: file ? '#1A7A4A' : '#5A5A5A' }}>
              {file ? file.name : 'Ανέβασε αρχείο (PDF, Excel, DWG, DXF)'}
            </p>
            <p style={{ fontSize: 12, color: '#9A9A9A', marginTop: 4 }}>Μέγιστο 10MB</p>
            <input ref={fileRef} type="file" accept=".pdf,.xlsx,.xls,.dwg,.dxf,.csv" onChange={e => setFile(e.target.files?.[0] || null)} style={{ display: 'none' }} />
          </div>

          {error && (
            <div style={{ background: '#FFF5F5', border: '1px solid #FFC5C5', borderRadius: 6, padding: '10px 14px', marginBottom: 16, fontSize: 13, color: '#C00' }}>
              {error}
            </div>
          )}

          <button
            onClick={handleGenerate}
            disabled={!file || !projectName.trim() || loading}
            style={{
              width: '100%',
              padding: '12px',
              background: loading || !file || !projectName ? '#E0E0E0' : '#0A0A0A',
              color: loading || !file || !projectName ? '#9A9A9A' : '#FAFAFA',
              border: 'none',
              borderRadius: 6,
              fontSize: 15,
              fontWeight: 500,
              cursor: loading || !file || !projectName ? 'not-allowed' : 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: 8,
              transition: 'background 0.2s',
            }}
          >
            {loading ? (
              <><span style={{ animation: 'spin 1s linear infinite', display: 'inline-block' }}>⏳</span> Δημιουργία BOQ...</>
            ) : (
              <><Zap size={16} /> Δημιούργησε BOQ</>
            )}
          </button>
        </div>

        {/* BOQ Result */}
        {result && (
          <div style={{ background: '#fff', border: '1px solid #E0E0E0', borderRadius: 8, padding: 32, marginBottom: 32 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 24 }}>
              <div>
                <h2 style={{ fontFamily: 'Georgia, serif', fontSize: 20, color: '#0A0A0A' }}>{result.projectName}</h2>
                <p style={{ fontSize: 12, color: '#9A9A9A', marginTop: 4 }}>
                  Εμπιστοσύνη AI: <span style={{ color: result.confidence === 'high' ? '#1A7A4A' : result.confidence === 'medium' ? '#B8860B' : '#C00', textTransform: 'uppercase', fontWeight: 600 }}>{result.confidence}</span>
                </p>
              </div>
              <button
                onClick={downloadCSV}
                style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '8px 16px', background: '#0A0A0A', color: '#FAFAFA', border: 'none', borderRadius: 6, fontSize: 13, cursor: 'pointer' }}
              >
                <Download size={14} /> CSV
              </button>
            </div>

            {result.sections.map(section => (
              <div key={section.title} style={{ marginBottom: 8, border: '1px solid #F0F0F0', borderRadius: 6, overflow: 'hidden' }}>
                <button
                  onClick={() => toggleSection(section.title)}
                  style={{ width: '100%', padding: '12px 16px', background: '#F8F8F8', border: 'none', cursor: 'pointer', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}
                >
                  <span style={{ fontWeight: 600, fontSize: 14, color: '#0A0A0A' }}>{section.title}</span>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                    <span style={{ fontFamily: 'Georgia, serif', fontSize: 14, color: '#2A2A2A' }}>€{section.subtotal.toLocaleString('el-GR', { minimumFractionDigits: 2 })}</span>
                    {expandedSections.has(section.title) ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
                  </div>
                </button>
                {expandedSections.has(section.title) && (
                  <div style={{ overflowX: 'auto' }}>
                    <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
                      <thead>
                        <tr style={{ background: '#F0F0F0' }}>
                          {['Κωδ.', 'Περιγραφή', 'Μον.', 'Ποσ.', 'Τιμή', 'Σύνολο'].map(h => (
                            <th key={h} style={{ padding: '8px 12px', textAlign: h === 'Περιγραφή' ? 'left' : 'right', fontWeight: 500, color: '#5A5A5A' }}>{h}</th>
                          ))}
                        </tr>
                      </thead>
                      <tbody>
                        {section.items.map((item: import('@/lib/types').BOQItem, i: number) => (
                          <tr key={item.id} style={{ borderTop: '1px solid #F0F0F0', background: i % 2 === 0 ? '#fff' : '#FAFAFA' }}>
                            <td style={{ padding: '8px 12px', color: '#9A9A9A', fontSize: 12 }}>{item.id}</td>
                            <td style={{ padding: '8px 12px' }}>{item.description}</td>
                            <td style={{ padding: '8px 12px', textAlign: 'right', color: '#5A5A5A' }}>{item.unit}</td>
                            <td style={{ padding: '8px 12px', textAlign: 'right' }}>{item.quantity.toFixed(2)}</td>
                            <td style={{ padding: '8px 12px', textAlign: 'right' }}>€{item.unitPrice.toFixed(2)}</td>
                            <td style={{ padding: '8px 12px', textAlign: 'right', fontWeight: 500 }}>€{item.total.toLocaleString('el-GR', { minimumFractionDigits: 2 })}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            ))}

            {/* Grand total */}
            <div style={{ marginTop: 16, padding: '16px 20px', background: '#0A0A0A', borderRadius: 6, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span style={{ color: '#FAFAFA', fontWeight: 600 }}>Συνολικό Κόστος Έργου</span>
              <span style={{ color: '#FAFAFA', fontFamily: 'Georgia, serif', fontSize: 22 }}>
                €{result.grandTotal.toLocaleString('el-GR', { minimumFractionDigits: 2 })}
              </span>
            </div>
          </div>
        )}

        {/* Project History */}
        {user.projects.length > 0 && (
          <div style={{ background: '#fff', border: '1px solid #E0E0E0', borderRadius: 8, padding: 32 }}>
            <h3 style={{ fontFamily: 'Georgia, serif', fontSize: 18, marginBottom: 20, color: '#0A0A0A' }}>Ιστορικό Έργων</h3>
            {user.projects.map(project => (
              <div key={project.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '12px 0', borderBottom: '1px solid #F0F0F0' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                  {project.status === 'complete' ? <CheckCircle size={16} color="#1A7A4A" /> : <Clock size={16} color="#9A9A9A" />}
                  <div>
                    <p style={{ fontSize: 14, fontWeight: 500, color: '#0A0A0A' }}>{project.name}</p>
                    <p style={{ fontSize: 12, color: '#9A9A9A' }}>{new Date(project.createdAt).toLocaleDateString('el-GR')}</p>
                  </div>
                </div>
                {project.totalAmount && (
                  <span style={{ fontFamily: 'Georgia, serif', fontSize: 15, color: '#2A2A2A' }}>
                    €{project.totalAmount.toLocaleString('el-GR', { minimumFractionDigits: 2 })}
                  </span>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
