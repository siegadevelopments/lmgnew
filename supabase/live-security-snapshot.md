# Live database security snapshot

Exported from the production database on 2026-10-21 (before `20261022_tighten_rls.sql`), with
the query in "How to refresh" below. Several rules here were never in `supabase/migrations/`,
which is how the October hardening went unapplied for three weeks unnoticed. This file is a
reference for audits, not a migration: don't run it.

## Findings from this snapshot (2026-10-21)

| Issue | Fixed by |
| --- | --- |
| `admin_update_user_email()` / `admin_delete_user()` executable by anonymous visitors (SECURITY DEFINER) | Revoked by hand 2026-10-21; recorded in `20261022_tighten_rls.sql` |
| `vendor_withdrawals` admin policy trusted `user_metadata.role`, which users can set themselves | `20261022_tighten_rls.sql` |
| `orders` / `order_items` accepted inserts from anyone | `20261022_tighten_rls.sql` |
| Vendors could set their own `is_approved`, `commission_rate`, `is_live` | `20261022_tighten_rls.sql` (trigger) |
| Anonymous visitors could read `commission_rate`, `ai_instructions` | `20261022_tighten_rls.sql` |
| Drafts and archived products readable by everyone | `20261022_tighten_rls.sql` |
| Notifications insertable by anyone with any link | `20261022_tighten_rls.sql` (site links only) |
| Vendor live stream wrote `vendor_profiles.is_live`, hiding the store when a stream ended | `VendorLiveStream.tsx` |
| Any signed-in user could create publicly visible articles, recipes and galleries | `20261022_restrict_content_publishing.sql` (admins and approved stores only) |
| Vendors could edit any column of their own order lines | `20261022_order_items_vendor_columns.sql` (status and tracking only) |
| Any signed-in user could upload anywhere in the `media` bucket | `20261023_media_uploads_own_folder.sql` (own folder; admins anywhere) |

Still open (lower risk):
- Guest support chat (`customer_id` and `vendor_id` both null) readable by anyone.
- Duplicate policies (bookings, galleries, gallery_items, chat) are harmless but noisy.

## Row level security

Enabled on every public table: affiliate_stores, articles, bookings, categories,
chat_conversations, chat_messages, contact_messages, galleries, gallery_items,
marketing_plan_state, newsletter_subscribers, notifications, order_items, orders, popups,
product_categories, products, profiles, recipes, reviews, scheduled_posts, service_availability,
vendor_earnings, vendor_follows, vendor_profiles, vendor_streams, vendor_withdrawals, videos,
wishlists.

## SECURITY DEFINER functions

adjust_order_stock, admin_delete_user, admin_list_profiles, admin_update_user_email,
check_vendor_order_access, get_admin_users, get_my_profile, handle_new_user,
handle_order_item_notifications, is_admin, notify_vendor_of_new_order,
prevent_admin_self_promotion, vendor_booking_contacts
(plus protect_vendor_admin_columns after `20261022_tighten_rls.sql`).

Any new SECURITY DEFINER function must `REVOKE ALL ... FROM PUBLIC, anon` and grant only the
roles that need it: Supabase grants new public functions to `anon` by default.

## Triggers

- `order_items`: on_new_order_item (notify_vendor_of_new_order), on_order_item_notification (handle_order_item_notifications)
- `profiles`: trg_prevent_admin_self_promotion, update_profiles_updated_at
- `vendor_profiles`: trg_generate_vendor_slug, update_vendor_profiles_updated_at (+ trg_protect_vendor_admin_columns)
- `updated_at` triggers on articles, categories, orders, products, recipes, reviews

## Policies (as exported)

The full `CREATE POLICY` list is in `live-security-snapshot.policies.sql`.

## How to refresh

Run in the Supabase SQL Editor, export as CSV, and replace the policy file:

```sql
select line from (
  select 1 as sort, format('-- RLS %s on %I', case when c.relrowsecurity then 'ENABLED' else 'DISABLED' end, c.relname) as line
    from pg_class c join pg_namespace n on n.oid = c.relnamespace
   where n.nspname = 'public' and c.relkind = 'r'
  union all
  select 2, format('CREATE POLICY %I ON public.%I AS %s FOR %s TO %s%s%s;',
           policyname, tablename, permissive, cmd, array_to_string(roles, ', '),
           coalesce(' USING (' || qual || ')', ''), coalesce(' WITH CHECK (' || with_check || ')', ''))
    from pg_policies where schemaname in ('public', 'storage')
  union all
  select 3, format('-- %s function public.%s(%s)', case when p.prosecdef then 'SECURITY DEFINER' else 'invoker' end,
           p.proname, pg_get_function_identity_arguments(p.oid))
    from pg_proc p join pg_namespace n on n.oid = p.pronamespace where n.nspname = 'public'
  union all
  select 4, format('-- trigger %s on %s: %s', t.tgname, t.tgrelid::regclass, pg_get_triggerdef(t.oid))
    from pg_trigger t join pg_class c on c.oid = t.tgrelid join pg_namespace n on n.oid = c.relnamespace
   where n.nspname = 'public' and not t.tgisinternal
) s order by sort, line;
```
