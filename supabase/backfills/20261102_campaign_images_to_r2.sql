-- ============================================================
-- Migration: point the November 2026 campaign images at Cloudflare R2
--
-- The six campaign photos were served by Vercel from www.lifestylemedicinegateway.com/marketing/2026-11/.
-- When Vercel paused the account (2026-11-01) every post image that pointed there broke. They are now also
-- hosted on R2 at media.lifestylemedicinegateway.com/marketing/2026-11/ (byte-identical copies), which does
-- not depend on Vercel. This swaps the host prefix on rows that already store the old URLs.
--
-- Only the prefix changes; nothing else on a row is touched. Safe to run more than once.
-- Check afterwards (expect 0 and 0):
--   select count(*) from scheduled_posts where image_url like 'https://www.lifestylemedicinegateway.com/marketing/%';
--   select count(*) from ad_campaigns   where image_url like 'https://www.lifestylemedicinegateway.com/marketing/%';
-- ============================================================

BEGIN;

UPDATE public.scheduled_posts
SET image_url = replace(
  image_url,
  'https://www.lifestylemedicinegateway.com/marketing/2026-11/',
  'https://media.lifestylemedicinegateway.com/marketing/2026-11/'
)
WHERE image_url LIKE 'https://www.lifestylemedicinegateway.com/marketing/2026-11/%';

UPDATE public.ad_campaigns
SET image_url = replace(
  image_url,
  'https://www.lifestylemedicinegateway.com/marketing/2026-11/',
  'https://media.lifestylemedicinegateway.com/marketing/2026-11/'
)
WHERE image_url LIKE 'https://www.lifestylemedicinegateway.com/marketing/2026-11/%';

COMMIT;
