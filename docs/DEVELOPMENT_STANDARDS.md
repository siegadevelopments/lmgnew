# LMG Development Standards (Security, Quality, Testing)

Apply these on **every** change to app code, API routes, Edge Functions, or database policies. They come
from the October 2026 security audit; each rule exists because the opposite was found in the codebase.

## 1. Definition of done

Before calling any code change finished:

1. `npm run verify` passes (typecheck → tests → build → dependency audit).
2. New or changed behaviour has a test (see §6). Security fixes need a regression test.
3. The relevant checklist in §7 has been walked through.
4. Anything you could not test (live Supabase, Stripe, Buffer, etc.) is stated explicitly in the PR/summary.

> `next.config.mjs` sets `typescript.ignoreBuildErrors: true`, so **`next build` does not type-check**.
> Always run `npm run typecheck` separately. `npm run lint` currently crashes (ESLint/ajv dependency
> error) — fix that before relying on it.

## 2. Authentication & authorization (most important)

**Never assume the caller is trustworthy.** The Supabase anon key is public and satisfies Supabase's default
`verify_jwt`, so a function with no in-code check is effectively open to the internet.

| Surface | Required pattern |
| --- | --- |
| Edge Function (user-triggered) | `const denied = await requireAuth(req, ["admin"], corsHeaders); if (denied) return denied;` from `supabase/functions/_shared/auth.ts`. Choose the narrowest roles: `admin`, `vendor`, `authenticated`, `service` (internal function-to-function calls with the service-role key). |
| Edge Function (webhook / DB trigger / inbound email) | `requireWebhookSecret(req, "ENV_NAME", corsHeaders)` — fails closed when the secret is unset. |
| Vercel `api/*.ts` | Verify the bearer token with `userClient.auth.getUser()`, then check `profiles.role` (see `api/admin-delete-order.ts`). Cron routes check `CRON_SECRET`. |
| Next route handler `app/api/**` | `const denied = await requireUser(req, "admin" \| "authenticated"); if (denied) return denied;` from `src/lib/server-auth.ts`. Client callers send `await authHeaders()` from `src/lib/auth-headers.ts`. |
| Public endpoint (intentional) | Use the **publishable** key so RLS applies, validate input, rate-limit, return generic errors. Never the service-role key. |

Rules:

- New endpoint ⇒ decide its auth model **first**, write it in the file's header comment, add the guard before any logic.
- The **service-role key bypasses RLS**. Use it only server-side, only after the caller is authorised, and never in public endpoints.
- Never trust the client for identity, role, price, or ownership. Re-derive from the verified session / database.
- Don't accept a caller-supplied URL and fetch/delete/sign it without a strict **hostname allow-list** (SSRF, arbitrary deletion). Parse with `new URL()`; never `includes()`/`split()` on the raw string.
- Don't let an endpoint send email to arbitrary recipients from arbitrary senders (open relay). Non-admins: own address only, fixed sender list.

## 3. Database & RLS

- Every table has RLS **enabled**. Never write `USING (true)` / `WITH CHECK (true)` for UPDATE/DELETE/ALL, and avoid it for SELECT unless the data is genuinely public (published articles, products).
- Policies must name the role/owner: `auth.uid() = user_id`, `public.is_admin()`, vendor ownership, etc.
- Role escalation: only admins may set `profiles.role = 'admin'` (trigger in `20261001_security_hardening.sql`). Don't add code paths that let a user write their own role.
- All schema/policy changes go in `supabase/migrations/` — the live database must be reproducible from the repo (currently it is **not**; most tables predate the migrations folder). When you touch a table, add its RLS to a migration.
- Migrations are idempotent (`IF NOT EXISTS`, `DROP POLICY IF EXISTS`) and never run locally against production; apply via Supabase dashboard/CI. Don't modify schemas as part of marketing/content work.
- After applying a policy migration, test as **anon**, **customer**, **vendor**, and **admin** (§6.3).

## 4. Input, output, and secrets

- **XSS**: render user/vendor HTML only via `sanitizeHtml()` (`src/lib/security.ts`; works on server and client, fails closed). JSON-LD only via `jsonLd()` (escapes `</script>`). Never interpolate user data into HTML emails — use `escapeHtml()`. Strip CR/LF from anything that becomes an email header/subject.
- Validate request bodies (type, length, UUID format) at the boundary; prefer Zod. Return generic error messages to clients; log details server-side.
- **Secrets** live only in Vercel/Supabase environment settings. Never commit keys, tokens, `.env*`, or paste them into scripts (`scripts/*.mjs` must read `process.env`). Only `NEXT_PUBLIC_*` values reach the browser — never give a secret that prefix. Don't use `VITE_`-prefixed names for new secrets (legacy only).
- Before committing: `git diff --staged | grep -iE "sk_live|whsec_|service_role|eyJ"` — investigate every hit.
- Never log tokens, full payloads containing PII, or auth headers.

## 5. Dependencies

- `npm run audit:prod` must show **no high/critical** findings; fix with `npm audit fix` (review lockfile diff) before merging.
- Add a dependency only when needed; prefer well-maintained packages; check `npm audit` after installing.
- Keep Next.js on the latest patched minor — it was found on a version with a critical RCE advisory.
- Known accepted risk: `quill` (low, HTML export feature) — output is sanitised on render; revisit on upgrade.

## 6. Testing

### 6.1 Commands

```bash
npm run typecheck    # tsc --noEmit (the build does NOT type-check)
npm run test         # vitest unit/security tests (src/**/*.test.ts)
npm run build        # production build
npm run audit:prod   # npm audit, fails on high/critical
npm run verify       # all of the above, in order
```

### 6.2 What to test

- **Pure logic / security helpers**: Vitest, colocated in `__tests__/`. Existing example: `src/lib/__tests__/security.test.ts` (sanitiser + JSON-LD). Add tests for any new validator, parser, allow-list, or sanitiser.
- **Regression test for every vulnerability fixed** — encode the exploit string as the test input.
- **API/Edge guards**: for every new endpoint verify these four cases (curl, or a test against a Supabase *dev/branch* project, never production data):
  1. no `Authorization` header → 401
  2. anon key only → 401/403
  3. valid user, wrong role → 403
  4. correct role → 200 and expected effect
- **UI changes**: run the app (`npm run dev`) and exercise the golden path plus one failure path; check the browser console and network tab.

### 6.3 RLS verification (after any policy change)

Run in the Supabase SQL editor, impersonating each role:

```sql
set local role anon;                                    -- repeat: authenticated (+ set request.jwt.claims)
select count(*) from public.chat_messages;              -- expect only what that role may see
```

Confirm anon cannot read/write private tables, a user cannot read another user's rows, and a non-admin cannot set `profiles.role = 'admin'`.

### 6.4 Payments, email, social

- Stripe: use test keys and the Stripe CLI to replay webhooks; webhook handlers must verify the signature and be idempotent; never create/mark orders as paid from client input.
- Email/social (`send-email`, Buffer): test against a sandbox/own address; follow `.agents/rules/` for product-link and vendor rules.

## 7. Pre-merge checklists

**Any change**
- [ ] `npm run verify` green; no `console.log` of secrets/PII added
- [ ] Australian English in user-facing copy; responsible-health language rules respected (see `CLAUDE.md`)
- [ ] Smallest change that solves the task; no unrelated refactors

**New/changed endpoint or Edge Function**
- [ ] Auth guard present and as narrow as possible (§2)
- [ ] Inputs validated; URLs allow-listed; no arbitrary recipients/fields passed straight to the DB (`update(updatedFields)` needs a field allow-list)
- [ ] CORS is not widened; errors are generic; rate-limit considered for anything public or costing money (AI, email)
- [ ] Callers updated to send the user's session token
- [ ] Any new env var documented below and set in Vercel/Supabase **before** deploy

**New/changed table or policy**
- [ ] RLS enabled, no `true` policies on writes, migration committed (§3)
- [ ] Tested as anon / customer / vendor / admin (§6.3)

**Rendering user content**
- [ ] `sanitizeHtml` / `jsonLd` / `escapeHtml` used; no raw `dangerouslySetInnerHTML`

## 8. Required environment variables introduced by the audit

Set these **before** deploying the corresponding functions, otherwise they fail closed (500/401):

| Variable | Where | Used by |
| --- | --- | --- |
| `WEBHOOK_SECRET` | Supabase Edge Function secrets | `notify-admin` — send it as `x-webhook-secret` header (or `?token=`) from the Database Webhook |
| `INBOUND_EMAIL_SECRET` | Supabase Edge Function secrets | `process-inbound-email` — configure the same value in the email provider's webhook URL (`?token=…`) |
| `R2_ENDPOINT` (optional) | Vercel | `app/api/upload-proxy` extra allowed host |
| `META_ADS_TOKEN` | Vercel (server only) | `api/ads-meta.ts`, `api/ads-sync.ts` — Meta System User token with `ads_management`, `ads_read`, `business_management`, `pages_read_engagement` |
| `META_AD_ACCOUNT_ID` | Vercel | Admin > Meta Ads — the ad account (`act_` prefix optional) |
| `META_PIXEL_ID` (optional) | Vercel | Admin > Meta Ads — falls back to `NEXT_PUBLIC_META_PIXEL_ID` |
| `META_INSTAGRAM_USER_ID`, `META_GRAPH_VERSION` (optional) | Vercel | Admin > Meta Ads — Instagram account for ads; Graph API version (default `v23.0`) |
| `SHOPIFY_SYNC_SECRET` | Supabase Edge Function secrets (and the same value in Vault as `shopify_sync_secret`) | `import-shopify-catalogue` `sync` operation, called daily by `pg_cron` — see `supabase/migrations/20261101_shopify_sync_schedule.sql` for the run order |

Edge Functions import `supabase/functions/_shared/auth.ts`; deploy the whole `supabase/functions` directory
(CI or `supabase functions deploy`) so `_shared` is bundled.

## 9. Known open items (track until closed)

- **Migrations in `supabase/migrations/` are not applied automatically.** `20261001_security_hardening.sql` sat unapplied for three weeks (found 2026-10-21; applied via `20261021_apply_security_hardening.sql`). After merging a migration, run it in the SQL Editor and verify it live (e.g. query `pg_policies` / `pg_trigger`).
- **`profiles.phone` is readable only through `get_my_profile()` / `admin_list_profiles()`** once `20261021_hide_phone_from_signed_in_users.sql` is applied (after the code using `src/lib/profile-reads.ts` is deployed). Don't select `phone` or `*` from `profiles` directly; `src/lib/__tests__/profile-phone.test.ts` enforces this.
- **Live policies are snapshotted, not migrated.** `supabase/live-security-snapshot.md` holds the 2026-10-21 export, its findings, the still-open items, and the query to refresh it. Refresh it after any policy change made outside `supabase/migrations/`.
- `process-inbound-email` inserts content authored by a hard-coded system user id and feeds email text to an LLM — review for prompt-injection and auto-publish status (should land as **draft**).
- Edge Functions use `Access-Control-Allow-Origin: *`; restrict to the site origin where browsers are the only callers.
- Per-user rate limiting for AI endpoints (`generate-ai-content`, `generate-ai-image`, `ai-chat`) — current limiter is per-instance and best effort.
- `ESLint` crashes (dependency issue); `ignoreBuildErrors` is on. Fix both, then add lint to `verify`.
- Root-level scratch files (`test-*.mjs`, `response.html`, `scratch/`) should be reviewed and removed or git-ignored; scan git history for committed secrets (e.g. `gitleaks detect`).
- Stripe webhook and `create-checkout-session` were **not** audited in depth — do this next (signature check, server-side price lookup, idempotency).
