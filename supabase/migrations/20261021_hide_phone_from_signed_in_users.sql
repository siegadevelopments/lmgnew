-- ============================================================
-- Migration (step 2 of 2): signed-in users can no longer read other users' phone numbers
--
-- Run AFTER 20261021_profile_read_functions.sql AND after the code that uses get_my_profile()
-- and admin_list_profiles() is deployed. Before that deploy, the profile, checkout and booking
-- pages and the admin user list still read profiles.phone directly and would break.
--
-- Postgres column permissions can't be limited to "your own row", so phone is removed from
-- direct reads for every signed-in user; own-profile and admin reads go through the functions.
-- Every other column stays readable (review names, roles for admin checks, etc.).
-- Anonymous visitors were already limited to id, full_name, avatar_url, role.
--
-- Safe to run more than once.
-- ============================================================

REVOKE SELECT ON public.profiles FROM authenticated;

DO $$
DECLARE
  cols text;
BEGIN
  SELECT string_agg(quote_ident(column_name), ', ' ORDER BY ordinal_position)
    INTO cols
    FROM information_schema.columns
   WHERE table_schema = 'public' AND table_name = 'profiles' AND column_name <> 'phone';
  EXECUTE format('GRANT SELECT (%s) ON public.profiles TO authenticated', cols);
END $$;
