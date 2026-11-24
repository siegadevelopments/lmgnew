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
- Objective is **Traffic**, optimised for **landing page views** (changed 10 Nov 2026), in Australia only. The pixel has no purchase history and at $10 a day would see only a handful of purchases, so Sales optimisation has nothing to learn from. Run Traffic first so real visitors generate ViewContent, AddToCart and InitiateCheckout events. Then move to Sales with Add to Cart optimisation once those events arrive steadily, and to Purchase once orders are coming in.
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

## Ad drafts (entered 10 Nov 2026)

The original 3 Nov start was missed, so the test starts **Wed 11 Nov** and runs to **Tue 24 Nov**. The scale phase runs 25 Nov to 10 Dec. Move to Sales with Add to Cart optimisation once the funnel events arrive steadily, and to Purchase once real orders are arriving. Enter each as a new ad in Admin > Meta Ads (it creates them switched off; check each in Ads Manager, then activate).

Both ads: Traffic objective, landing page views optimisation, Australia only, 18+, Advantage+ audience, $10 a day, Shop Now button. Stop rules are in the Setup section above ($75 Gift Set, $55 Discovery Kit). Neither ad mentions a discount, because none is offered.

**Ad 1: Gift Set**
- Link: https://www.lifestylemedicinegateway.com/products/founders-formula-gift-box
- Image: `https://media.lifestylemedicinegateway.com/marketing/2026-11/founders-formula-gift-box.jpg`
- Dates: 11 to 24 Nov, $10 a day
- Primary text (recommended): `Gift sorted for the person whose shelf is already full. Founder's Formula's Gift Set puts three 15 mL serums in one box, made on the Sunshine Coast with Australian native botanicals. $120, valued at over $200. Free shipping over $50, and Afterpay at checkout.`
- Headline: `Founder's Formula Gift Set`
- Description: `3 serums, valued at $200+`
- Alternate hook: `One box, three serums. A Christmas gift for the skincare lover who has everything.`

**Ad 2: Discovery Kit**
- Link: https://www.lifestylemedicinegateway.com/products/best-sellers-discovery-kit
- Image: `https://media.lifestylemedicinegateway.com/marketing/2026-11/best-sellers-discovery-kit.jpg`
- Dates: 11 to 24 Nov, $10 a day
- Primary text (recommended): `Not sure which skincare suits you, or what to gift? Try five before you commit. Founder's Formula's Best Sellers Discovery Kit is five 5 mL minis for $89, valued at $99, from a Sunshine Coast brand. Free shipping over $50, and Afterpay at checkout.`
- Headline: `Best Sellers Discovery Kit`
- Description: `5 minis for $89`
- Alternate hook: `A full routine in 5 mL minis. A gift under $100.`

**Checks before activating**
1. In Meta Events Manager, open the Pixel's Test events tab and run a test order. Confirm ViewContent, AddToCart and InitiateCheckout arrive with value and currency (AUD), and Purchase too if you complete the order.
2. Confirm the Pixel ID in Vercel matches the Pixel connected to the ad account.
3. Confirm prices and stock on both product pages.
4. After activating, check Ads Manager shows no policy review rejection within 24 hours.

## Results

Fill this in from Meta Ads Manager, GA4 and the admin orders list. Because the ads are optimised for landing page views, judge the test on cost per landing page view, add to carts and initiated checkouts (Events Manager Overview) as well as cost per purchase, and take actual purchases from the admin orders list.

Recorded 24 Nov 2026 (Ads Manager, Events Manager and admin orders, 10 to 24 Nov).

| Ad | Spend | Landing page views | Cost per LPV | Add to carts | Purchases | Revenue | LMG commission |
|---|---|---|---|---|---|---|---|
| Gift Set | $130.23 | 254 | $0.51 | 0 | 0 | $0 | $0 |
| Discovery Kit | not run | | | | | | |

Reach 8,712, impressions 12,173, frequency about 1.4. Only the Gift Set ad ran, so the planned Gift Set against Discovery Kit comparison never happened. Events Manager (11 to 24 Nov) shows only PageView (334) and View content (211): no AddToCart or InitiateCheckout events. The tracking code fires AddToCart correctly (`src/lib/tracking.ts`), so this is most likely real behaviour rather than a tracking fault, but confirm with a test add to cart (see Black Friday checks below).

**Organic:** record reach, link clicks and purchases for each post.

**Decision:** stop the Gift Set ad as a cold sales ad. It spent $130.23, above the $75 stop rule, with no add to cart or purchase. Keep what worked (cheap traffic, creative) and change what did not (see Black Friday plan). Log it in [experiments.md](../social/experiments.md).

**Learnings for December:**
- Cold traffic at $0.51 per landing page view is cheap and not fatigued (frequency 1.4), so reaching people is not the problem.
- 211 product views produced no add to carts. Likely causes, to be confirmed: the price and value sit behind "See more" in the ad text and are not in the image, so people arrive without a price anchor; and a $120 gift is a big first purchase from a cold audience.
- The Pixel has no cart or purchase history, so Sales optimisation has nothing to learn from yet.

## Black Friday and Cyber Monday plan (drafted 24 Nov 2026)

Black Friday is Fri 27 Nov and Cyber Monday is Mon 30 Nov. This plan builds on the results above. It is a draft: nothing here is live until the checks below pass and the ads are activated in Ads Manager.

**Goal:** get the first purchases and the first AddToCart and InitiateCheckout events, at or under break-even, before sales-focused ads stop on about 10 Dec.

**Offer:** no discount code, as in the November plan. The offer is the vendor's "valued at" price, free shipping over $50 and Afterpay. If Founder's Formula agrees to a real Black Friday offer, record it here and in the ad copy before launch. Do not mention a discount in any ad unless the vendor has approved one.

**Budget:** $800 cap for the whole campaign, $130.23 already spent, so $669.77 remains. Reduced on 24 Nov 2026: plan about $70 for 25 Nov to 2 Dec ($5 a day on each ad; Ad B from 25 Nov, Ad A from 27 Nov), and extend to 10 Dec (about $150 in total) only if an ad is producing add to carts. Raise a budget only if cost per purchase is under break-even. At this size the stop-rule spends below are ceilings and may never be reached; the ads simply end at 2 Dec. LMG pays alone (vendor declined co-funding on 26 Oct 2026). Check the monthly cap in Admin > Meta Ads.

**Break-even (unchanged, 25% commission):** about $25 per purchase for the Gift Set, $18 for the Discovery Kit.

### Structure

| | Ad A: Retargeting | Ad B: Discovery Kit (cold) |
|---|---|---|
| Audience | People who viewed a product page in the last 14 to 30 days (Pixel ViewContent), about 250 so far. Small, so expect limited delivery. | Australia, 18+, Advantage+ audience |
| Product | Gift Set | Best Sellers Discovery Kit ($89) |
| Objective | Traffic (landing page views). Events Manager showed no AddToCart events (11 to 24 Nov), so Sales optimisation has nothing to learn from yet. | Traffic (landing page views), for the same reason |
| Daily budget | $5 | $5 |
| Dates | Fri 27 Nov to Wed 2 Dec (starts after Ad B is running and the audience is built) | **Launches first:** Wed 25 Nov to Wed 2 Dec |
| Stop rule | About $75 spent with no purchase | About $55 spent with no purchase |

**Campaign setup in Ads Manager (decided 24 Nov 2026):** create one **new** campaign with two ad sets, one per column above. Do not reuse the ended campaign: an ended campaign's learning does not carry over and its objective cannot be changed. Meta's Duplicate on the old campaign is fine, to copy location, age and placement settings, then change the objective, dates, budget and creative. Budget is set per ad set, so $5 a day each holds. If Meta allows, exclude the retargeting audience from the cold ad set so the two do not compete for the same people. Once AddToCart events arrive steadily, move to Sales (Add to Cart optimisation) in a new campaign.

Why the Discovery Kit: the $89 price is a lower first purchase than the $120 Gift Set, and "a gift under $100" matches the 27 Nov organic post.

### Creative changes (the main lesson from the first test)

- Put the price and the value in the **first line** of the primary text, so it shows before "See more". Do not rely on text after the cut.
- Add the price or value to the image (for example "$120, valued at over $200" or "5 minis, $89") or at least to the headline.
- Keep the strong product image and the Shop Now button.
- Keep qualified language only: no cure, treatment or guaranteed-result claims (see [paid-social.md](../social/paid-social.md)).

Draft copy (Australian English):

**Ad A: Gift Set retargeting**
- Primary text: `Still thinking about it? Founder's Formula Gift Set: three 15 mL serums in one box, $120, valued at over $200. Made on the Sunshine Coast with Australian native botanicals. Free shipping over $50, and Afterpay at checkout.`
- Headline: `Gift Set, $120 (valued at $200+)`
- Description: `Free shipping over $50`
- Link: https://www.lifestylemedicinegateway.com/products/founders-formula-gift-box

**Ad B: Discovery Kit (cold)**
- Primary text: `A gift under $100 for the skincare lover. Five 5 mL Founder's Formula minis for $89, valued at $99. Skip the countdown timers. Free shipping over $50, and Afterpay at checkout.`
- Headline: `5 minis for $89`
- Description: `A gift under $100`
- Link: https://www.lifestylemedicinegateway.com/products/best-sellers-discovery-kit

Use the existing images (`founders-formula-gift-box.jpg`, `best-sellers-discovery-kit.jpg`) with the price or value added to the image. Chosen image text, in a dark green band across the bottom fifth with the price in orange (keep to two short lines):
- Ad B: **5 minis, $89** / A gift under $100. If the ad runs as an image-only creative, "5 serum minis" is clearer than "5 minis".
- Ad A: **Gift Set $120** / Valued at over $200.

### Checks before activating

1. Add the Gift Set to your cart and confirm AddToCart arrives in Events Manager > Test events (or the Meta Pixel Helper). Repeat for InitiateCheckout. Run one real low-value test order if possible, then refund it.
2. Open both product pages on a phone as a cold visitor would. Check that the price, what's inside, shipping, Afterpay and the Add to cart button are all clear without scrolling far. Fix anything that is not.
3. Confirm prices and stock on both product pages, and that the Pixel ID in Vercel matches the Pixel on the ad account.
4. Create the retargeting audience in Meta (ViewContent, 30 days) and check its size.
5. After activating, confirm there is no policy rejection within 24 hours.

### Timeline

| Date | Action |
|---|---|
| Tue 24 Nov | Run the checks. Prepare the ads and the audience. |
| Wed 25 Nov | Activate Ad B (Discovery Kit) first (decided 24 Nov 2026). Build the retargeting audience. |
| Fri 27 Nov | Activate Ad A (Gift Set retargeting) once the audience exists and Ad B is delivering. |
| Fri 27 Nov | Organic Black Friday post goes out (see calendar above). Check spend and events. |
| Mon 30 Nov | Cyber Monday: check results, move budget to whichever ad has add to carts. |
| Wed 2 Dec | Review. Stop, change or scale (see Decision rules). |
| About 10 Dec | Stop all sales-focused ads so Christmas orders still arrive in time. |

### Decision rules

- No add to carts after the stop-rule spend: stop that ad. Do not raise budget.
- Add to carts but no purchases: look at the cart and checkout flow and the price or shipping messaging before spending more.
- Purchases at or under break-even: raise that ad's budget to $10 a day, within the $800 cap.
- Record all results in the Results table and in [experiments.md](../social/experiments.md).

**Open questions for the owner:** (1) Will Founder's Formula approve a real Black Friday offer? (2) Is the reduced budget of about $80 (up to about $160) right, given LMG funds it alone? (3) Should other vendors be included in a Black Friday push, one vendor per ad?
