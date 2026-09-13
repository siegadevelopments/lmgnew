# Lifestyle Medicine Gateway (LMG) — CLAUDE.md

## What this project is

Lifestyle Medicine Gateway is an Australian lifestyle medicine, wellness education, community, and marketplace platform. The site combines editorial content (articles, recipes, guides, studies, natural remedies) with a vendor marketplace (products, vendors, affiliates) and its own social media publishing pipeline.

## Application architecture (high level)

Full technical conventions live in [.agents/AGENTS.md](.agents/AGENTS.md) — **read that file before making backend, storage, or deployment decisions.** Summary:

- **Framework**: Next.js (App Router), Tailwind CSS v4, Radix UI, React Hook Form + Zod, TanStack Query.
- **Backend**: Supabase (Postgres + Auth). Cloudflare R2 is the preferred media store (not Supabase Storage). Stripe for payments.
- **Deployment**: Vercel (frontend). Supabase Edge Functions are deployed via CI/CD or the Supabase Dashboard, not the local CLI.
- **Content surfaces**: `app/articles`, `app/recipes`, `app/guides`, `app/studies`, `app/natural-remedies`, `app/products`, `app/vendors`, `app/media-package`.
- **Existing social publishing pipeline**: `api/generate-posts.ts`, `api/publish-social.ts`, `api/buffer-auto-publish.ts` push scheduled posts to Buffer. Content produced using the marketing skill below may flow into this pipeline, so the linking and vendor rules in `.agents/rules/` are not optional — they are enforced downstream.
- **Admin Marketing tab AI generation is live-wired to `marketing/social/`**: both `api/generate-posts.ts` (bulk post generation) and `api/ai-enhance.ts` (per-field "improve" + the "Generate Viral Post" flow) call `getMarketingContext()` from `api/_marketing-context.ts`, which reads the core strategy files (`social-strategy.md`, `audience.md`, `brand-voice.md`, `content-pillars.md`, `platform-strategy.md`, `content-frameworks.md`, `hooks.md`, `cta-library.md`, `hashtag-strategy.md`) straight off disk on every request and feeds them into the Gemini prompt. `vercel.json` `functions.includeFiles` ensures those `.md` files ship with those two serverless functions. Editing those files and redeploying is enough to change what the admin generator produces — no code change needed. If a new file should also ground generation, add it to `CORE_STRATEGY_FILES` in `api/_marketing-context.ts`.

This project previously used **Antigravity**; `.agents/AGENTS.md` and `.agents/rules/*.md` hold real, current project rules (image generation, social product links). Do not delete or convert these — Claude Code reads them directly via the references above. If/when it becomes valuable to fully port them into `.claude/` skills or hooks, that's a separate, deliberate migration — not something to do incidentally while working on other tasks.

## Marketing knowledge vs. Claude Code execution skills

Two different things live in this repo and should not be conflated:

- **`marketing/social/`** — the marketing **knowledge base**: strategy, audience, brand voice, content pillars/frameworks, hooks, CTAs, platform playbooks, editorial calendar, analytics, and experiments. This is a set of standing decisions about *what* LMG's social marketing should say and *why*. It is the source of truth — do not rewrite, restructure, or duplicate its content into other files.
- **`.claude/skills/lmg-social/SKILL.md`** — the Claude Code **execution skill**: instructions for *how* Claude should use the knowledge base to actually do marketing work (plan content, write platform-specific posts, build calendars, QC output). It references the knowledge base rather than repeating it.

When asked for social/marketing content, strategy, or planning, read the relevant files in `marketing/social/` (starting from `marketing/social/marketing-agent.md`, which already defines the source-of-truth reading order) before producing anything.

## The growth loop

All marketing and content work should trace back to this loop (defined in `marketing/social/README.md`):

```
AUDIENCE → CORE TOPIC → WEBSITE CONTENT → SOCIAL CONTENT → WEBSITE TRAFFIC → EMAIL → PRODUCT DISCOVERY → PURCHASE → RETENTION
```

Social media is the discovery/attention layer; the website is the owned content and commerce layer; email is retention; the marketplace is monetization. No content should be created "because a platform expects a post" — every piece needs a purpose in this loop.

**SEO/AEO note**: there is currently no dedicated SEO/AEO documentation in this repo. Until that exists, treat `marketing/social/content-engine.md` and `marketing/social/content-repurposing.md` as the closest thing to a topic→content pipeline. If SEO/AEO docs are added later, they slot in between CORE TOPIC and WEBSITE CONTENT in the loop above — don't invent filenames or content for them now.

## Australian market requirement

LMG targets Australian consumers. All content — website copy, social posts, emails — must use **Australian English** (spelling, terminology, tone) and reflect an Australian audience/context, per `marketing/social/audience.md`.

## Responsible health content

LMG is a wellness/lifestyle platform, not a medical provider. Never present content as personalised medical diagnosis or treatment, guarantee health outcomes, or claim a product cures disease. Use qualified language ("may support", "is associated with", "research suggests", "can be part of a healthy lifestyle") and point users to a healthcare professional where appropriate. Full detail is in `marketing/social/marketing-agent.md` and `marketing/social/README.md` — read them rather than relying on this summary alone.

## Working conventions

- **Inspect before modifying.** Read existing files (app code, `.agents/`, `marketing/social/`) before changing or adding to them. Don't assume filenames — verify them.
- **Avoid unnecessary rewrites.** Prefer the smallest change that accomplishes the task. Don't restructure existing documentation or code as a side effect of an unrelated task.
- **No duplication.** If something is already documented (in `.agents/`, `marketing/social/`, or elsewhere), reference it — don't copy it into a new file.
- **Test appropriate changes.** For application code changes, run the relevant checks/build before considering the task done. For content/documentation changes, sanity-check against the source-of-truth files above.
- **Do not modify** environment variables, credentials, database schemas, payment integrations, or production configuration as part of marketing/content work.
