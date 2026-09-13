---
name: lmg-social
description: Use for Lifestyle Medicine Gateway (LMG) social media and content marketing work — social strategy, editorial/content calendars, platform-specific post creation (Facebook, Instagram, TikTok, Pinterest), content repurposing from website content, hooks/CTAs, vendor and practitioner content, analytics/experiments review, and website↔social conversion workflows. Not for unrelated application/engineering tasks.
---

# LMG Social Media Marketing Skill

This skill turns the LMG marketing knowledge base in [marketing/social/](../../../marketing/social/) into usable output: strategy input, content plans, platform-specific posts, calendars, and analytics/experiment reviews.

**This skill does not contain the marketing strategy.** The markdown files under `marketing/social/` are the single source of truth. This file tells Claude which of those files to read for a given task and how to apply them — it does not restate their content. If instructions here and a file under `marketing/social/` ever conflict, the file under `marketing/social/` wins; flag the conflict to the user rather than silently picking one.

## When to use this skill

Use it when the user asks for any of:
- Social strategy input or review
- Content planning / editorial calendar work
- Platform-specific post drafts (Facebook, Instagram, TikTok, Pinterest)
- Repurposing existing website content (articles, recipes, guides) into social assets
- Hooks, CTAs, or hashtag selection
- Vendor or practitioner spotlight content
- Turning social performance into a plan (analytics review, experiment design)
- Connecting a website page/article to a social push, or a social post back to a website destination

Don't use it for general application engineering, database, or infra work — see the root [CLAUDE.md](../../../CLAUDE.md) for that.

## Source-of-truth map

Start with **[marketing/social/marketing-agent.md](../../../marketing/social/marketing-agent.md)** — it defines the reading order and the task checklist this skill follows. In summary:

**Always read first** (strategic foundation):
- [social-strategy.md](../../../marketing/social/social-strategy.md) — business objectives, overall strategy
- [audience.md](../../../marketing/social/audience.md) — who LMG is talking to, incl. the Australian market
- [brand-voice.md](../../../marketing/social/brand-voice.md) — tone and personality
- [content-pillars.md](../../../marketing/social/content-pillars.md) — approved topic pillars
- [platform-strategy.md](../../../marketing/social/platform-strategy.md) — role of each platform
- [content-frameworks.md](../../../marketing/social/content-frameworks.md) — structural templates for posts
- [hooks.md](../../../marketing/social/hooks.md) — hook library
- [cta-library.md](../../../marketing/social/cta-library.md) — CTA library
- [content-engine.md](../../../marketing/social/content-engine.md) — topic → multi-asset production pipeline

**Read additionally, depending on task:**
- Platform-specific post: [instagram-strategy.md](../../../marketing/social/instagram-strategy.md), [facebook-strategy.md](../../../marketing/social/facebook-strategy.md), [tiktok-strategy.md](../../../marketing/social/tiktok-strategy.md), or [pinterest-strategy.md](../../../marketing/social/pinterest-strategy.md)
- Repurposing website content across channels: [content-repurposing.md](../../../marketing/social/content-repurposing.md)
- Calendar/scheduling work: [editorial-calendar.md](../../../marketing/social/editorial-calendar.md)
- Hashtags: [hashtag-strategy.md](../../../marketing/social/hashtag-strategy.md)
- Performance review or proposing a test: [analytics.md](../../../marketing/social/analytics.md), [experiments.md](../../../marketing/social/experiments.md)
- Orientation / business-model framing: [README.md](../../../marketing/social/README.md)

The exact filenames above were confirmed by inspecting the repo — if the user later adds or renames files under `marketing/social/`, re-check the directory rather than assuming this list is still accurate.

## Cross-cutting rules from `.agents/`

These are enforced, not optional, and apply to any social content this skill produces (they exist because generated posts can flow into the real publishing pipeline in `api/generate-posts.ts` / `api/buffer-auto-publish.ts`):

- **Product links**: always full absolute URLs — `https://www.lifestylemedicinegateway.com/products/[slug]` (never relative, never `/shop/...`). Same pattern for articles/recipes/guides. See [.agents/rules/social_media_product_links.md](../../../.agents/rules/social_media_product_links.md).
- **Vendor integrity**: never mix products from different vendors/brands in a single post. A vendor-scoped post links only to that vendor's products.
- **Images**: no watermarks, logos, or text-stamp overlays on generated images. See [.agents/rules/no_watermarks_on_images.md](../../../.agents/rules/no_watermarks_on_images.md).

## Workflow

1. **Identify the task type** — strategy, planning, platform post, repurposing, vendor content, or analytics/experiments — and read the source-of-truth files listed above for that type. Don't skip the "always read first" set even for a single-post request; brand voice and audience fit still apply.
2. **Anchor to the growth loop** (from `marketing/social/README.md`, also summarised in the root CLAUDE.md): `AUDIENCE → CORE TOPIC → WEBSITE CONTENT → SOCIAL CONTENT → WEBSITE TRAFFIC → EMAIL → PRODUCT DISCOVERY → PURCHASE → RETENTION`. Every piece of content should have a clear place in this loop and a real website destination (article, recipe, guide, product, or vendor page) — don't produce content that has no next step.
3. **Select** the content pillar (`content-pillars.md`), a framework (`content-frameworks.md`), a hook (`hooks.md`), and a CTA (`cta-library.md`) appropriate to the platform and objective.
4. **Adapt per platform** — do not copy the same post across Facebook, Instagram, TikTok, and Pinterest. Use each platform's strategy file to change structure, length, and format while keeping the same core idea (see `content-repurposing.md` for the canonical one-idea → many-assets pattern).
5. **Check vendor/product content** against the `.agents/` rules above before finalising.
6. **Run the quality-control checklist** below before delivering.

## Quality-control checklist

Before delivering any content, confirm:

- [ ] **Value** — does the audience learn something useful, not just get sold to?
- [ ] **Trust** — does this strengthen LMG's credibility as a wellness authority?
- [ ] **Relevance** — does it address a real audience problem from `audience.md`?
- [ ] **Brand** — does it sound like LMG's voice (`brand-voice.md`), not generic AI copy?
- [ ] **Platform fit** — is it adapted to the specific platform, not a copy-paste?
- [ ] **Conversion path** — is there a clear, logical next step (website, email, product)?
- [ ] **Health-claim safety** — see below.
- [ ] **Australian English** — spelling, terminology, and context are Australian throughout.
- [ ] **Link/vendor compliance** — absolute product URLs, single-vendor scope, no watermarked images.
- [ ] **No fabrication** — no invented products, vendors, testimonials, statistics, or research (see below).

## Responsible health content

LMG is a wellness/lifestyle platform, not a medical provider. Do not:
- Diagnose a condition or present content as personalised medical advice
- Guarantee a health outcome or claim a product cures/treats disease
- Tell users to replace professional medical treatment

Use qualified language: "may support", "is associated with", "research suggests", "can be part of a healthy lifestyle". Encourage professional consultation where appropriate. Full detail: `marketing/social/marketing-agent.md` and `marketing/social/README.md`.

## Avoid

- Generic, interchangeable AI-sounding content
- Clickbait hooks that overpromise relative to the content
- Unsupported or exaggerated health claims
- Inventing statistics, research, products, vendors, or testimonials — if a real one isn't known/available, say so and ask rather than fabricating
- Posting the same content verbatim across every platform
- Forcing a product mention into content where it isn't a natural fit
- Optimising for likes/vanity metrics over the objectives in `social-strategy.md`
