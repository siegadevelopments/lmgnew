/**
 * LMG's marketing/social/*.md strategy docs, embedded at commit time rather
 * than read from disk at request time.
 *
 * We first tried reading these files live via fs.readFileSync inside these
 * serverless functions, relying on Vercel's automatic file tracing to bundle
 * marketing/social/*.md alongside them. In production that broke
 * api/generate-posts and api/ai-enhance outright (requests never reached our
 * try/catch fallback — Vercel routed them to Next.js's own /500 page instead
 * of invoking the function), while every other /api route kept working fine.
 * Embedding the content directly removes that runtime filesystem dependency
 * entirely, trading live-editing for reliability.
 *
 * IMPORTANT: editing marketing/social/*.md no longer changes what the admin
 * Marketing tab generates until this file is regenerated. Re-run the
 * generation step below (or ask Claude Code to refresh this file) whenever
 * social-strategy.md, audience.md, brand-voice.md, content-pillars.md,
 * platform-strategy.md, content-frameworks.md, hooks.md, cta-library.md, or
 * hashtag-strategy.md change, then commit + redeploy.
 *
 * To regenerate: read those 9 files from marketing/social/ and rebuild the
 * MARKETING_CONTEXT template literal below as "### filename\n\n<content>"
 * blocks joined by "\n\n---\n\n", in the order listed above.
 */
const MARKETING_CONTEXT = `### social-strategy.md

# Lifestyle Medicine Gateway — Social Media Strategy

## ROLE

Act as the senior social media strategist for Lifestyle Medicine Gateway.

Your objective is to develop a sustainable, high-trust, conversion-focused social media presence.

---

# 1. BUSINESS OBJECTIVES

Primary objectives:

1. Increase brand awareness in Australia.
2. Establish LMG as a trusted lifestyle medicine and wellness resource.
3. Build an engaged wellness community.
4. Drive qualified traffic to the LMG website.
5. Grow the email database.
6. Increase marketplace product discovery.
7. Help vendors gain exposure.
8. Generate purchases.
9. Increase repeat purchases.

---

# 2. MARKETING FUNNEL

Use this funnel:

## Awareness

Social content reaches people who have a wellness problem or goal.

↓

## Interest

The person consumes useful content.

↓

## Trust

LMG demonstrates expertise, practical knowledge, transparency and authentic human stories.

↓

## Website

The user visits LMG.

↓

## Education

The user reads an article, recipe, guide, interview or wellness resource.

↓

## Email

The user joins the LMG email ecosystem.

↓

## Discovery

Relevant products, vendors or wellness resources are introduced.

↓

## Conversion

The user purchases or takes another meaningful action.

↓

## Retention

LMG continues providing valuable content and relevant recommendations.

---

# 3. CONTENT RATIO

Default guideline:

80% value
20% commercial

Commercial content should still provide value.

Example:

BAD:

> Buy our wellness products.

BETTER:

> What should you look for when choosing a magnesium product?

Then introduce relevant products.

---

# 4. CORE CONTENT TYPES

Prioritize:

* Educational
* Practical
* Search-driven
* Storytelling
* Expert content
* Vendor content
* Recipes
* Community
* Product education
* Seasonal content
* User-generated content

---

# 5. CONTENT QUALITY STANDARD

Every post should answer at least one question:

* Does this teach something?
* Does this solve a problem?
* Does this help someone make a decision?
* Does this inspire a healthier action?
* Does this start a meaningful conversation?
* Does this demonstrate LMG's credibility?
* Does this help users discover something useful?

If the answer is no, reconsider the content.

---

# 6. CONVERSION PRINCIPLE

Do not force every post to sell.

Use natural progression:

Problem
→ Education
→ Trust
→ Solution
→ Relevant product/service

---

# 7. AUSTRALIAN MARKET

Use Australian English.

Avoid overly American language.

Where appropriate, reference:

* Australian lifestyle
* Australian seasons
* Australian food
* Australian wellness concerns
* Australian businesses
* Australian vendors
* Australian practitioners
* Australian consumer expectations

---

# 8. BRAND POSITIONING

LMG should feel:

* Helpful
* Modern
* Credible
* Human
* Practical
* Positive
* Evidence-aware
* Inclusive
* Community-oriented

It should NOT feel:

* Pushy
* Fear-based
* Pseudoscientific
* Corporate
* Cold
* Overly clinical
* "Influencer-y"

---

# 9. PRIMARY KPI

The ultimate KPI is not followers.

Prioritize:

1. Qualified website traffic
2. Email subscribers
3. Product views
4. Add-to-cart
5. Purchases
6. Revenue
7. Repeat purchases

Secondary:

* Reach
* Watch time
* Saves
* Shares
* Comments
* Profile visits

---

### audience.md

# Lifestyle Medicine Gateway — Audience

## PRIMARY AUDIENCE

Health-conscious Australian adults interested in improving their everyday health through lifestyle.

Approximate core age range:

35–65+

The audience is not defined only by age.

The strongest segmentation is based on wellness goals and problems.

---

# PRIMARY NEEDS

The audience commonly wants:

* Better energy
* Better sleep
* Better nutrition
* Healthy ageing
* Weight management
* Better gut health
* Stress management
* Improved wellbeing
* Menopause support
* Brain health
* Heart health
* More sustainable healthy habits

---

# AUDIENCE SEGMENT 1 — HEALTHY AGEING

Typical concerns:

* Maintaining muscle
* Staying active
* Maintaining independence
* Cognitive health
* Heart health
* Nutrition
* Longevity
* Quality of life

Content themes:

* Healthy ageing habits
* Strength and mobility
* Nutrition
* Sleep
* Brain health
* Social connection
* Lifestyle medicine

---

# AUDIENCE SEGMENT 2 — WOMEN'S WELLNESS

Important themes:

* Menopause
* Sleep
* Energy
* Weight management
* Nutrition
* Stress
* Healthy ageing

Content should be educational and empowering.

Avoid fear-based messaging.

---

# AUDIENCE SEGMENT 3 — GUT HEALTH

Interests:

* Fibre
* Fermented foods
* Probiotics
* Prebiotics
* Digestion
* Nutrition
* Gut-brain connection

---

# AUDIENCE SEGMENT 4 — SLEEP & RECOVERY

Problems:

* Difficulty falling asleep
* Waking during the night
* Poor sleep quality
* Daytime fatigue
* Stress

Content should focus on practical lifestyle strategies.

---

# AUDIENCE SEGMENT 5 — STRESS & WELLBEING

Themes:

* Stress
* Mindfulness
* Recovery
* Work-life balance
* Movement
* Sleep
* Social connection

---

# AUDIENCE SEGMENT 6 — WELLNESS SHOPPERS

Interested in:

* Wellness products
* Healthy food
* Supplements
* Natural products
* Personal care
* Fitness and recovery
* Lifestyle products

They need education and trust before purchasing.

---

# AUDIENCE PAIN POINTS

Common thoughts:

> "I know I should be healthier, but I don't know where to start."

> "There is too much conflicting health information online."

> "I don't know which wellness products I can trust."

> "I want to age well."

> "I don't have time to completely change my lifestyle."

> "I want practical advice, not complicated health information."

---

# AUDIENCE DESIRED OUTCOME

Move users from:

"I don't know what to do."

to:

"I know the next healthy step I can take."

---

# CONTENT LANGUAGE

Use:

* Simple explanations
* Practical steps
* Real examples
* Clear headlines
* Short paragraphs
* Human language

Avoid unnecessary jargon.

---

# AUDIENCE EMOTIONAL DRIVERS

Use:

* Hope
* Empowerment
* Curiosity
* Confidence
* Belonging
* Progress

Avoid:

* Fear
* Shame
* Guilt
* Medical panic
* Unrealistic promises

---

### brand-voice.md

# Lifestyle Medicine Gateway — Brand Voice

## VOICE

LMG should sound like:

> A knowledgeable, approachable wellness guide who helps people make better everyday decisions.

---

# PERSONALITY

The brand is:

* Warm
* Intelligent
* Practical
* Encouraging
* Modern
* Human
* Credible

---

# WRITING STYLE

Prefer:

> "Here are three simple ways to improve your sleep."

Instead of:

> "Unlock the ultimate secrets to transformative sleep!"

Prefer:

> "Small changes can make healthy habits easier to maintain."

Instead of:

> "Transform your life overnight!"

---

# DO

* Explain clearly.
* Be practical.
* Use evidence-aware language.
* Give users an actionable next step.
* Be encouraging.
* Make complicated concepts understandable.
* Use Australian English.

---

# DON'T

Do not:

* Overpromise
* Use clickbait
* Shame users
* Use fear
* Make unsupported medical claims
* Sound like a supplement salesman
* Sound like a medical textbook
* Overuse emojis
* Use excessive exclamation marks

---

# HOOK STYLE

Hooks should create curiosity without deception.

GOOD:

> "You may be overlooking this simple part of your morning routine."

> "Why are you still tired after getting eight hours of sleep?"

> "Three everyday habits that can support better sleep."

BAD:

> "Doctors DON'T want you to know this!"

> "This one trick will change your life!"

---

# CTA STYLE

Use conversational CTAs.

Examples:

> "Save this for later."

> "Which one would you try first?"

> "Read the full guide on Lifestyle Medicine Gateway."

> "Explore the products available from our wellness marketplace."

---

# HEALTH CLAIM LANGUAGE

Prefer:

* may support
* can help support
* is associated with
* research suggests
* may be beneficial
* can be part of

Avoid absolute claims such as:

* cures
* prevents
* guarantees
* eliminates
* treats

unless the claim is properly substantiated and legally appropriate.

---

### content-pillars.md

# Lifestyle Medicine Gateway — Content Pillars

## PILLAR 1 — HEALTHY AGEING

Topics:

* Longevity
* Mobility
* Strength
* Brain health
* Heart health
* Nutrition
* Social connection
* Healthy habits

Example topics:

* 5 habits that support healthy ageing
* Why muscle matters as we age
* Everyday habits for brain health
* How to stay active as you get older

---

# PILLAR 2 — WOMEN'S WELLNESS

Topics:

* Menopause
* Sleep
* Nutrition
* Stress
* Energy
* Weight management
* Healthy ageing

Example:

> What changes during menopause?

> Nutrition habits worth focusing on during menopause.

---

# PILLAR 3 — GUT HEALTH

Topics:

* Fibre
* Fermented foods
* Prebiotics
* Probiotics
* Digestion
* Gut-brain connection

---

# PILLAR 4 — SLEEP & RECOVERY

Topics:

* Sleep hygiene
* Evening routines
* Stress
* Recovery
* Morning routines
* Exercise and sleep

---

# PILLAR 5 — STRESS & WELLBEING

Topics:

* Stress management
* Mindfulness
* Movement
* Breathing
* Recovery
* Social connection

---

# PILLAR 6 — NUTRITION & RECIPES

Topics:

* Healthy recipes
* High-fibre meals
* Protein
* Mediterranean-style eating
* Healthy snacks
* Seasonal Australian food

Recipes are especially important for Pinterest.

---

# PILLAR 7 — PRODUCTS & WELLNESS DISCOVERY

Do not simply promote products.

Use:

Problem
→ Education
→ What to look for
→ Product discovery

Examples:

* What to look for in a magnesium product
* How to choose a quality wellness product
* Questions to ask before buying supplements

---

# PILLAR 8 — PEOPLE & STORIES

Use:

* Vendor interviews
* Practitioner interviews
* Founder stories
* Customer stories
* Behind the scenes
* Community stories

Human content should be prioritized.

---

# CONTENT MIX

Default starting mix:

25% Education
15% Healthy ageing
15% Nutrition/recipes
15% Women's wellness
10% Gut health
10% Sleep/stress
10% Product/vendor discovery

Adjust based on performance data.

---

### platform-strategy.md

# Platform Strategy

## FACEBOOK

### PRIMARY ROLE

Community and relationship building.

### Best content:

* Discussion posts
* Educational posts
* Articles
* Recipes
* Videos
* Vendor stories
* Polls
* Community questions

### Objective

Build an engaged audience that trusts LMG.

---

# INSTAGRAM

### PRIMARY ROLE

Visual discovery and brand building.

### Priority formats:

1. Reels
2. Carousels
3. Stories
4. Static graphics

### Best content:

* Short educational videos
* Wellness tips
* Recipes
* Infographics
* Expert clips
* Vendor interviews
* Product education

### Objective

Reach new people and build brand affinity.

---

# TIKTOK

### PRIMARY ROLE

Discovery and search-driven short-form education.

### Content should answer questions people actually search.

Examples:

> How can I improve my gut health?

> Why am I always tired?

> What happens during menopause?

> How can I sleep better?

### Priority:

* Strong first 1–3 seconds
* Clear on-screen topic
* Human delivery
* Practical information
* Fast pacing
* Captions

---

# PINTEREST

### PRIMARY ROLE

Evergreen discovery and website traffic.

Pinterest should be treated as a visual search engine.

### Best content:

* Recipes
* Checklists
* Guides
* Infographics
* Wellness routines
* Healthy ageing tips
* Menopause resources
* Sleep guides

Every useful pin should ideally lead to an LMG website destination.

---

# PLATFORM RULE

One core idea can be reused.

Do not duplicate the exact presentation.

Adapt:

* Hook
* Length
* Format
* CTA
* Caption
* Visual style

for each platform.

---

### content-frameworks.md

# Content Frameworks

## FRAMEWORK 1 — PROBLEM → SOLUTION

Hook:

> Struggling with [problem]?

Explain:

Why it may happen.

Provide:

3 practical steps.

CTA:

> Save this for later.

---

# FRAMEWORK 2 — 3 THINGS

> 3 things you can do to support better sleep.

Simple.

Fast.

Shareable.

---

# FRAMEWORK 3 — MYTH VS FACT

MYTH:

> "Healthy ageing means slowing down."

FACT:

Explain the more nuanced reality.

CTA:

> Share this with someone who would find it useful.

---

# FRAMEWORK 4 — CHECKLIST

> Your Sunday wellness checklist.

Include:

* Meal preparation
* Movement
* Sleep routine
* Planning
* Recovery

---

# FRAMEWORK 5 — EXPERT ANSWER

Question:

> "What's one lifestyle change you recommend most?"

Expert:

60-second answer.

This is ideal for vendors and practitioners.

---

# FRAMEWORK 6 — STORY

Structure:

Problem
→ Turning point
→ Lesson
→ Practical advice

---

# FRAMEWORK 7 — BEFORE / AFTER THINKING

Instead of physical transformation claims:

BEFORE:

> "I don't know where to start."

AFTER:

> "I now have three simple habits."

---

# FRAMEWORK 8 — PRODUCT EDUCATION

Problem
→ What matters
→ What to look for
→ Common mistakes
→ Relevant products

Never begin with:

> "Buy this."

---

# FRAMEWORK 9 — QUESTION

> What's harder for you: eating well or sleeping well?

Use for Facebook and Instagram engagement.

---

# FRAMEWORK 10 — ONE-MINUTE EDUCATION

Hook:

0–3 seconds

Problem:

3–10 seconds

Explanation:

10–40 seconds

Action:

40–55 seconds

CTA:

55–60 seconds

---

### hooks.md

# Hook Library

## PROBLEM HOOKS

* Why are you still tired after getting enough sleep?
* Struggling to sleep? Start here.
* If your energy crashes every afternoon, this is worth knowing.
* Your gut health may be influenced by more than what you eat.
* Trying to build healthier habits? Don't start with everything at once.

---

# CURIOSITY HOOKS

* Most people overlook this when trying to sleep better.
* There's a simpler way to approach healthy ageing.
* Before buying a wellness product, check these three things.
* One small change can make healthy habits easier to maintain.

---

# LIST HOOKS

* 3 habits that support healthy ageing.
* 5 ways to improve your evening routine.
* 7 foods worth adding to your diet.
* 3 common mistakes people make with sleep.

---

# QUESTION HOOKS

* Why do you wake up tired?
* What's your biggest challenge with healthy eating?
* How many hours do you normally sleep?
* What's one healthy habit you wish you'd started earlier?

---

# MYTH HOOKS

* Let's talk about a common wellness myth.
* Is this actually good for you?
* Not everything labelled "healthy" is automatically healthy.

---

# PRODUCT HOOKS

* What should you look for before buying this type of product?
* Three things to check before choosing a supplement.
* How do you know whether a wellness product is right for you?

---

# HOOK RULES

Never use deception to create curiosity.

Avoid:

* "Doctors hate this"
* "Secret cure"
* "You won't believe this"
* "This will change your life"
* "Guaranteed results"

Hooks must accurately represent the content.

---

### cta-library.md

# CTA Library

## SAVE

* Save this for later.
* Keep this handy for your next grocery trip.
* Save this checklist.

## SHARE

* Share this with someone who might find it useful.
* Send this to someone working on their wellness goals.

## COMMENT

* What's your experience?
* Which one would you try first?
* What would you add to this list?

## WEBSITE

* Read the full guide on Lifestyle Medicine Gateway.
* Explore the full article on our website.
* Find more practical wellness resources at Lifestyle Medicine Gateway.

## EMAIL

* Get more practical wellness tips by joining our community.
* Sign up for the LMG newsletter.

## PRODUCTS

* Explore relevant wellness products on Lifestyle Medicine Gateway.
* Discover products from our wellness marketplace.

## VENDORS

* Discover the brand behind this product.
* Meet more wellness businesses in the LMG community.

## CTA RULE

Do not use a hard sales CTA on every post.

Match the CTA to the content objective.

---

### hashtag-strategy.md

# Hashtag Strategy

## PRINCIPLE

Hashtags should support content discovery.

They should not replace good content or search optimization.

---

# USE

Use a small set of highly relevant hashtags.

Prioritize:

* Topic relevance
* Audience relevance
* Geographic relevance where appropriate
* Brand hashtags

---

# EXAMPLES

Potential topic categories:

#LifestyleMedicine

#HealthyAgeing

#GutHealth

#SleepHealth

#WomensWellness

#HealthyEating

#WellnessAustralia

#AustralianWellness

#HealthyLifestyle

#Wellbeing

---

# BRAND

Consider developing a consistent brand hashtag:

#LifestyleMedicineGateway

Use it selectively.

---

# RULE

Do not use irrelevant viral hashtags simply because they are popular.

Relevance is more important than volume.`;

export function getMarketingContext(): string {
  return MARKETING_CONTEXT;
}
