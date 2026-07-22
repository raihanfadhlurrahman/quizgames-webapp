-- ==========================================
-- FIX RLS POLICY FOR QUESTIONS TABLE IN SUPABASE
-- Run this in Supabase SQL Editor:
-- ==========================================
ALTER TABLE public.questions ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Allow public read questions" ON public.questions;
DROP POLICY IF EXISTS "Allow admin all questions" ON public.questions;
DROP POLICY IF EXISTS "Allow all access to questions" ON public.questions;

CREATE POLICY "Allow all access to questions" ON public.questions FOR ALL USING (true) WITH CHECK (true);
