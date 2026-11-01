# November 2026: Founder's Formula Christmas gifting

Single-vendor campaign for Founder's Formula, a Sunshine Coast skincare brand. It is built around Christmas gift buying in November.

- **Captions, images and schedule:** the source is [2026-11-founders-formula.sql](2026-11-founders-formula.sql). Images are hosted on Cloudflare R2 at `https://media.lifestylemedicinegateway.com/marketing/2026-11/` (copies also remain in `public/marketing/2026-11/`).
- **Status:** 12 posts approved and sent to Buffer on 26 Oct 2026.
- **Paid ads rules:** [paid-social.md](../social/paid-social.md).

## Products

| Product | Price | Notes | URL |
|---|---|---|---|
| Founder's Formula Gift Set | $120 | 3 × 15 mL serums, valued at over $200 | https://www.lifestylemedicinegateway.com/products/founders-formula-gift-box |
| Best Sellers Discovery Kit | $89 | 5 × 5 mL minis, valued at $99 | https://www.lifestylemedicinegateway.com/products/best-sellers-discovery-kit |
| Wild-Harvested Kakadu Plum Vitamin C Serum | $134 | Supporting education post | https://www.lifestylemedicinegateway.com/products/wild-harvested-australian-kakadu-plum-vitamin-c-serum |
| Australian Botanicals Nourishing Facial Oils | $103 | Supporting education post | https://www.lifestylemedicinegateway.com/products/australian-botanicals-nourishing-facial-oils |

Prices were checked against the live catalogue on 26 Oct 2026.

## Organic calendar

Instagram posts go out at 7:00pm and Facebook posts at 7:30pm, Melbourne time. Each idea has its own Facebook and Instagram caption.

| Date | Idea | Format | Hook | CTA | Product | Image |
|---|---|---|---|---|---|---|
| Mon 2 Nov | Gift Set launch | Product | Gift sorted for the person whose shelf is already full | Shop the Gift Set | Gift Set | founders-formula-gift-box.jpg |
| Thu 5 Nov | Why Kakadu plum | Education | Why is Kakadu plum in so much Australian skincare? | Read more and shop | Kakadu Plum Serum | kakadu-plum-vitamin-c-serum.jpg |
| Mon 9 Nov | Try five before you commit | Product | Not sure which products suit your skin? | Shop the kit | Discovery Kit | best-sellers-discovery-kit.jpg |
| Fri 13 Nov | Face oil in summer | Myth / tips | Won't a face oil make me greasy in summer? | Shop now | Nourishing Facial Oils | nourishing-facial-oils.jpg |
| Tue 24 Nov | What's inside, order early | Product | One box, three serums | Order early for Christmas | Gift Set | founders-formula-gift-box-closeup.jpg |
| Fri 27 Nov | Gift under $100 (Black Friday) | Offer | Skip the countdown timers | Shop the kit | Discovery Kit | best-sellers-discovery-kit-closeup.jpg |

No discount codes are used. The offer is the vendor's own "valued at" price, plus free shipping over $50 and Afterpay.

## Paid test

**Hypothesis:** a Christmas gift set with a clear value offer will get purchases at a lower cost than a lower-priced discovery kit.

**Break-even cost per purchase.** Founder's Formula's commission is 25% (confirmed 26 Oct 2026). Stripe fees come out of LMG's share.

| Product | Price | 25% commission | After card fee | After Afterpay fee |
|---|---|---|---|---|
| Gift Set | $120 | $30.00 | about $27.66 | about $22.50 |
| Discovery Kit | $89 | $22.25 | about $20.44 | about $16.61 |

Working break-even: **$25 per purchase for the Gift Set, $18 for the Discovery Kit.**

**Setup:**
- Run two ads in Meta Ads Manager, both starting Tue 3 Nov.
  - Gift Set: use the existing Facebook post from 2 Nov.
  - Discovery Kit: its post isn't published until 9 Nov, so create it as a new ad with the same image (`best-sellers-discovery-kit.jpg`) and the Facebook caption.
- Objective is Sales, optimised for the Purchase event, in Australia only.
- Spend $10 a day per ad, from 3 Nov to 16 Nov.
- On 17 Nov, stop the weaker ad and move its budget to the stronger one until about 10 Dec.
- Stop rule: stop the Gift Set ad at about $75 spent with no purchase, and the Discovery Kit ad at about $55.

**Budget (LMG pays alone):**

| Phase | Dates | Daily | Total |
|---|---|---|---|
| Test, both ads | 3 to 16 Nov | $10 per ad | about $280 |
| Scale the winner | 17 Nov to 10 Dec | $10, raised to $20 only if cost per purchase is under break-even | $250 to $500 |
| **Cap** | | | **$800** |

**Vendor co-funding:** Founder's Formula declined to share the ad cost (26 Oct 2026). LMG funds the ads alone.

## Results

Fill this in from Meta Ads Manager, GA4 and the admin orders list.

| Ad | Spend | Clicks | Purchases | Cost per purchase | Revenue | LMG commission |
|---|---|---|---|---|---|---|
| Gift Set | | | | | | |
| Discovery Kit | | | | | | |

**Organic:** record reach, link clicks and purchases for each post.

**Decision:** keep, modify, stop or test again (see [experiments.md](../social/experiments.md)).

**Learnings for December:**
