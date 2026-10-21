-- ============================================================
-- Migration (step 1 of 2): functions for reading full profiles, incl. phone
--
-- Run this BEFORE deploying the code that calls these functions. It changes no permissions on
-- its own. Step 2 (20261021_hide_phone_from_signed_in_users.sql) runs after that deploy and
-- removes signed-in users' direct read access to profiles.phone.
--
-- get_my_profile():      the caller's own profile (profile, checkout and booking pages).
-- admin_list_profiles(): every profile, but only for admins (admin user list); empty otherwise.
--
-- Supabase grants EXECUTE on new public functions to anon by default, so anon is revoked
-- explicitly (the functions return nothing to anon anyway, but there's no reason to expose them).
--
-- Safe to run more than once.
-- ============================================================

CREATE OR REPLACE FUNCTION public.get_my_profile()
RETURNS SETOF public.profiles
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT * FROM public.profiles WHERE id = auth.uid();
$$;
REVOKE ALL ON FUNCTION public.get_my_profile() FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.get_my_profile() TO authenticated;

CREATE OR REPLACE FUNCTION public.admin_list_profiles()
RETURNS SETOF public.profiles
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT * FROM public.profiles WHERE public.is_admin();
$$;
REVOKE ALL ON FUNCTION public.admin_list_profiles() FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.admin_list_profiles() TO authenticated;
