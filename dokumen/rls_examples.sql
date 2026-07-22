-- RLS example for `questions` table

-- Allow public read
CREATE POLICY "public_read_questions" ON public.questions
  FOR SELECT
  USING (true);

-- Allow admin insert/update/delete when JWT contains role = 'admin'
-- Note: Adjust claim access method depending on Supabase version. This example uses request.jwt.claims
CREATE POLICY "admin_write_questions" ON public.questions
  FOR INSERT, UPDATE, DELETE
  USING (
    current_setting('request.jwt.claims', true) ->> 'role' = 'admin'
  );

-- If you prefer to check app_metadata or a custom claim, adapt accordingly.
