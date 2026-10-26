-- November 2026 social campaign: Founder's Formula (single vendor).
-- Adds 12 DRAFT posts (6 ideas x Facebook + Instagram) to the admin Marketing tab.
-- Nothing is published until an admin approves each draft, which pushes it to Buffer.
--
-- Before running: merge the PR that adds public/marketing/2026-11/*.jpg and wait for the
-- Vercel deploy, so the image URLs below load (Buffer fetches them at approval time).
-- Run once in the Supabase SQL Editor. Re-running is safe: titles that already exist are skipped.
-- Times are Melbourne (AEDT, +11). Prices and contents checked against the live catalogue on 26 Oct 2026.

insert into public.scheduled_posts
  (title, caption, hashtags, image_url, source_type, source_url, platforms, scheduled_at, status)
select v.title, v.caption, '{}'::text[], v.image_url, 'product', v.source_url, array[v.platform], v.scheduled_at, 'draft'
from (values

-- 1. Mon 2 Nov: Gift Set launch -------------------------------------------------------------
('Founder''s Formula Gift Set launch (IG)', 'instagram', timestamptz '2026-11-02 19:00+11',
 'https://www.lifestylemedicinegateway.com/marketing/2026-11/founders-formula-gift-box.jpg',
 'https://www.lifestylemedicinegateway.com/products/founders-formula-gift-box',
$c$Gift sorted for the person whose bathroom shelf is already full.

The Founder's Formula Gift Set brings together three of their most-loved serums, made on the Sunshine Coast with Australian native botanicals:

🌿 Australian Botanicals Nourishing Facial Oils
🌿 Pro-Ageing Treatment Concentrate Serum with hyaluronic acid
🌿 Phyto-A+ Australian Native Tobacco Serum

Three 15 mL bottles, valued at over $200, for $120. Free shipping on orders over $50, and Afterpay is available at checkout.

Tap the link in our bio, or visit:
https://www.lifestylemedicinegateway.com/products/founders-formula-gift-box

#ChristmasGiftIdeas #AustralianSkincare #NaturalSkincare #FoundersFormula #LifestyleMedicineGateway$c$),

('Founder''s Formula Gift Set launch (FB)', 'facebook', timestamptz '2026-11-02 19:30+11',
 'https://www.lifestylemedicinegateway.com/marketing/2026-11/founders-formula-gift-box.jpg',
 'https://www.lifestylemedicinegateway.com/products/founders-formula-gift-box',
$c$Christmas list looking long already? Here's an easy one to tick off early.

Founder's Formula is a Sunshine Coast skincare brand that builds its formulas around Australian native botanicals such as strawberry gum, Australian sandalwood and Kakadu plum. Their Gift Set puts three of their most popular serums in one box:

🌿 Australian Botanicals Nourishing Facial Oils, a blend of native oils for skin that feels dry or tired
🌿 Pro-Ageing Treatment Concentrate Serum with hyaluronic acid
🌿 Phyto-A+ Australian Native Tobacco Serum

It's valued at over $200 and costs $120, so it's a generous gift without the guesswork. Shipping is free on orders over $50, and you can pay with Afterpay.

Shop the Gift Set: https://www.lifestylemedicinegateway.com/products/founders-formula-gift-box

#ChristmasGiftIdeas #AustralianSkincare$c$),

-- 2. Thu 5 Nov: Kakadu plum (value / education) ---------------------------------------------
('Why Kakadu plum (IG)', 'instagram', timestamptz '2026-11-05 19:00+11',
 'https://www.lifestylemedicinegateway.com/marketing/2026-11/kakadu-plum-vitamin-c-serum.jpg',
 'https://www.lifestylemedicinegateway.com/products/wild-harvested-australian-kakadu-plum-vitamin-c-serum',
$c$Why is Kakadu plum turning up in so much Australian skincare?

This small green fruit from northern Australia is often described as one of the richest natural sources of vitamin C. In skincare, vitamin C is a popular antioxidant for skin that looks dull or uneven.

Founder's Formula's Wild-Harvested Kakadu Plum Vitamin C Serum pairs it with finger lime and waratah extracts. It was named Best Vitamin C Serum in the UK Beauty Shortlist Awards 2025.

How most people use a vitamin C serum: a few drops in the morning after cleansing, then moisturiser and SPF 50+. It works alongside sunscreen, never instead of it. Patch test first if your skin is sensitive.

Link in our bio, or visit:
https://www.lifestylemedicinegateway.com/products/wild-harvested-australian-kakadu-plum-vitamin-c-serum

#KakaduPlum #AustralianSkincare #NaturalSkincare #FoundersFormula$c$),

('Why Kakadu plum (FB)', 'facebook', timestamptz '2026-11-05 19:30+11',
 'https://www.lifestylemedicinegateway.com/marketing/2026-11/kakadu-plum-vitamin-c-serum.jpg',
 'https://www.lifestylemedicinegateway.com/products/wild-harvested-australian-kakadu-plum-vitamin-c-serum',
$c$Kakadu plum is a traditional bush food from northern Australia, and it's now one of the most talked-about ingredients in skincare.

The reason is vitamin C. This small fruit is often described as one of the richest natural sources of it, and in skincare vitamin C is valued as an antioxidant that may help skin look brighter and more even over time.

Founder's Formula, a Sunshine Coast brand, uses wild-harvested Kakadu plum in its Vitamin C Serum, together with finger lime and waratah extracts. The serum was named Best Vitamin C Serum in the UK Beauty Shortlist Awards 2025.

A simple way to use it: a few drops after cleansing in the morning, then moisturiser and SPF 50+. Vitamin C works with sunscreen, not in place of it, which matters under the Aussie sun.

Read more and shop: https://www.lifestylemedicinegateway.com/products/wild-harvested-australian-kakadu-plum-vitamin-c-serum

#KakaduPlum #AustralianSkincare$c$),

-- 3. Mon 9 Nov: Discovery Kit (try before you commit) ---------------------------------------
('Discovery Kit, try five (IG)', 'instagram', timestamptz '2026-11-09 19:00+11',
 'https://www.lifestylemedicinegateway.com/marketing/2026-11/best-sellers-discovery-kit.jpg',
 'https://www.lifestylemedicinegateway.com/products/best-sellers-discovery-kit',
$c$Not sure which products suit your skin? Try five before you commit.

The Founder's Formula Best Sellers Discovery Kit is a full routine in 5 mL minis:

1. Macadamia Omega-7 Cleansing Oil
2. Wild Pandanus Exfoliating Enzyme Cleansing Grains
3. Purslane & Commelina Gentle Balancing Toner
4. Pro-Ageing B3 & Hyaluronic Acid Serum
5. Australian Botanicals Nourishing Facial Oil

Valued at $99, it's $89. An easy way into the range, and it doubles as a gift.

Link in our bio, or visit:
https://www.lifestylemedicinegateway.com/products/best-sellers-discovery-kit

#AustralianSkincare #SkincareRoutine #NaturalSkincare #FoundersFormula$c$),

('Discovery Kit, try five (FB)', 'facebook', timestamptz '2026-11-09 19:30+11',
 'https://www.lifestylemedicinegateway.com/marketing/2026-11/best-sellers-discovery-kit.jpg',
 'https://www.lifestylemedicinegateway.com/products/best-sellers-discovery-kit',
$c$Buying full-size skincare without knowing whether it suits you is a gamble. A discovery kit takes the guesswork out.

The Founder's Formula Best Sellers Discovery Kit gives you five of the brand's most popular products in 5 mL minis, enough to try a full routine:

• Macadamia Omega-7 Cleansing Oil to melt away makeup
• Wild Pandanus Exfoliating Enzyme Cleansing Grains for gentle exfoliation
• Purslane & Commelina Gentle Balancing Toner
• Pro-Ageing B3 & Hyaluronic Acid Serum
• Australian Botanicals Nourishing Facial Oil

It's made on the Sunshine Coast with Australian botanicals, valued at $99 and priced at $89. It also makes a thoughtful gift for someone who's curious about natural skincare.

Shop the kit: https://www.lifestylemedicinegateway.com/products/best-sellers-discovery-kit

#AustralianSkincare #NaturalSkincare$c$),

-- 4. Fri 13 Nov: Facial oil in warm weather (value / myth) ---------------------------------
('Face oil in summer (IG)', 'instagram', timestamptz '2026-11-13 19:00+11',
 'https://www.lifestylemedicinegateway.com/marketing/2026-11/nourishing-facial-oils.jpg',
 'https://www.lifestylemedicinegateway.com/products/australian-botanicals-nourishing-facial-oils',
$c$Face oil as the weather warms up? It can work, if you pick the right one.

Sun, wind and air-con can leave skin feeling tight over an Aussie summer. A lightweight facial oil can help seal in hydration and support your skin's natural barrier.

Founder's Formula's Australian Botanicals Nourishing Facial Oils blend native ingredients including Maroochy nut, an Australian macadamia rich in omega-7, plus strawberry gum and Australian sandalwood. It's made to absorb quickly rather than sit on top of the skin.

Tip: press a few drops into slightly damp skin as the last step of your night routine.

Link in our bio, or visit:
https://www.lifestylemedicinegateway.com/products/australian-botanicals-nourishing-facial-oils

#AustralianSkincare #FacialOil #NaturalSkincare #FoundersFormula$c$),

('Face oil in summer (FB)', 'facebook', timestamptz '2026-11-13 19:30+11',
 'https://www.lifestylemedicinegateway.com/marketing/2026-11/nourishing-facial-oils.jpg',
 'https://www.lifestylemedicinegateway.com/products/australian-botanicals-nourishing-facial-oils',
$c$"Won't a face oil make me greasy in summer?" It's a fair question, and the answer depends on the oil.

Australian summers bring sun, wind and long days in air-conditioning, which can all leave skin feeling dry and tight. A light, fast-absorbing facial oil can help seal in moisture and support the skin's natural barrier without feeling heavy.

Founder's Formula's Australian Botanicals Nourishing Facial Oils use native ingredients including Maroochy nut (an Australian macadamia rich in omega-7), strawberry gum and Australian sandalwood.

How to use it: press a few drops into slightly damp skin at night, as the last step of your routine. If your skin is very oily or acne-prone, start with every second night and see how it feels.

Shop now: https://www.lifestylemedicinegateway.com/products/australian-botanicals-nourishing-facial-oils

#AustralianSkincare #NaturalSkincare$c$),

-- 5. Tue 24 Nov: Gift Set close-up, order early for Christmas ------------------------------
('Gift Set, what''s inside (IG)', 'instagram', timestamptz '2026-11-24 19:00+11',
 'https://www.lifestylemedicinegateway.com/marketing/2026-11/founders-formula-gift-box-closeup.jpg',
 'https://www.lifestylemedicinegateway.com/products/founders-formula-gift-box',
$c$One box, three serums, one very happy person on Christmas morning.

Here's what's inside the Founder's Formula Gift Set:

🧡 Nourishing Facial Oils: native oils to replenish and moisturise
🧡 Pro-Ageing Serum: with hyaluronic acid for smoother-feeling skin
🧡 Phyto-A+ Native Tobacco Serum: made to refine, renew and restore

Valued at over $200, yours for $120 with free shipping. Order early so it arrives well before Christmas.

Link in our bio, or visit:
https://www.lifestylemedicinegateway.com/products/founders-formula-gift-box

#ChristmasGiftIdeas #GiftsForHer #AustralianSkincare #FoundersFormula$c$),

('Gift Set, what''s inside (FB)', 'facebook', timestamptz '2026-11-24 19:30+11',
 'https://www.lifestylemedicinegateway.com/marketing/2026-11/founders-formula-gift-box-closeup.jpg',
 'https://www.lifestylemedicinegateway.com/products/founders-formula-gift-box',
$c$A month to Christmas. If someone on your list loves skincare, this one is worth a look.

The Founder's Formula Gift Set includes three 15 mL serums from the Sunshine Coast brand:

🧡 Australian Botanicals Nourishing Facial Oils, which replenish and moisturise
🧡 Pro-Ageing Treatment Concentrate Serum with hyaluronic acid
🧡 Phyto-A+ Australian Native Tobacco Serum, built around an Australian native botanical

Bought separately, they're valued at over $200. The set is $120, shipping is free, and Afterpay is available if you'd like to spread the cost.

Order early so it arrives well before the big day: https://www.lifestylemedicinegateway.com/products/founders-formula-gift-box

#ChristmasGiftIdeas #AustralianSkincare$c$),

-- 6. Fri 27 Nov (Black Friday): Discovery Kit close-up, gift under $100 ---------------------
('Gift under $100, Discovery Kit (IG)', 'instagram', timestamptz '2026-11-27 19:00+11',
 'https://www.lifestylemedicinegateway.com/marketing/2026-11/best-sellers-discovery-kit-closeup.jpg',
 'https://www.lifestylemedicinegateway.com/products/best-sellers-discovery-kit',
$c$Black Friday shopping for someone who loves skincare? Skip the countdown timers.

The Founder's Formula Best Sellers Discovery Kit is a thoughtful gift under $100: five 5 mL minis covering cleanse, exfoliate, tone, treat and nourish. It's valued at $99 and priced at $89, every day.

Made on the Sunshine Coast with Australian botanicals. Free shipping on orders over $50.

Link in our bio, or visit:
https://www.lifestylemedicinegateway.com/products/best-sellers-discovery-kit

#GiftsUnder100 #ChristmasGiftIdeas #AustralianSkincare #FoundersFormula$c$),

('Gift under $100, Discovery Kit (FB)', 'facebook', timestamptz '2026-11-27 19:30+11',
 'https://www.lifestylemedicinegateway.com/marketing/2026-11/best-sellers-discovery-kit-closeup.jpg',
 'https://www.lifestylemedicinegateway.com/products/best-sellers-discovery-kit',
$c$Looking for a gift under $100 that doesn't feel like an afterthought?

The Founder's Formula Best Sellers Discovery Kit packs five of the brand's most-loved products into 5 mL minis: a cleansing oil, enzyme exfoliating grains, a balancing toner, a hyaluronic acid serum and their nourishing facial oil. It's a full routine to try, made on the Sunshine Coast with Australian botanicals.

It's valued at $99 and priced at $89, with free shipping on orders over $50 and Afterpay at checkout. No codes, no countdown timers.

Shop the kit: https://www.lifestylemedicinegateway.com/products/best-sellers-discovery-kit

#GiftsUnder100 #AustralianSkincare$c$)

) as v(title, platform, scheduled_at, image_url, source_url, caption)
where not exists (select 1 from public.scheduled_posts p where p.title = v.title);

-- Check: should return 12 rows, all 'draft'.
select title, platforms, scheduled_at at time zone 'Australia/Melbourne' as melbourne_time, status
from public.scheduled_posts
where scheduled_at >= '2026-11-01' and scheduled_at < '2026-12-01'
  and image_url like 'https://www.lifestylemedicinegateway.com/marketing/2026-11/%'
order by scheduled_at, title;
