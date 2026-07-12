-- Run in Supabase Dashboard → SQL Editor after creating project "boqnow"
-- Region: EU Central (Frankfurt)

-- Storage bucket (or create via UI: Storage → New bucket)
-- Name: project-files | Public: OFF | Size limit: 104857600 (100MB)

-- RLS policies for Clerk auth (uploads via anon key, reads via service role)
CREATE POLICY "Allow uploads"
ON storage.objects FOR INSERT
TO anon
WITH CHECK (bucket_id = 'project-files');

CREATE POLICY "Service role reads"
ON storage.objects FOR SELECT
TO service_role
USING (bucket_id = 'project-files');
