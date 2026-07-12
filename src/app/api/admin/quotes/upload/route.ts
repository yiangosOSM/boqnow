// src/app/api/admin/quotes/upload/route.ts
import { auth } from '@/lib/auth'
import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

export async function POST(req: NextRequest) {
  const { userId } = auth()
  if (!userId || userId !== process.env.ADMIN_CLERK_USER_ID) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }

  const filename = req.nextUrl.searchParams.get('filename') || 'quote'
  const formData = await req.formData()
  const file = formData.get('file') as File
  if (!file) return NextResponse.json({ error: 'No file' }, { status: 400 })

  const buffer = Buffer.from(await file.arrayBuffer())
  const storagePath = `admin/${Date.now()}_${filename.replace(/[^a-zA-Z0-9._-]/g, '_')}`

  const { error } = await supabaseAdmin.storage
    .from('historical-quotes')
    .upload(storagePath, buffer, {
      contentType: file.type || 'application/octet-stream',
      upsert: false,
    })

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  return NextResponse.json({ success: true, storagePath })
}
