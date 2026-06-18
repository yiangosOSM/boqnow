# Supabase Storage Setup για Measur

## 1. Δημιούργησε Storage Bucket

Στο Supabase Dashboard → Storage → New bucket:
- Name: `project-files`
- Public: **NO** (private)
- File size limit: **100MB**
- Allowed MIME types: `application/pdf, application/vnd.ms-excel, application/vnd.openxmlformats-officedocument.spreadsheetml.sheet, text/csv, image/png, image/jpeg, application/octet-stream`

## 2. RLS Policies

Στο Supabase Dashboard → Storage → project-files → Policies:

### Policy 1: Users can upload their own files
```sql
CREATE POLICY "Users can upload own files"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (bucket_id = 'project-files' AND auth.uid()::text = (storage.foldername(name))[1]);
```

### Policy 2: Users can read their own files
```sql
CREATE POLICY "Users can read own files"
ON storage.objects FOR SELECT
TO authenticated
USING (bucket_id = 'project-files' AND auth.uid()::text = (storage.foldername(name))[1]);
```

⚠️ **Σημείωση:** Επειδή χρησιμοποιούμε Clerk (όχι Supabase Auth), τα uploads γίνονται με anon key και η πρόσβαση για server-side ανάγνωση γίνεται με service role key.

Για Clerk + Supabase storage, απλοποιημένη policy:
```sql
-- Allow all authenticated uploads (Clerk handles auth at API level)
CREATE POLICY "Allow uploads"
ON storage.objects FOR INSERT
TO anon
WITH CHECK (bucket_id = 'project-files');

CREATE POLICY "Service role reads all"
ON storage.objects FOR SELECT
TO service_role
USING (bucket_id = 'project-files');
```

## 3. Env Variables

Πρόσθεσε στο `.env.local`:
```
NEXT_PUBLIC_SUPABASE_URL=https://[PROJECT].supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJ...
SUPABASE_SERVICE_ROLE_KEY=eyJ...
```

Βρες τα στο: Supabase Dashboard → Settings → API

## 4. Install Supabase JS

```bash
npm install @supabase/supabase-js
```

## Folder Structure στο Storage

Τα αρχεία αποθηκεύονται ως:
```
project-files/
  {clerkUserId}/
    {timestamp}_{projectName}/
      κάτοψη_ισογείου.pdf
      ηλεκτρολογικά.pdf
      υδραυλικά.dwg
      ...
```
