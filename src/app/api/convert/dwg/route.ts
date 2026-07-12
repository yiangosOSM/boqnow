// src/app/api/convert/dwg/route.ts
import { auth } from '@/lib/auth'
import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { limiters, getIdentifier, applyRateLimit } from '@/lib/rate-limit'

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

export async function POST(req: NextRequest) {
  try {
    const { userId } = auth()
    if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const identifier = getIdentifier(req, userId)
    const { blocked, response } = await applyRateLimit(limiters.api, identifier)
    if (blocked) return response!

    const { storagePath } = await req.json()
    if (!storagePath) return NextResponse.json({ error: 'Missing storagePath' }, { status: 400 })

    // ── Security: path must belong to this user ───────────────
    const parts = (storagePath as string).split('/')
    if (parts.length < 3 || parts[0] !== userId) {
      return NextResponse.json({ error: 'Unauthorized file access' }, { status: 403 })
    }

    const ext = storagePath.split('.').pop()?.toLowerCase()
    if (!['dwg', 'dxf'].includes(ext || '')) {
      return NextResponse.json({ error: 'Only DWG/DXF files supported' }, { status: 400 })
    }

    const { data: fileData, error: downloadError } = await supabaseAdmin.storage
      .from('project-files').download(storagePath)
    if (downloadError || !fileData) {
      return NextResponse.json({ error: 'Failed to download file' }, { status: 500 })
    }

    const buffer = Buffer.from(await fileData.arrayBuffer())

    const jobResponse = await fetch('https://api.cloudconvert.com/v2/jobs', {
      method: 'POST',
      headers: { 'Authorization': `Bearer ${process.env.CLOUDCONVERT_API_KEY}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({
        tasks: {
          'upload-file': { operation: 'import/upload' },
          'convert-file': { operation: 'convert', input: 'upload-file', input_format: ext, output_format: 'pdf', engine: 'cadconverter' },
          'export-file': { operation: 'export/url', input: 'convert-file' },
        },
      }),
    })

    const job = await jobResponse.json()
    if (!jobResponse.ok) {
      return NextResponse.json({ error: 'Conversion service error', fallback: true }, { status: 500 })
    }

    const uploadTask = job.data.tasks.find((t: any) => t.name === 'upload-file')
    if (uploadTask?.result?.form?.url) {
      const formData = new FormData()
      const params = uploadTask.result.form.parameters || {}
      Object.entries(params).forEach(([k, v]) => formData.append(k, v as string))
      formData.append('file', new Blob([buffer]), storagePath.split('/').pop())
      await fetch(uploadTask.result.form.url, { method: 'POST', body: formData })
    }

    let pdfUrl: string | null = null
    for (let i = 0; i < 30; i++) {
      await new Promise(r => setTimeout(r, 2000))
      const statusRes = await fetch(`https://api.cloudconvert.com/v2/jobs/${job.data.id}`, {
        headers: { 'Authorization': `Bearer ${process.env.CLOUDCONVERT_API_KEY}` },
      })
      const status = await statusRes.json()
      const exportTask = status.data?.tasks?.find((t: any) => t.name === 'export-file')
      if (exportTask?.status === 'finished') { pdfUrl = exportTask.result?.files?.[0]?.url; break }
      if (status.data?.status === 'error') break
    }

    if (!pdfUrl) {
      return NextResponse.json({ error: 'Conversion timed out', fallback: true }, { status: 500 })
    }

    const pdfBuffer = Buffer.from(await (await fetch(pdfUrl)).arrayBuffer())
    const pdfPath = storagePath.replace(/\.(dwg|dxf)$/i, '_converted.pdf')
    await supabaseAdmin.storage.from('project-files').upload(pdfPath, pdfBuffer, { contentType: 'application/pdf', upsert: true })

    return NextResponse.json({ success: true, originalPath: storagePath, pdfPath })
  } catch (error) {
    console.error('DWG conversion error:', error)
    return NextResponse.json({ error: 'Conversion failed', fallback: true }, { status: 500 })
  }
}
