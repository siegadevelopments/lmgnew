// Meta ads (Admin > Ads): pure helpers shared by api/ads-generate.ts, api/ads-meta.ts,
// api/ads-sync.ts and the admin UI (src/components/admin/AdminAdsTab.tsx). No I/O here, so it
// is unit-tested in src/lib/__tests__/ads.test.ts. The rules mirror marketing/social/paid-social.md.

export const DEFAULT_COMMISSION_RATE = 10; // % — same default as the stripe-webhook earnings split
export const STOP_LOSS_MULTIPLE = 3; // stop an ad that spends 3× break-even with no sale
export const DEFAULT_DAILY_BUDGET_CENTS = 1000; // $10/day test budget
export const CARD_FEE = { pct: 0.017, fixedCents: 30 }; // Stripe, Australian cards
export const AFTERPAY_FEE = { pct: 0.06, fixedCents: 30 }; // Stripe, Afterpay (worst case)
export const SITE_URL = "https://www.lifestylemedicinegateway.com";
// Added by Meta to every ad link, so orders.attribution credits the ad (see _shared/attribution.ts).
export const AD_URL_TAGS =
  "utm_source=meta&utm_medium=paid&utm_campaign={{campaign.name}}&utm_content={{ad.id}}&utm_term={{site_source_name}}";

const fee = (cents: number, f: { pct: number; fixedCents: number }) => Math.round(cents * f.pct + f.fixedCents);

export interface BreakEven {
  commissionCents: number;
  afterCardCents: number;
  afterAfterpayCents: number;
  /** Most an ad can cost per sale without losing money (conservative: Afterpay fee). */
  breakEvenCents: number;
  /** Spend with no sale at which the ad is stopped. */
  stopLossCents: number;
}

/** What LMG keeps from one sale of the product, after Stripe's fee, and the ad limits that follow. */
export function breakEven(priceCents: number, commissionRate: number | null | undefined): BreakEven {
  const rate = commissionRate == null || !Number.isFinite(Number(commissionRate)) ? DEFAULT_COMMISSION_RATE : Number(commissionRate);
  const price = Math.max(0, Math.round(priceCents));
  const commissionCents = Math.round((price * rate) / 100);
  const afterCardCents = Math.max(0, commissionCents - fee(price, CARD_FEE));
  const afterAfterpayCents = Math.max(0, commissionCents - fee(price, AFTERPAY_FEE));
  return {
    commissionCents,
    afterCardCents,
    afterAfterpayCents,
    breakEvenCents: afterAfterpayCents,
    stopLossCents: afterAfterpayCents * STOP_LOSS_MULTIPLE,
  };
}

/** YYYY-MM-DD in Melbourne for a moment (ads, budgets and Meta's account all run on AU time). */
export function melbourneDate(now: Date): string {
  return new Intl.DateTimeFormat("en-CA", { timeZone: "Australia/Melbourne", year: "numeric", month: "2-digit", day: "2-digit" }).format(now);
}

/** Melbourne's UTC offset on a date, e.g. "+11:00" (AEDT) or "+10:00" (AEST). */
export function melbourneOffset(date: string): string {
  const noonUtc = new Date(`${date}T12:00:00Z`);
  const part = new Intl.DateTimeFormat("en-US", { timeZone: "Australia/Melbourne", timeZoneName: "shortOffset" })
    .formatToParts(noonUtc)
    .find((p) => p.type === "timeZoneName")?.value; // "GMT+11"
  const m = part?.match(/GMT([+-])(\d{1,2})(?::(\d{2}))?/);
  if (!m) return "+10:00";
  return `${m[1]}${m[2].padStart(2, "0")}:${m[3] ?? "00"}`;
}

const DAY_MS = 86400_000;
const toDay = (d: string) => Date.parse(`${d}T00:00:00Z`);
/** Inclusive number of days between two YYYY-MM-DD dates (0 when to < from). */
export function daysBetween(from: string, to: string): number {
  return Math.max(0, Math.round((toDay(to) - toDay(from)) / DAY_MS) + 1);
}
export function monthEnd(date: string): string {
  const [y, m] = date.split("-").map(Number);
  const last = new Date(Date.UTC(y, m, 0)).getUTCDate();
  return `${date.slice(0, 7)}-${String(last).padStart(2, "0")}`;
}

export interface Flight {
  dailyBudgetCents: number;
  startDate: string;
  endDate: string;
}

/** Budget a flight can still spend from `today` to the end of this month. */
export function remainingMonthBudget(f: Flight, today: string): number {
  const from = f.startDate > today ? f.startDate : today;
  const to = f.endDate < monthEnd(today) ? f.endDate : monthEnd(today);
  return f.dailyBudgetCents * daysBetween(from, to);
}

/** Whether switching on `candidate` keeps this month's spend within the cap, counting active ads. */
export function capCheck(opts: {
  monthlyCapCents: number;
  spentThisMonthCents: number;
  activeFlights: Flight[];
  candidate: Flight;
  today: string;
}): { ok: boolean; projectedCents: number; reason?: string } {
  const projectedCents =
    opts.spentThisMonthCents +
    opts.activeFlights.reduce((sum, f) => sum + remainingMonthBudget(f, opts.today), 0) +
    remainingMonthBudget(opts.candidate, opts.today);
  if (opts.candidate.endDate < opts.today) return { ok: false, projectedCents, reason: "This ad's end date has passed." };
  if (projectedCents > opts.monthlyCapCents) {
    return {
      ok: false,
      projectedCents,
      reason: `This month's ads could reach $${(projectedCents / 100).toFixed(2)}, over the $${(opts.monthlyCapCents / 100).toFixed(2)} cap. Lower the budget, shorten the dates or raise the cap.`,
    };
  }
  return { ok: true, projectedCents };
}

/** The stop rule: enough spent to have expected a sale, and none came. */
export function shouldStopLoss(opts: { spendCents: number; stopLossCents: number | null; purchases: number }): boolean {
  if (!opts.stopLossCents || opts.stopLossCents <= 0) return false;
  return opts.purchases === 0 && opts.spendCents >= opts.stopLossCents;
}

type MetaAction = { action_type?: string; value?: string | number };
// Meta reports the same purchase under several action types; take the broadest one available.
const PURCHASE_TYPES = ["omni_purchase", "offsite_conversion.fb_pixel_purchase", "purchase"];
function pickPurchase(list: MetaAction[] | undefined): number {
  for (const type of PURCHASE_TYPES) {
    const hit = (list ?? []).find((a) => a.action_type === type);
    if (hit) return Number(hit.value) || 0;
  }
  return 0;
}

export interface InsightRow {
  date: string;
  spend_cents: number;
  impressions: number;
  clicks: number;
  meta_purchases: number;
  meta_purchase_value_cents: number;
}

/** Meta's daily insights rows (time_increment=1) as ad_insights_daily rows. */
export function parseInsights(rows: unknown): InsightRow[] {
  if (!Array.isArray(rows)) return [];
  return rows
    .filter((r: any) => typeof r?.date_start === "string" && /^\d{4}-\d{2}-\d{2}$/.test(r.date_start))
    .map((r: any) => ({
      date: r.date_start,
      spend_cents: Math.round((Number(r.spend) || 0) * 100),
      impressions: Math.round(Number(r.impressions) || 0),
      clicks: Math.round(Number(r.clicks) || 0),
      meta_purchases: Math.round(pickPurchase(r.actions)),
      meta_purchase_value_cents: Math.round(pickPurchase(r.action_values) * 100),
    }));
}

// ---- Ad copy -------------------------------------------------------------------------------

export interface AdCopy {
  primary_text: string;
  headline: string;
  description: string;
}
export interface AdProduct {
  title: string;
  priceCents: number;
  vendorName: string;
  description: string;
  url: string;
}

export const COPY_LIMITS = { primary_text: 600, headline: 60, description: 60 } as const;

// Phrases that would turn skincare/wellness copy into a medical claim (and get ads rejected).
// Claim verbs only: nouns in real product names ("Treatment Serum", "Detox Mask") stay allowed.
const BANNED = /\b(cure[sd]?|curing|treats|treated|treating|heal(s|ed|ing)?|prevent(s|ed|ing)?|guarantee[sd]?|eliminate[sd]?|miracle)\b/i;

/** True when copy avoids the claims brand-voice.md and Meta's health-ad policy rule out. */
export function isSafeCopy(text: string): boolean {
  return !BANNED.test(text);
}

const clip = (s: string, n: number) => {
  const t = s.replace(/\s+/g, " ").trim();
  return t.length <= n ? t : `${t.slice(0, n - 1).trimEnd()}…`;
};
const money = (cents: number) => `$${(cents / 100).toFixed(cents % 100 === 0 ? 0 : 2)}`;

/** Ad copy from the product's own details, used when Gemini is unavailable or unusable. */
export function templateCopy(p: AdProduct): AdCopy[] {
  const price = money(p.priceCents);
  const summary = clip(p.description, 160);
  return [
    {
      primary_text: `${p.title} from ${p.vendorName}, an Australian brand on Lifestyle Medicine Gateway. ${summary} ${price}, with free shipping on orders over $50 and Afterpay at checkout.`,
      headline: clip(p.title, COPY_LIMITS.headline),
      description: clip(`${price} · Free shipping over $50`, COPY_LIMITS.description),
    },
    {
      primary_text: `Looking for a thoughtful gift? ${p.title} by ${p.vendorName} is ${price}. ${summary} Shop it on Lifestyle Medicine Gateway.`,
      headline: clip(`Gift idea: ${p.title}`, COPY_LIMITS.headline),
      description: clip("Afterpay available", COPY_LIMITS.description),
    },
    {
      primary_text: `Discover ${p.vendorName} on Lifestyle Medicine Gateway. ${p.title}: ${summary} ${price}.`,
      headline: clip(`Shop ${p.vendorName}`, COPY_LIMITS.headline),
      description: clip(`${p.title}`, COPY_LIMITS.description),
    },
  ].map((c) => ({ ...c, primary_text: clip(c.primary_text, COPY_LIMITS.primary_text) }));
}

/** The prompt for Gemini: three Meta ad variants as JSON, grounded in the marketing knowledge base. */
export function adCopyPrompt(p: AdProduct, marketingContext: string): string {
  return `${marketingContext}

---

You are writing paid Meta (Facebook and Instagram) ads for Lifestyle Medicine Gateway (LMG), an Australian wellness marketplace. Follow the brand voice, audience and health-claim rules above, and marketing/social/paid-social.md.

Product: ${p.title}
Brand (single vendor, mention no other brand): ${p.vendorName}
Price: ${money(p.priceCents)} AUD (free shipping on orders over $50, Afterpay available)
Product page: ${p.url}
Product details: ${clip(p.description, 1200)}

Write 3 different ad variants. Rules:
- Australian English. Warm, clear, specific. No hype, no clickbait, at most one emoji per variant.
- Never claim the product cures, treats, heals, prevents or guarantees anything. Use qualified language ("may help", "designed to").
- Only state facts given above. Do not invent awards, statistics, discounts or reviews.
- primary_text: up to 400 characters, first sentence is the hook. headline: up to 40 characters. description: up to 30 characters.

Reply with JSON only, no markdown: [{"primary_text":"...","headline":"...","description":"..."}, ...]`;
}

/** Gemini's reply as safe, length-limited variants. Empty when unusable. */
export function parseCopyVariants(text: string): AdCopy[] {
  const json = String(text ?? "").replace(/^```(?:json)?\s*|```\s*$/g, "").trim();
  let data: unknown;
  try {
    data = JSON.parse(json);
  } catch {
    const m = json.match(/\[[\s\S]*\]/);
    if (!m) return [];
    try {
      data = JSON.parse(m[0]);
    } catch {
      return [];
    }
  }
  if (!Array.isArray(data)) return [];
  return data
    .filter((v: any) => v && typeof v.primary_text === "string" && typeof v.headline === "string")
    .map((v: any) => ({
      primary_text: clip(v.primary_text, COPY_LIMITS.primary_text),
      headline: clip(v.headline, COPY_LIMITS.headline),
      description: clip(typeof v.description === "string" ? v.description : "", COPY_LIMITS.description),
    }))
    .filter((v) => v.primary_text && v.headline && isSafeCopy(`${v.primary_text} ${v.headline} ${v.description}`))
    .slice(0, 3);
}

// ---- Meta Marketing API payloads -------------------------------------------------------------

const IMAGE_HOSTS = new Set([
  "www.lifestylemedicinegateway.com",
  "lifestylemedicinegateway.com",
  "media.lifestylemedicinegateway.com",
]);

/** Ad images are fetched server-side, so only our own hosts (and Supabase storage) are allowed. */
export function isAllowedImageUrl(raw: string): boolean {
  let u: URL;
  try {
    u = new URL(raw);
  } catch {
    return false;
  }
  if (u.protocol !== "https:") return false;
  return IMAGE_HOSTS.has(u.hostname) || u.hostname.endsWith(".supabase.co");
}

/** Ad links must point at our own site. */
export function isSiteUrl(raw: string): boolean {
  try {
    const u = new URL(raw);
    return u.protocol === "https:" && (u.hostname === "www.lifestylemedicinegateway.com" || u.hostname === "lifestylemedicinegateway.com");
  } catch {
    return false;
  }
}

export interface CampaignForMeta {
  name: string;
  daily_budget_cents: number;
  start_date: string;
  end_date: string;
  primary_text: string;
  headline: string;
  description: string | null;
  link_url: string;
}

export function metaCampaignParams(c: CampaignForMeta) {
  return {
    name: c.name,
    objective: "OUTCOME_SALES",
    status: "PAUSED",
    special_ad_categories: "[]",
    // Budgets live on the ad set (one ad set per ad), not shared at campaign level.
    is_adset_budget_sharing_enabled: "false",
  };
}

export function metaAdSetParams(c: CampaignForMeta, ids: { campaignId: string; pixelId: string }) {
  return {
    name: `${c.name} · Australia`,
    campaign_id: ids.campaignId,
    daily_budget: String(Math.round(c.daily_budget_cents)),
    billing_event: "IMPRESSIONS",
    optimization_goal: "OFFSITE_CONVERSIONS",
    bid_strategy: "LOWEST_COST_WITHOUT_CAP",
    promoted_object: JSON.stringify({ pixel_id: ids.pixelId, custom_event_type: "PURCHASE" }),
    targeting: JSON.stringify({
      geo_locations: { countries: ["AU"] },
      age_min: 18,
      targeting_automation: { advantage_audience: 1 },
    }),
    start_time: `${c.start_date}T00:00:00${melbourneOffset(c.start_date)}`,
    end_time: `${c.end_date}T23:59:00${melbourneOffset(c.end_date)}`,
    status: "PAUSED",
  };
}

export function metaCreativeParams(c: CampaignForMeta, ids: { pageId: string; imageHash: string; instagramUserId?: string }) {
  const link_data: Record<string, unknown> = {
    link: c.link_url,
    message: c.primary_text,
    name: c.headline,
    image_hash: ids.imageHash,
    call_to_action: { type: "SHOP_NOW", value: { link: c.link_url } },
  };
  if (c.description) link_data.description = c.description;
  const spec: Record<string, unknown> = { page_id: ids.pageId, link_data };
  if (ids.instagramUserId) spec.instagram_user_id = ids.instagramUserId;
  return {
    name: `${c.name} · creative`,
    object_story_spec: JSON.stringify(spec),
    url_tags: AD_URL_TAGS,
  };
}

export function metaAdParams(c: CampaignForMeta, ids: { adSetId: string; creativeId: string }) {
  return {
    name: c.name,
    adset_id: ids.adSetId,
    creative: JSON.stringify({ creative_id: ids.creativeId }),
    status: "PAUSED",
  };
}
