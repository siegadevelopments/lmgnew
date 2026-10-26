# Paid Social

## PURPOSE

Paid social puts money behind content that already works organically.

It is an accelerator for the growth loop, not a replacement for good content. Every ad must still send people to a real website destination (product, guide, article) and follow every rule in this folder.

---

# THE BREAK-EVEN RULE

LMG earns a commission on each sale, not the full price. The rest goes to the vendor.

The default commission is 10% (vendors can have a custom rate, set in the admin vendor settings). So for a product priced at $120, LMG keeps about $12.

Stripe's payment processing fees also come out of LMG's share, because vendor payouts are calculated before fees. At the time of writing, Australian cards cost about 1.7% + $0.30 and Afterpay about 6% + $0.30 (check the Stripe pricing page for current rates).

Before spending, work out the break-even cost per sale:

> Break-even cost per purchase = (product price × LMG commission rate) − payment fee

Use the Afterpay fee for a conservative figure.

If an ad costs more than that to win one sale, it loses LMG money on that sale.

Cold-audience skincare and wellness ads in Australia usually cost well above $10–$15 per purchase. Plan for paid social to be a test, or to be co-funded, unless the numbers show otherwise.

---

# VENDOR CO-FUNDING

The vendor keeps most of the revenue from every sale an ad produces, so they benefit most.

Before scaling spend on a single vendor's product, ask the vendor to share the ad cost (a 50/50 split is a fair starting point). Record what was agreed in the campaign file.

---

# HOW TO RUN ADS

* Use Meta Ads Manager, not the "Boost post" button. Boost optimises for likes and comments, not sales.
* Objective: **Sales**, optimised for the **Purchase** event (the site sends it to the Meta Pixel and GA4).
* Location: Australia only.
* Use an existing organic post as the ad where possible, so likes and comments build on one post.
* One vendor per ad, full absolute product URLs, no watermarked images (see `.agents/rules/`).
* Health and skincare ads face stricter platform review. Keep the same qualified language as organic posts: no cure, treatment or guaranteed-result claims.

---

# TEST STRUCTURE

Start small and let results decide where money goes.

1. Pick the two strongest organic posts for different products.
2. Run both as ads at $5–$10 per day each for about two weeks.
3. Stop rule: if an ad spends about 3× the break-even cost per purchase with no sale, stop it.
4. After the test, move the budget to the ad with the lower cost per purchase.
5. Record spend, purchases, cost per purchase and revenue in the campaign file, then decide: keep, modify, stop or test again (see `experiments.md`).

Scale spend only when cost per purchase is near or below break-even, or when a vendor is co-funding.

---

# SEASONAL TIMING

For Christmas, stop sales-focused ads around 10 December so orders still arrive in time with standard postage. Confirm each year against vendor dispatch times and Australia Post cut-off dates.

---

# RULE

Never scale an ad because it looks popular.

Scale it because it produces purchases at a cost LMG can afford.
