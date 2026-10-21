-- ============================================================
-- Migration: Create marketing_plan_state (admin only)
--
-- 20260903_create_marketing_plan_state.sql was never applied to the live database (checked
-- 2026-10-21), so the admin 90-day plan page (/plan-90, /api/plan-90) loaded empty and could
-- not save. That migration also created the table world-readable and world-writable, which
-- 20261001/20261021 security hardening then restricted. Do NOT run 20260903 on its own: this
-- file creates the same table with the admin-only policy from the start.
--
-- Note: /api/plan-90 checks for an admin session and then queries with SUPABASE_SERVICE_ROLE_KEY
-- (which bypasses RLS). If that env var is missing it falls back to the public key, and the
-- admin-only policy below will make the page load empty again.
--
-- Safe to run more than once.
-- ============================================================

CREATE TABLE IF NOT EXISTS public.marketing_plan_state (
  id TEXT PRIMARY KEY,
  state JSONB NOT NULL DEFAULT '{}'::jsonb,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

ALTER TABLE public.marketing_plan_state ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Allow public read access to marketing_plan_state" ON public.marketing_plan_state;
DROP POLICY IF EXISTS "Allow write access to marketing_plan_state" ON public.marketing_plan_state;
DROP POLICY IF EXISTS "Admins manage marketing_plan_state" ON public.marketing_plan_state;

CREATE POLICY "Admins manage marketing_plan_state" ON public.marketing_plan_state
  FOR ALL USING (public.is_admin()) WITH CHECK (public.is_admin());
