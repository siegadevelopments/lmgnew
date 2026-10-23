-- ============================================================
-- Migration: Supabase Storage "media" uploads only into your own folder
--
-- "Auth Upload" let any signed-in user upload anything anywhere in the public "media" bucket.
-- Uploads normally go to Cloudflare R2 (src/lib/upload.ts); Supabase Storage is only the fallback
-- when R2 fails. The app always uploads to "<folder>/<user id>/<file>" (avatars/, products/,
-- stores/, articles/, videos/), except admin-only folders (admin_uploads/, affiliates/, and
-- products/<vendor id>/ from the admin dashboard).
--
-- New rule: signed-in users may upload only where the second path segment is their own id;
-- admins anywhere. Public read access is unchanged.
--
-- Safe to run more than once.
-- ============================================================

DROP POLICY IF EXISTS "Auth Upload" ON storage.objects;
DROP POLICY IF EXISTS "Upload to own media folder" ON storage.objects;
CREATE POLICY "Upload to own media folder" ON storage.objects
  FOR INSERT TO authenticated
  WITH CHECK (
    bucket_id = 'media'
    AND ((storage.foldername(name))[2] = auth.uid()::text OR public.is_admin())
  );
