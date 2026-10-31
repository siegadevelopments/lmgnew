-- ============================================================
-- Migration: daily Shopify stock sync schedule
--
-- Calls the import-shopify-catalogue Edge Function's "sync" operation once a day, which sets each
-- imported variant in stock / out of stock from the vendor's Shopify store.
--
-- Run order (nothing here applies automatically):
--   1. Run 20261101_shopify_import.sql in the SQL Editor.
--   2. Pick a long random value and set it as the Edge Function secret SHOPIFY_SYNC_SECRET
--      (Supabase Dashboard > Edge Functions > Secrets).
--   3. Store the SAME value in Vault, once, in the SQL Editor (never commit it):
--        select vault.create_secret('<the same value>', 'shopify_sync_secret');
--   4. Deploy the function from an up-to-date main:
--        npx supabase functions deploy import-shopify-catalogue --project-ref usrtaxvjwidfxajbjlpj --use-api
--   5. Run this file in the SQL Editor.
--   6. Check: select jobname, schedule from cron.job where jobname = 'shopify-stock-sync';
--
-- 19:30 UTC is early morning in Melbourne (about 5:30am to 6:30am depending on daylight saving).
-- Safe to run more than once.
-- ============================================================

CREATE EXTENSION IF NOT EXISTS pg_cron;
CREATE EXTENSION IF NOT EXISTS pg_net;

DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM cron.job WHERE jobname = 'shopify-stock-sync') THEN
    PERFORM cron.unschedule('shopify-stock-sync');
  END IF;
END
$$;

SELECT cron.schedule(
  'shopify-stock-sync',
  '30 19 * * *',
  $job$
  SELECT net.http_post(
    url := 'https://usrtaxvjwidfxajbjlpj.supabase.co/functions/v1/import-shopify-catalogue',
    headers := jsonb_build_object(
      'Content-Type', 'application/json',
      'x-webhook-secret', (SELECT decrypted_secret FROM vault.decrypted_secrets WHERE name = 'shopify_sync_secret')
    ),
    body := '{"op": "sync"}'::jsonb,
    timeout_milliseconds := 120000
  );
  $job$
);
