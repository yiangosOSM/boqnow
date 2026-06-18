'use client'
// src/components/dashboard/FileUploader.tsx
// Handles multi-file upload directly to Supabase Storage
// Then triggers BOQ generation via API

import { useState, useRef, useCallback } from 'react'
import { Upload, X, FileText, CheckCircle, AlertCircle, Loader2, ChevronDown, ChevronUp, Download } from 'lucide-react'
import { createClient } from '@supabase/supabase-js'

// Public Supabase client (anon key) — only for storage uploads
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
)

interface UploadedFile {
  id: string
  name: string
  size: number
  type: string
  status: 'pending' | 'uploading' | 'uploaded' | 'error'
  progress: number
  storagePath?: string
  error?: string
}

interface BOQItem {
  id: string
  description: string
  unit: string
  quantity: number
  unitPrice: number
  total: number
  medskoCode?: string
  notes?: string
}

interface BOQSection {
  title: string
  items: BOQItem[]
  subtotal: number
}

interface BOQResult {
  projectName: string
  sections: BOQSection[]
  grandTotal: number
  confidence: 'high' | 'medium' | 'low'
  generatedAt: string
}

const ACCEPTED_TYPES = ['.pdf', '.xlsx', '.xls', '.dwg', '.dxf', '.csv', '.png', '.jpg', '.jpeg']
const MAX_FILE_SIZE_MB = 100
const MAX_FILES = 50

function formatBytes(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`
}

function getFileIcon(name: string): string {
  const ext = name.split('.').pop()?.toLowerCase()
  if (ext === 'pdf') return '📄'
  if (['xlsx', 'xls', 'csv'].includes(ext || '')) return '📊'
  if (['dwg', 'dxf'].includes(ext || '')) return '📐'
  if (['png', 'jpg', 'jpeg'].includes(ext || '')) return '🖼️'
  return '📁'
}

export default function FileUploader({ userId, onProjectCreated }: {
  userId: string
  onProjectCreated: (projectId: string) => void
}) {
  const [files, setFiles] = useState<UploadedFile[]>([])
  const [projectName, setProjectName] = useState('')
  const [isDragOver, setIsDragOver] = useState(false)
  const [phase, setPhase] = useState<'upload' | 'generating' | 'done' | 'error'>('upload')
  const [boqResult, setBoqResult] = useState<BOQResult | null>(null)
  const [expandedSections, setExpandedSections] = useState<Set<string>>(new Set())
  const [globalError, setGlobalError] = useState('')
  const fileRef = useRef<HTMLInputElement>(null)

  const addFiles = useCallback((newFiles: FileList | File[]) => {
    const arr = Array.from(newFiles)
    const valid = arr.filter(f => {
      if (f.size > MAX_FILE_SIZE_MB * 1024 * 1024) return false
      const ext = '.' + f.name.split('.').pop()?.toLowerCase()
      return ACCEPTED_TYPES.includes(ext)
    })

    setFiles(prev => {
      const combined = [...prev, ...valid.map(f => ({
        id: Math.random().toString(36).slice(2),
        name: f.name,
        size: f.size,
        type: f.type,
        status: 'pending' as const,
        progress: 0,
        _file: f, // keep reference
      }))]
      return combined.slice(0, MAX_FILES)
    })
  }, [])

  const removeFile = (id: string) => {
    setFiles(prev => prev.filter(f => f.id !== id))
  }

  const onDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    setIsDragOver(false)
    addFiles(e.dataTransfer.files)
  }, [addFiles])

  // Upload all files to Supabase Storage
  const uploadAllFiles = async (): Promise<string[]> => {
    const projectFolder = `${userId}/${Date.now()}_${projectName.replace(/\s+/g, '_')}`
    const storagePaths: string[] = []

    for (const file of files) {
      const fileObj = (file as any)._file as File
      if (!fileObj) continue

      setFiles(prev => prev.map(f =>
        f.id === file.id ? { ...f, status: 'uploading', progress: 10 } : f
      ))

      const path = `${projectFolder}/${file.name}`

      // Simulate progress (Supabase JS v2 doesn't have upload progress natively)
      const progressInterval = setInterval(() => {
        setFiles(prev => prev.map(f =>
          f.id === file.id && f.progress < 80
            ? { ...f, progress: f.progress + 15 }
            : f
        ))
      }, 300)

      const { error } = await supabase.storage
        .from('project-files')
        .upload(path, fileObj, { cacheControl: '3600', upsert: false })

      clearInterval(progressInterval)

      if (error) {
        setFiles(prev => prev.map(f =>
          f.id === file.id ? { ...f, status: 'error', progress: 0, error: error.message } : f
        ))
      } else {
        setFiles(prev => prev.map(f =>
          f.id === file.id ? { ...f, status: 'uploaded', progress: 100, storagePath: path } : f
        ))
        storagePaths.push(path)
      }
    }

    return storagePaths
  }

  const handleGenerate = async () => {
    if (!projectName.trim() || files.length === 0) return
    setGlobalError('')
    setPhase('generating')

    try {
      // 1. Upload all files to Supabase Storage
      const storagePaths = await uploadAllFiles()

      if (storagePaths.length === 0) {
        throw new Error('Κανένα αρχείο δεν ανέβηκε επιτυχώς')
      }

      // 2. Call API with storage paths (not file content — server fetches from storage)
      const res = await fetch('/api/boq/generate-from-storage', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ projectName, storagePaths }),
      })

      const data = await res.json()
      if (!res.ok) throw new Error(data.error || 'Σφάλμα κατά τη δημιουργία BOQ')

      setBoqResult(data.boq)
      setPhase('done')
      onProjectCreated(data.projectId)
    } catch (e: any) {
      setGlobalError(e.message)
      setPhase('error')
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
    if (!boqResult) return
    const rows = ['Κωδικός,Περιγραφή,Μονάδα,Ποσότητα,Τιμή Μονάδος,Σύνολο,ΜΕΔΣΚ']
    boqResult.sections.forEach(s => {
      rows.push(`\n## ${s.title},,,,,,`)
      s.items.forEach(i => rows.push(`${i.id},"${i.description}",${i.unit},${i.quantity.toFixed(2)},${i.unitPrice.toFixed(2)},${i.total.toFixed(2)},${i.medskoCode || ''}`))
      rows.push(`Σύνολο ${s.title},,,,,,${s.subtotal.toFixed(2)}`)
    })
    rows.push(`\nΓΕΝΙΚΟ ΣΥΝΟΛΟ,,,,,,${boqResult.grandTotal.toFixed(2)}`)
    const blob = new Blob([rows.join('\n')], { type: 'text/csv;charset=utf-8;' })
    const a = document.createElement('a')
    a.href = URL.createObjectURL(blob)
    a.download = `BOQ_${boqResult.projectName.replace(/\s/g, '_')}.csv`
    a.click()
  }

  const reset = () => {
    setFiles([])
    setProjectName('')
    setBoqResult(null)
    setPhase('upload')
    setGlobalError('')
    setExpandedSections(new Set())
  }

  const uploadedCount = files.filter(f => f.status === 'uploaded').length
  const totalSize = files.reduce((sum, f) => sum + f.size, 0)

  // ─── RESULT VIEW ───────────────────────────────────────────────
  if (phase === 'done' && boqResult) {
    return (
      <div style={{ background: '#fff', border: '1px solid #E0E0E0', borderRadius: 8, padding: 32 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 24 }}>
          <div>
            <h2 style={{ fontFamily: 'Georgia, serif', fontSize: 22, color: '#0A0A0A', marginBottom: 4 }}>{boqResult.projectName}</h2>
            <div style={{ display: 'flex', gap: 12, alignItems: 'center' }}>
              <span style={{ fontSize: 12, color: '#9A9A9A' }}>{files.length} αρχεία αναλύθηκαν</span>
              <span style={{
                fontSize: 11, fontWeight: 600, padding: '2px 8px', borderRadius: 10, textTransform: 'uppercase',
                background: boqResult.confidence === 'high' ? '#E6F4ED' : boqResult.confidence === 'medium' ? '#FFF8E6' : '#FFF0F0',
                color: boqResult.confidence === 'high' ? '#1A7A4A' : boqResult.confidence === 'medium' ? '#B8860B' : '#CC0000',
              }}>
                {boqResult.confidence === 'high' ? 'Υψηλή ακρίβεια' : boqResult.confidence === 'medium' ? 'Μέτρια ακρίβεια' : 'Χαμηλή ακρίβεια — έλεγξε'}
              </span>
            </div>
          </div>
          <div style={{ display: 'flex', gap: 8 }}>
            <button onClick={downloadCSV} style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '8px 14px', background: '#0A0A0A', color: '#FAFAFA', border: 'none', borderRadius: 6, fontSize: 13, cursor: 'pointer' }}>
              <Download size={13} /> CSV
            </button>
            <button onClick={reset} style={{ padding: '8px 14px', background: '#F0F0F0', color: '#0A0A0A', border: 'none', borderRadius: 6, fontSize: 13, cursor: 'pointer' }}>
              Νέο έργο
            </button>
          </div>
        </div>

        {boqResult.sections.map(section => (
          <div key={section.title} style={{ marginBottom: 6, border: '1px solid #F0F0F0', borderRadius: 6, overflow: 'hidden' }}>
            <button
              onClick={() => toggleSection(section.title)}
              style={{ width: '100%', padding: '11px 16px', background: '#F8F8F8', border: 'none', cursor: 'pointer', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}
            >
              <span style={{ fontWeight: 600, fontSize: 13, color: '#0A0A0A' }}>{section.title}</span>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                <span style={{ fontFamily: 'Georgia, serif', fontSize: 14 }}>€{section.subtotal.toLocaleString('el-GR', { minimumFractionDigits: 2 })}</span>
                {expandedSections.has(section.title) ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
              </div>
            </button>
            {expandedSections.has(section.title) && (
              <div style={{ overflowX: 'auto' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 12 }}>
                  <thead>
                    <tr style={{ background: '#F0F0F0' }}>
                      {['Κωδ.', 'Περιγραφή', 'Μον.', 'Ποσ.', 'Τιμή/μον.', 'Σύνολο'].map(h => (
                        <th key={h} style={{ padding: '7px 12px', textAlign: h === 'Περιγραφή' ? 'left' : 'right', fontWeight: 500, color: '#5A5A5A', whiteSpace: 'nowrap' }}>{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {section.items.map((item, i) => (
                      <tr key={item.id} style={{ borderTop: '1px solid #F0F0F0', background: i % 2 === 0 ? '#fff' : '#FAFAFA' }}>
                        <td style={{ padding: '7px 12px', color: '#9A9A9A', fontSize: 11 }}>{item.id}</td>
                        <td style={{ padding: '7px 12px', maxWidth: 320 }}>{item.description}{item.notes && <span style={{ color: '#9A9A9A', fontSize: 11 }}> — {item.notes}</span>}</td>
                        <td style={{ padding: '7px 12px', textAlign: 'right', color: '#5A5A5A' }}>{item.unit}</td>
                        <td style={{ padding: '7px 12px', textAlign: 'right' }}>{item.quantity.toFixed(2)}</td>
                        <td style={{ padding: '7px 12px', textAlign: 'right' }}>€{item.unitPrice.toFixed(2)}</td>
                        <td style={{ padding: '7px 12px', textAlign: 'right', fontWeight: 600 }}>€{item.total.toLocaleString('el-GR', { minimumFractionDigits: 2 })}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        ))}

        <div style={{ marginTop: 16, padding: '16px 20px', background: '#0A0A0A', borderRadius: 6, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <span style={{ color: '#FAFAFA', fontWeight: 600, fontSize: 15 }}>Συνολικό Κόστος Έργου</span>
          <span style={{ color: '#FAFAFA', fontFamily: 'Georgia, serif', fontSize: 26 }}>
            €{boqResult.grandTotal.toLocaleString('el-GR', { minimumFractionDigits: 2 })}
          </span>
        </div>
      </div>
    )
  }

  // ─── UPLOAD VIEW ───────────────────────────────────────────────
  return (
    <div style={{ background: '#fff', border: '1px solid #E0E0E0', borderRadius: 8, padding: 32 }}>
      <h2 style={{ fontFamily: 'Georgia, serif', fontSize: 22, marginBottom: 24, color: '#0A0A0A' }}>Νέο BOQ</h2>

      {/* Project name */}
      <div style={{ marginBottom: 20 }}>
        <label style={{ display: 'block', fontSize: 13, color: '#5A5A5A', marginBottom: 6 }}>Όνομα Έργου</label>
        <input
          type="text"
          value={projectName}
          onChange={e => setProjectName(e.target.value)}
          placeholder="π.χ. Κατοικία Παπαδόπουλος — Λεμεσός 2024"
          disabled={phase === 'generating'}
          style={{ width: '100%', padding: '10px 14px', border: '1px solid #E0E0E0', borderRadius: 6, fontSize: 14, outline: 'none', fontFamily: 'Inter, sans-serif' }}
        />
      </div>

      {/* Drop zone */}
      <div
        onDrop={onDrop}
        onDragOver={e => { e.preventDefault(); setIsDragOver(true) }}
        onDragLeave={() => setIsDragOver(false)}
        onClick={() => phase === 'upload' && fileRef.current?.click()}
        style={{
          border: `2px dashed ${isDragOver ? '#0A0A0A' : '#E0E0E0'}`,
          borderRadius: 8,
          padding: '36px 24px',
          textAlign: 'center',
          cursor: phase === 'upload' ? 'pointer' : 'default',
          background: isDragOver ? '#F8F8F8' : '#FAFAFA',
          transition: 'all 0.15s',
          marginBottom: 16,
        }}
      >
        <Upload size={28} color={isDragOver ? '#0A0A0A' : '#9A9A9A'} style={{ margin: '0 auto 12px' }} />
        <p style={{ fontSize: 15, color: '#2A2A2A', fontWeight: 500, marginBottom: 4 }}>
          Σύρε αρχεία εδώ ή κλίκ για επιλογή
        </p>
        <p style={{ fontSize: 13, color: '#9A9A9A' }}>
          PDF · Excel · DWG · DXF · CSV · Εικόνες — έως {MAX_FILE_SIZE_MB}MB ανά αρχείο · έως {MAX_FILES} αρχεία
        </p>
        <input
          ref={fileRef}
          type="file"
          multiple
          accept={ACCEPTED_TYPES.join(',')}
          onChange={e => e.target.files && addFiles(e.target.files)}
          style={{ display: 'none' }}
        />
      </div>

      {/* File list */}
      {files.length > 0 && (
        <div style={{ marginBottom: 20 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 }}>
            <span style={{ fontSize: 13, fontWeight: 600, color: '#0A0A0A' }}>
              {files.length} αρχεία · {formatBytes(totalSize)}
            </span>
            {phase === 'upload' && (
              <button onClick={() => setFiles([])} style={{ fontSize: 12, color: '#9A9A9A', background: 'none', border: 'none', cursor: 'pointer' }}>
                Καθαρισμός όλων
              </button>
            )}
          </div>

          <div style={{ maxHeight: 280, overflowY: 'auto', border: '1px solid #F0F0F0', borderRadius: 6 }}>
            {files.map(file => (
              <div key={file.id} style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '10px 14px', borderBottom: '1px solid #F8F8F8' }}>
                <span style={{ fontSize: 18, flexShrink: 0 }}>{getFileIcon(file.name)}</span>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <p style={{ fontSize: 13, fontWeight: 500, color: '#0A0A0A', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{file.name}</p>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginTop: 3 }}>
                    <span style={{ fontSize: 11, color: '#9A9A9A' }}>{formatBytes(file.size)}</span>
                    {file.status === 'uploading' && (
                      <div style={{ flex: 1, height: 3, background: '#F0F0F0', borderRadius: 2, maxWidth: 120 }}>
                        <div style={{ height: '100%', width: `${file.progress}%`, background: '#0A0A0A', borderRadius: 2, transition: 'width 0.3s' }} />
                      </div>
                    )}
                    {file.status === 'error' && <span style={{ fontSize: 11, color: '#CC0000' }}>{file.error}</span>}
                  </div>
                </div>
                <div style={{ flexShrink: 0 }}>
                  {file.status === 'pending' && phase === 'upload' && (
                    <button onClick={() => removeFile(file.id)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#9A9A9A', padding: 4 }}>
                      <X size={14} />
                    </button>
                  )}
                  {file.status === 'uploading' && <Loader2 size={16} color="#9A9A9A" style={{ animation: 'spin 1s linear infinite' }} />}
                  {file.status === 'uploaded' && <CheckCircle size={16} color="#1A7A4A" />}
                  {file.status === 'error' && <AlertCircle size={16} color="#CC0000" />}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* DWG notice */}
      {files.some(f => f.name.toLowerCase().endsWith('.dwg') || f.name.toLowerCase().endsWith('.dxf')) && (
        <div style={{ background: '#FFF8E6', border: '1px solid #FFE0A0', borderRadius: 6, padding: '10px 14px', marginBottom: 16, fontSize: 13, color: '#7A5A00' }}>
          ⚠️ <strong>DWG/DXF αρχεία:</strong> Θα αναλυθούν με μειωμένη ακρίβεια. Για καλύτερα αποτελέσματα, ανέβασε και το PDF export των ίδιων σχεδίων.
        </div>
      )}

      {/* Error */}
      {globalError && (
        <div style={{ background: '#FFF0F0', border: '1px solid #FFB0B0', borderRadius: 6, padding: '10px 14px', marginBottom: 16, fontSize: 13, color: '#CC0000' }}>
          {globalError}
        </div>
      )}

      {/* Generate button */}
      <button
        onClick={handleGenerate}
        disabled={files.length === 0 || !projectName.trim() || phase === 'generating'}
        style={{
          width: '100%',
          padding: '13px',
          background: files.length === 0 || !projectName.trim() || phase === 'generating' ? '#E0E0E0' : '#0A0A0A',
          color: files.length === 0 || !projectName.trim() || phase === 'generating' ? '#9A9A9A' : '#FAFAFA',
          border: 'none',
          borderRadius: 6,
          fontSize: 15,
          fontWeight: 500,
          cursor: files.length === 0 || !projectName.trim() || phase === 'generating' ? 'not-allowed' : 'pointer',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          gap: 8,
          transition: 'background 0.2s',
        }}
      >
        {phase === 'generating' ? (
          <><Loader2 size={16} style={{ animation: 'spin 1s linear infinite' }} />
            {uploadedCount < files.length
              ? `Ανέβασμα αρχείων... (${uploadedCount}/${files.length})`
              : 'Ανάλυση σχεδίων με AI...'
            }
          </>
        ) : (
          `Δημιούργησε BOQ από ${files.length > 0 ? files.length + ' αρχεία' : 'αρχεία'}`
        )}
      </button>

      <style>{`@keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }`}</style>
    </div>
  )
}
