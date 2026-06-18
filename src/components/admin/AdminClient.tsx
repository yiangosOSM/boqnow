'use client'
// src/components/admin/AdminClient.tsx
import { useState } from 'react'
import { Users, TrendingUp, FileText, Mail, ChevronDown, ChevronUp } from 'lucide-react'

interface Stats {
  totalUsers: number
  activeSubscriptions: number
  mrr: number
  totalProjects: number
  waitlistCount: number
  planBreakdown: Record<string, number>
}

export default function AdminClient({ stats, users, projects, waitlist }: {
  stats: Stats
  users: any[]
  projects: any[]
  waitlist: any[]
}) {
  const [tab, setTab] = useState<'overview' | 'users' | 'projects' | 'waitlist' | 'prices'>('overview')

  const PLAN_COLORS: Record<string, string> = {
    FREE: '#9A9A9A', STARTER: '#2A6496', PRO: '#1A7A4A', AGENCY: '#7A4A1A',
  }

  return (
    <div style={{ minHeight: '100vh', background: '#F8F8F8', fontFamily: 'Inter, sans-serif' }}>
      {/* Header */}
      <header style={{ background: '#0A0A0A', padding: '0 32px', height: 52, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
          <span style={{ fontFamily: 'Georgia, serif', fontSize: 18, color: '#FAFAFA' }}>BOQNOW</span>
          <span style={{ fontSize: 11, padding: '2px 8px', background: '#2A2A2A', color: '#9A9A9A', borderRadius: 4, letterSpacing: 1, textTransform: 'uppercase' }}>Admin</span>
        </div>
        <a href="/dashboard" style={{ fontSize: 13, color: '#9A9A9A', textDecoration: 'none' }}>← Dashboard</a>
      </header>

      <div style={{ maxWidth: 1100, margin: '0 auto', padding: '32px 24px' }}>
        {/* Stats cards */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(5, 1fr)', gap: 16, marginBottom: 32 }}>
          {[
            { icon: <Users size={18} />, label: 'Σύνολο Users', value: stats.totalUsers },
            { icon: <TrendingUp size={18} />, label: 'Active Subs', value: stats.activeSubscriptions },
            { icon: <TrendingUp size={18} />, label: 'MRR', value: `€${stats.mrr.toLocaleString()}` },
            { icon: <FileText size={18} />, label: 'Projects', value: stats.totalProjects },
            { icon: <Mail size={18} />, label: 'Waitlist', value: stats.waitlistCount },
          ].map(({ icon, label, value }) => (
            <div key={label} style={{ background: '#fff', border: '1px solid #E0E0E0', borderRadius: 8, padding: '16px 20px' }}>
              <div style={{ color: '#9A9A9A', marginBottom: 8 }}>{icon}</div>
              <div style={{ fontFamily: 'Georgia, serif', fontSize: 24, marginBottom: 4 }}>{value}</div>
              <div style={{ fontSize: 12, color: '#9A9A9A' }}>{label}</div>
            </div>
          ))}
        </div>

        {/* Plan breakdown */}
        <div style={{ background: '#fff', border: '1px solid #E0E0E0', borderRadius: 8, padding: '20px 24px', marginBottom: 32 }}>
          <h3 style={{ fontSize: 14, fontWeight: 600, marginBottom: 16 }}>Κατανομή Πλάνων</h3>
          <div style={{ display: 'flex', gap: 24 }}>
            {Object.entries(stats.planBreakdown).map(([plan, count]) => (
              <div key={plan} style={{ textAlign: 'center' }}>
                <div style={{ fontSize: 22, fontFamily: 'Georgia, serif', color: PLAN_COLORS[plan] }}>{count}</div>
                <div style={{ fontSize: 12, color: '#9A9A9A', marginTop: 2 }}>{plan}</div>
              </div>
            ))}
          </div>
        </div>

        {/* Tabs */}
        <div style={{ display: 'flex', gap: 4, marginBottom: 20 }}>
          {(['overview', 'users', 'projects', 'waitlist', 'prices'] as const).map(t => (
            <button key={t} onClick={() => setTab(t)} style={{
              padding: '8px 16px', background: tab === t ? '#0A0A0A' : '#fff',
              color: tab === t ? '#FAFAFA' : '#5A5A5A', border: '1px solid #E0E0E0',
              borderRadius: 6, fontSize: 13, cursor: 'pointer', textTransform: 'capitalize',
            }}>
              {t === 'overview' ? 'Σύνοψη' : t === 'users' ? `Users (${stats.totalUsers})` : t === 'projects' ? 'Projects' : `Waitlist (${stats.waitlistCount})`}
            </button>
          ))}
        </div>

        {/* Users table */}
        {tab === 'users' && (
          <div style={{ background: '#fff', border: '1px solid #E0E0E0', borderRadius: 8, overflow: 'hidden' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
              <thead>
                <tr style={{ background: '#F8F8F8', borderBottom: '1px solid #E0E0E0' }}>
                  {['Email', 'Όνομα', 'Πλάνο', 'Status', 'Projects', 'Εγγραφή'].map(h => (
                    <th key={h} style={{ padding: '10px 16px', textAlign: 'left', fontWeight: 500, color: '#5A5A5A' }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {users.map(u => (
                  <tr key={u.id} style={{ borderBottom: '1px solid #F8F8F8' }}>
                    <td style={{ padding: '10px 16px', color: '#0A0A0A' }}>{u.email}</td>
                    <td style={{ padding: '10px 16px', color: '#5A5A5A' }}>{u.name || '—'}</td>
                    <td style={{ padding: '10px 16px' }}>
                      <span style={{ padding: '2px 8px', borderRadius: 10, fontSize: 11, fontWeight: 600, background: '#F0F0F0', color: PLAN_COLORS[u.subscription?.plan || 'FREE'] }}>
                        {u.subscription?.plan || 'FREE'}
                      </span>
                    </td>
                    <td style={{ padding: '10px 16px', fontSize: 12, color: u.subscription?.status === 'active' ? '#1A7A4A' : '#9A9A9A' }}>
                      {u.subscription?.status || 'trial'}
                    </td>
                    <td style={{ padding: '10px 16px', color: '#5A5A5A' }}>{u._count?.projects || 0}</td>
                    <td style={{ padding: '10px 16px', color: '#9A9A9A', fontSize: 12 }}>{new Date(u.createdAt).toLocaleDateString('el-GR')}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {/* Projects table */}
        {tab === 'projects' && (
          <div style={{ background: '#fff', border: '1px solid #E0E0E0', borderRadius: 8, overflow: 'hidden' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
              <thead>
                <tr style={{ background: '#F8F8F8', borderBottom: '1px solid #E0E0E0' }}>
                  {['Έργο', 'User', 'Status', 'Σύνολο (€)', 'Αρχεία', 'Ημερομηνία'].map(h => (
                    <th key={h} style={{ padding: '10px 16px', textAlign: 'left', fontWeight: 500, color: '#5A5A5A' }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {projects.map(p => (
                  <tr key={p.id} style={{ borderBottom: '1px solid #F8F8F8' }}>
                    <td style={{ padding: '10px 16px', fontWeight: 500 }}>{p.name}</td>
                    <td style={{ padding: '10px 16px', color: '#5A5A5A', fontSize: 12 }}>{p.user?.email}</td>
                    <td style={{ padding: '10px 16px' }}>
                      <span style={{ fontSize: 11, padding: '2px 8px', borderRadius: 10, background: p.status === 'complete' ? '#E6F4ED' : '#F0F0F0', color: p.status === 'complete' ? '#1A7A4A' : '#9A9A9A' }}>
                        {p.status}
                      </span>
                    </td>
                    <td style={{ padding: '10px 16px', fontFamily: 'Georgia, serif' }}>
                      {p.totalAmount ? `€${p.totalAmount.toLocaleString('el-GR', { minimumFractionDigits: 2 })}` : '—'}
                    </td>
                    <td style={{ padding: '10px 16px', color: '#9A9A9A' }}>{p.inputFiles?.length || 0}</td>
                    <td style={{ padding: '10px 16px', color: '#9A9A9A', fontSize: 12 }}>{new Date(p.createdAt).toLocaleDateString('el-GR')}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {/* Waitlist table */}
        {tab === 'waitlist' && (
          <div style={{ background: '#fff', border: '1px solid #E0E0E0', borderRadius: 8, overflow: 'hidden' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
              <thead>
                <tr style={{ background: '#F8F8F8', borderBottom: '1px solid #E0E0E0' }}>
                  {['Email', 'Εταιρεία', 'Ημερομηνία'].map(h => (
                    <th key={h} style={{ padding: '10px 16px', textAlign: 'left', fontWeight: 500, color: '#5A5A5A' }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {waitlist.map(w => (
                  <tr key={w.id} style={{ borderBottom: '1px solid #F8F8F8' }}>
                    <td style={{ padding: '10px 16px' }}>{w.email}</td>
                    <td style={{ padding: '10px 16px', color: '#5A5A5A' }}>{w.company || '—'}</td>
                    <td style={{ padding: '10px 16px', color: '#9A9A9A', fontSize: 12 }}>{new Date(w.createdAt).toLocaleDateString('el-GR')}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  )
}

// ── Price Intelligence Tab ─────────────────────────────────────
export function PriceIntelligencePanel() {
  const [quotes, setQuotes] = useState<any[]>([])
  const [priceRefs, setPriceRefs] = useState<any[]>([])
  const [totalItems, setTotalItems] = useState(0)
  const [uploading, setUploading] = useState(false)
  const [subTab, setSubTab] = useState<'upload' | 'database' | 'quotes'>('upload')

  // Form state
  const [file, setFile] = useState<File | null>(null)
  const [projectDate, setProjectDate] = useState('')
  const [projectType, setProjectType] = useState('house')
  const [region, setRegion] = useState('cyprus')
  const [scope, setScope] = useState('SHARED')
  const [msg, setMsg] = useState<{ type: 'ok' | 'err'; text: string } | null>(null)

  const load = async () => {
    const res = await fetch('/api/admin/quotes')
    const data = await res.json()
    setQuotes(data.quotes || [])
    setPriceRefs(data.priceRefs || [])
    setTotalItems(data.totalItems || 0)
  }

  useState(() => { load() })

  const handleUpload = async () => {
    if (!file || !projectDate) { setMsg({ type: 'err', text: 'Επέλεξε αρχείο και ημερομηνία προσφοράς' }); return }
    setUploading(true); setMsg(null)

    try {
      // 1. Upload to Supabase
      const formData = new FormData(); formData.append('file', file)
      const uploadRes = await fetch(`/api/admin/quotes/upload?filename=${encodeURIComponent(file.name)}`, {
        method: 'POST', body: formData
      })
      const { storagePath } = await uploadRes.json()
      if (!storagePath) throw new Error('Upload failed')

      // 2. Trigger extraction
      const res = await fetch('/api/admin/quotes', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          filename: file.name, storagePath,
          fileType: file.name.split('.').pop(),
          projectDate, projectType, region, scope
        })
      })
      const data = await res.json()
      if (!data.success) throw new Error(data.error)

      setMsg({ type: 'ok', text: `✓ Ανέβηκε επιτυχώς (ID: ${data.quoteId}). Η εξαγωγή τιμών ξεκίνησε — θα ολοκληρωθεί σε 30-60 δευτερόλεπτα.` })
      setFile(null); setProjectDate('')
      setTimeout(load, 3000)
    } catch (e: any) {
      setMsg({ type: 'err', text: e.message })
    } finally {
      setUploading(false)
    }
  }

  const handleDelete = async (quoteId: string) => {
    if (!confirm('Διαγραφή προσφοράς και όλων των τιμών της;')) return
    await fetch('/api/admin/quotes', { method: 'DELETE', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ quoteId }) })
    load()
  }

  const confidenceColor = (c: string) => c === 'high' ? '#1A7A4A' : c === 'medium' ? '#7A5A00' : '#7A1A1A'
  const statusColor = (s: string) => s === 'COMPLETE' ? '#1A7A4A' : s === 'FAILED' ? '#7A1A1A' : s === 'PROCESSING' ? '#2A6496' : '#7A7A7A'

  return (
    <div>
      {/* Stats */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 16, marginBottom: 24 }}>
        {[
          { label: 'Προσφορές', value: quotes.length },
          { label: 'Line Items', value: totalItems.toLocaleString('el-GR') },
          { label: 'Ομάδες τιμών', value: priceRefs.length },
        ].map(s => (
          <div key={s.label} style={{ background: '#0A0A0A', borderRadius: 8, padding: '20px 24px', color: '#FAFAFA' }}>
            <div style={{ fontFamily: 'Georgia, serif', fontSize: 28 }}>{s.value}</div>
            <div style={{ fontSize: 12, color: '#9A9A9A', marginTop: 4 }}>{s.label}</div>
          </div>
        ))}
      </div>

      {/* Sub-tabs */}
      <div style={{ display: 'flex', gap: 4, marginBottom: 20 }}>
        {([['upload', 'Upload Προσφοράς'], ['quotes', `Προσφορές (${quotes.length})`], ['database', `Βάση Τιμών (${priceRefs.length})`]] as const).map(([t, label]) => (
          <button key={t} onClick={() => setSubTab(t as any)} style={{
            padding: '8px 16px', background: subTab === t ? '#0A0A0A' : '#fff',
            color: subTab === t ? '#FAFAFA' : '#5A5A5A',
            border: '1px solid #E0E0E0', borderRadius: 6, fontSize: 13, cursor: 'pointer',
          }}>{label}</button>
        ))}
      </div>

      {/* Upload form */}
      {subTab === 'upload' && (
        <div style={{ background: '#fff', border: '1px solid #E0E0E0', borderRadius: 8, padding: 28 }}>
          <h3 style={{ fontSize: 16, fontWeight: 600, marginBottom: 20 }}>Upload Ιστορικής Προσφοράς</h3>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
            <div>
              <label style={{ fontSize: 12, color: '#5A5A5A', display: 'block', marginBottom: 6 }}>Αρχείο προσφοράς (PDF, Excel, Word)</label>
              <input type="file" accept=".pdf,.xlsx,.xls,.docx,.doc" onChange={e => setFile(e.target.files?.[0] || null)}
                style={{ width: '100%', padding: '8px 12px', border: '1px solid #E0E0E0', borderRadius: 6, fontSize: 13 }} />
            </div>
            <div>
              <label style={{ fontSize: 12, color: '#5A5A5A', display: 'block', marginBottom: 6 }}>Ημερομηνία έκδοσης προσφοράς</label>
              <input type="date" value={projectDate} onChange={e => setProjectDate(e.target.value)}
                style={{ width: '100%', padding: '8px 12px', border: '1px solid #E0E0E0', borderRadius: 6, fontSize: 13 }} />
            </div>
            <div>
              <label style={{ fontSize: 12, color: '#5A5A5A', display: 'block', marginBottom: 6 }}>Τύπος έργου</label>
              <select value={projectType} onChange={e => setProjectType(e.target.value)}
                style={{ width: '100%', padding: '8px 12px', border: '1px solid #E0E0E0', borderRadius: 6, fontSize: 13 }}>
                <option value="house">Κατοικία</option>
                <option value="apartment">Διαμέρισμα</option>
                <option value="commercial">Εμπορικό</option>
                <option value="industrial">Βιομηχανικό</option>
              </select>
            </div>
            <div>
              <label style={{ fontSize: 12, color: '#5A5A5A', display: 'block', marginBottom: 6 }}>Περιοχή</label>
              <select value={region} onChange={e => setRegion(e.target.value)}
                style={{ width: '100%', padding: '8px 12px', border: '1px solid #E0E0E0', borderRadius: 6, fontSize: 13 }}>
                <option value="cyprus">Κύπρος</option>
                <option value="greece">Ελλάδα</option>
              </select>
            </div>
            <div style={{ gridColumn: '1 / -1' }}>
              <label style={{ fontSize: 12, color: '#5A5A5A', display: 'block', marginBottom: 6 }}>Ορατότητα τιμών</label>
              <select value={scope} onChange={e => setScope(e.target.value)}
                style={{ width: '100%', padding: '8px 12px', border: '1px solid #E0E0E0', borderRadius: 6, fontSize: 13 }}>
                <option value="SHARED">SHARED — τροφοδοτεί τη βάση τιμών όλων</option>
                <option value="PERSONAL">PERSONAL — χρησιμοποιείται μόνο για εσένα</option>
              </select>
            </div>
          </div>

          {msg && (
            <div style={{ marginTop: 16, padding: '12px 16px', background: msg.type === 'ok' ? '#F0F8F4' : '#FFF0F0', border: `1px solid ${msg.type === 'ok' ? '#B8DFC8' : '#F0B8B8'}`, borderRadius: 6, fontSize: 13, color: msg.type === 'ok' ? '#1A5A3A' : '#7A1A1A' }}>
              {msg.text}
            </div>
          )}

          <button onClick={handleUpload} disabled={uploading || !file || !projectDate}
            style={{ marginTop: 20, padding: '12px 28px', background: file && projectDate ? '#0A0A0A' : '#E0E0E0', color: file && projectDate ? '#FAFAFA' : '#9A9A9A', border: 'none', borderRadius: 8, fontSize: 14, fontWeight: 600, cursor: file && projectDate ? 'pointer' : 'not-allowed' }}>
            {uploading ? '⏳ Ανέβασμα & Εξαγωγή...' : '↑ Upload & Εξαγωγή Τιμών'}
          </button>

          <div style={{ marginTop: 20, padding: '14px 16px', background: '#F8F8F8', borderRadius: 6, fontSize: 12, color: '#5A5A5A', lineHeight: 1.7 }}>
            <strong>Πώς λειτουργεί:</strong><br/>
            1. Ανεβάζεις PDF/Excel/Word προσφοράς<br/>
            2. Το AI εξάγει όλα τα line items με τιμές μονάδας<br/>
            3. Υπολογίζεται time-weighted μέσος όρος (νεότερες = μεγαλύτερο βάρος)<br/>
            4. Οι τιμές ενσωματώνονται αυτόματα στο Step 5 του pipeline<br/>
            5. Κάθε νέα προσφορά βελτιώνει την ακρίβεια για όλους
          </div>
        </div>
      )}

      {/* Quotes list */}
      {subTab === 'quotes' && (
        <div style={{ background: '#fff', border: '1px solid #E0E0E0', borderRadius: 8, overflow: 'hidden' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
            <thead>
              <tr style={{ background: '#F8F8F8', borderBottom: '1px solid #E0E0E0' }}>
                {['Αρχείο', 'Ημ. Προσφοράς', 'Τύπος', 'Items', 'Status', ''].map(h => (
                  <th key={h} style={{ padding: '10px 16px', textAlign: 'left', color: '#9A9A9A', fontWeight: 500 }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {quotes.map((q: any, i: number) => (
                <tr key={q.id} style={{ borderBottom: i < quotes.length - 1 ? '1px solid #F0F0F0' : 'none' }}>
                  <td style={{ padding: '12px 16px' }}>{q.filename}</td>
                  <td style={{ padding: '12px 16px', color: '#5A5A5A' }}>{new Date(q.projectDate).toLocaleDateString('el-GR')}</td>
                  <td style={{ padding: '12px 16px', color: '#5A5A5A' }}>{q.projectType} · {q.region}</td>
                  <td style={{ padding: '12px 16px', fontFamily: 'Georgia, serif' }}>{q._count?.lineItems || 0}</td>
                  <td style={{ padding: '12px 16px' }}>
                    <span style={{ fontSize: 11, padding: '3px 8px', borderRadius: 4, background: statusColor(q.status) + '22', color: statusColor(q.status), fontWeight: 600 }}>
                      {q.status}
                    </span>
                  </td>
                  <td style={{ padding: '12px 16px' }}>
                    <button onClick={() => handleDelete(q.id)} style={{ fontSize: 12, color: '#9A9A9A', background: 'none', border: 'none', cursor: 'pointer', padding: '4px 8px' }}>✕</button>
                  </td>
                </tr>
              ))}
              {quotes.length === 0 && (
                <tr><td colSpan={6} style={{ padding: '32px', textAlign: 'center', color: '#9A9A9A' }}>Δεν υπάρχουν προσφορές ακόμα. Ανέβασε την πρώτη.</td></tr>
              )}
            </tbody>
          </table>
        </div>
      )}

      {/* Price database */}
      {subTab === 'database' && (
        <div style={{ background: '#fff', border: '1px solid #E0E0E0', borderRadius: 8, overflow: 'hidden' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
            <thead>
              <tr style={{ background: '#F8F8F8', borderBottom: '1px solid #E0E0E0' }}>
                {['Ομάδα υλικού', 'Μον.', 'Weighted Avg', 'Εύρος', 'Samples', 'Confidence', 'Τελ. Ενημ.'].map(h => (
                  <th key={h} style={{ padding: '10px 16px', textAlign: 'left', color: '#9A9A9A', fontWeight: 500 }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {priceRefs.map((ref: any, i: number) => (
                <tr key={ref.id} style={{ borderBottom: i < priceRefs.length - 1 ? '1px solid #F0F0F0' : 'none' }}>
                  <td style={{ padding: '10px 16px', fontWeight: 500 }}>{ref.materialGroup}</td>
                  <td style={{ padding: '10px 16px', color: '#5A5A5A' }}>{ref.unit}</td>
                  <td style={{ padding: '10px 16px', fontFamily: 'Georgia, serif', fontWeight: 600 }}>€{ref.weightedAvg}</td>
                  <td style={{ padding: '10px 16px', color: '#5A5A5A', fontSize: 12 }}>€{ref.minPrice} – €{ref.maxPrice}</td>
                  <td style={{ padding: '10px 16px', color: '#5A5A5A' }}>{ref.sampleCount}</td>
                  <td style={{ padding: '10px 16px' }}>
                    <span style={{ fontSize: 11, padding: '3px 8px', borderRadius: 4, background: confidenceColor(ref.confidence) + '22', color: confidenceColor(ref.confidence), fontWeight: 600 }}>
                      {ref.confidence.toUpperCase()}
                    </span>
                  </td>
                  <td style={{ padding: '10px 16px', color: '#9A9A9A', fontSize: 12 }}>{new Date(ref.lastQuoteDate).toLocaleDateString('el-GR')}</td>
                </tr>
              ))}
              {priceRefs.length === 0 && (
                <tr><td colSpan={7} style={{ padding: '32px', textAlign: 'center', color: '#9A9A9A' }}>Δεν υπάρχουν δεδομένα τιμών ακόμα.</td></tr>
              )}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}
