import { describe, it, expect } from "vitest";
import { readFileSync } from "fs";
import path from "path";
import {
  AD_URL_TAGS,
  breakEven,
  capCheck,
  daysBetween,
  isAllowedImageUrl,
  isSafeCopy,
  isSiteUrl,
  melbourneDate,
  melbourneOffset,
  metaAdParams,
  metaAdSetParams,
  metaCampaignParams,
  metaCreativeParams,
  monthEnd,
  parseCopyVariants,
  parseInsights,
  remainingMonthBudget,
  shouldStopLoss,
  templateCopy,
} from "../../../api/_ads";

const root = path.resolve(import.meta.dirname, "../../..");
const read = (p: string) => readFileSync(path.join(root, p), "utf8");

describe("breakEven", () => {
  it("matches the November plan: Gift Set $120 at 25%", () => {
    const b = breakEven(12000, 25);
    expect(b.commissionCents).toBe(3000);
    expect(b.afterCardCents).toBe(2766); // $30 − (1.7% + 30c)
    expect(b.afterAfterpayCents).toBe(2250); // $30 − (6% + 30c)
    expect(b.breakEvenCents).toBe(2250);
    expect(b.stopLossCents).toBe(6750);
  });

  it("uses the 10% default commission and never goes negative", () => {
    expect(breakEven(8900, null).commissionCents).toBe(890);
    expect(breakEven(500, 10).breakEvenCents).toBe(0);
  });
});

describe("dates", () => {
  it("knows Melbourne's daylight saving offset", () => {
    expect(melbourneOffset("2026-11-03")).toBe("+11:00");
    expect(melbourneOffset("2026-07-01")).toBe("+10:00");
  });
  it("gives the Melbourne date, not UTC", () => {
    expect(melbourneDate(new Date("2026-11-02T14:30:00Z"))).toBe("2026-11-03");
  });
  it("counts inclusive days and month ends", () => {
    expect(daysBetween("2026-11-03", "2026-11-16")).toBe(14);
    expect(daysBetween("2026-11-16", "2026-11-03")).toBe(0);
    expect(monthEnd("2026-11-10")).toBe("2026-11-30");
    expect(monthEnd("2028-02-03")).toBe("2028-02-29");
  });
});

describe("monthly cap", () => {
  const flight = { dailyBudgetCents: 1000, startDate: "2026-11-03", endDate: "2026-12-10" };
  it("only counts the rest of this month", () => {
    expect(remainingMonthBudget(flight, "2026-11-03")).toBe(28 * 1000);
    expect(remainingMonthBudget(flight, "2026-12-01")).toBe(10 * 1000);
  });

  it("allows the two November test ads under an $800 cap, and blocks going over", () => {
    const today = "2026-11-03";
    const gift = { dailyBudgetCents: 1000, startDate: "2026-11-03", endDate: "2026-11-16" };
    const kit = { ...gift };
    expect(capCheck({ monthlyCapCents: 80000, spentThisMonthCents: 0, activeFlights: [gift], candidate: kit, today }).ok).toBe(true);
    const big = { dailyBudgetCents: 50000, startDate: "2026-11-03", endDate: "2026-11-30" };
    const r = capCheck({ monthlyCapCents: 80000, spentThisMonthCents: 0, activeFlights: [gift], candidate: big, today });
    expect(r.ok).toBe(false);
    expect(r.reason).toMatch(/over the \$800\.00 cap/);
  });

  it("refuses an ad whose end date has passed", () => {
    const r = capCheck({ monthlyCapCents: 80000, spentThisMonthCents: 0, activeFlights: [], candidate: { dailyBudgetCents: 1000, startDate: "2026-10-01", endDate: "2026-10-31" }, today: "2026-11-03" });
    expect(r.ok).toBe(false);
  });
});

describe("stop rule", () => {
  it("stops at the stop-loss with no sale, not before, and not after a sale", () => {
    expect(shouldStopLoss({ spendCents: 6750, stopLossCents: 6750, purchases: 0 })).toBe(true);
    expect(shouldStopLoss({ spendCents: 6749, stopLossCents: 6750, purchases: 0 })).toBe(false);
    expect(shouldStopLoss({ spendCents: 9000, stopLossCents: 6750, purchases: 1 })).toBe(false);
    expect(shouldStopLoss({ spendCents: 9000, stopLossCents: 0, purchases: 0 })).toBe(false);
  });
});

describe("parseInsights", () => {
  it("converts Meta's daily rows and counts each purchase once", () => {
    const rows = parseInsights([
      {
        date_start: "2026-11-03",
        spend: "9.87",
        impressions: "1500",
        clicks: "31",
        actions: [
          { action_type: "offsite_conversion.fb_pixel_purchase", value: "1" },
          { action_type: "omni_purchase", value: "1" },
          { action_type: "link_click", value: "31" },
        ],
        action_values: [{ action_type: "omni_purchase", value: "120.00" }],
      },
      { date_start: "bad" },
    ]);
    expect(rows).toEqual([
      { date: "2026-11-03", spend_cents: 987, impressions: 1500, clicks: 31, meta_purchases: 1, meta_purchase_value_cents: 12000 },
    ]);
    expect(parseInsights(null)).toEqual([]);
  });
});

describe("ad copy", () => {
  it("flags medical claims but allows product names", () => {
    expect(isSafeCopy("This serum cures acne")).toBe(false);
    expect(isSafeCopy("Guaranteed results")).toBe(false);
    expect(isSafeCopy("We guarantee clear skin")).toBe(false);
    expect(isSafeCopy("Pro-Aging Treatment Concentrate Serum and a Clay Detox Mask")).toBe(true);
  });

  it("parses Gemini's JSON (with code fences), clips lengths and drops unsafe variants", () => {
    const out = parseCopyVariants(
      '```json\n[{"primary_text":"A gift worth giving.","headline":"' + "H".repeat(80) + '","description":"Free shipping"},{"primary_text":"Heals dry skin overnight","headline":"x"}]\n```',
    );
    expect(out).toHaveLength(1);
    expect(out[0].headline.length).toBeLessThanOrEqual(60);
    expect(parseCopyVariants("not json")).toEqual([]);
  });

  it("builds safe fallback copy from the product", () => {
    const copy = templateCopy({ title: "Founder's Formula Gift Set", priceCents: 12000, vendorName: "Founder's Formula", description: "Three serums.", url: "https://www.lifestylemedicinegateway.com/products/founders-formula-gift-box" });
    expect(copy).toHaveLength(3);
    for (const c of copy) expect(isSafeCopy(`${c.primary_text} ${c.headline} ${c.description}`)).toBe(true);
    expect(copy[0].primary_text).toContain("$120");
  });
});

describe("URL allow-lists", () => {
  it("only fetches ad images from our hosts over https", () => {
    expect(isAllowedImageUrl("https://www.lifestylemedicinegateway.com/marketing/2026-11/founders-formula-gift-box.jpg")).toBe(true);
    expect(isAllowedImageUrl("https://media.lifestylemedicinegateway.com/a.jpg")).toBe(true);
    expect(isAllowedImageUrl("https://abc.supabase.co/storage/v1/object/public/x.jpg")).toBe(true);
    expect(isAllowedImageUrl("http://www.lifestylemedicinegateway.com/a.jpg")).toBe(false);
    expect(isAllowedImageUrl("https://lifestylemedicinegateway.com.evil.example/a.jpg")).toBe(false);
    expect(isAllowedImageUrl("https://169.254.169.254/latest/meta-data")).toBe(false);
    expect(isAllowedImageUrl("not a url")).toBe(false);
  });
  it("only links ads to our site", () => {
    expect(isSiteUrl("https://www.lifestylemedicinegateway.com/products/x")).toBe(true);
    expect(isSiteUrl("https://evil.example/products/x")).toBe(false);
  });
});

describe("Meta payloads", () => {
  const c = {
    name: "Gift Set · Nov 2026",
    daily_budget_cents: 1000,
    start_date: "2026-11-03",
    end_date: "2026-11-16",
    primary_text: "Gift sorted.",
    headline: "Founder's Formula Gift Set",
    description: "Free shipping over $50",
    link_url: "https://www.lifestylemedicinegateway.com/products/founders-formula-gift-box",
  };

  it("creates everything switched off, optimised for purchases, in Australia", () => {
    expect(metaCampaignParams(c)).toMatchObject({ objective: "OUTCOME_SALES", status: "PAUSED" });
    const adset = metaAdSetParams(c, { campaignId: "1", pixelId: "745" });
    expect(adset.status).toBe("PAUSED");
    expect(adset.daily_budget).toBe("1000");
    expect(adset.optimization_goal).toBe("OFFSITE_CONVERSIONS");
    expect(JSON.parse(adset.promoted_object)).toEqual({ pixel_id: "745", custom_event_type: "PURCHASE" });
    expect(JSON.parse(adset.targeting).geo_locations).toEqual({ countries: ["AU"] });
    expect(adset.start_time).toBe("2026-11-03T00:00:00+11:00");
    expect(metaAdParams(c, { adSetId: "2", creativeId: "3" }).status).toBe("PAUSED");
  });

  it("tags every ad link so orders credit the ad", () => {
    const creative = metaCreativeParams(c, { pageId: "p", imageHash: "h" });
    expect(creative.url_tags).toBe(AD_URL_TAGS);
    expect(AD_URL_TAGS).toContain("utm_content={{ad.id}}");
    expect(AD_URL_TAGS).toContain("utm_campaign={{campaign.name}}");
    const spec = JSON.parse(creative.object_story_spec);
    expect(spec.link_data).toMatchObject({ link: c.link_url, image_hash: "h", call_to_action: { type: "SHOP_NOW" } });
    expect(spec.instagram_user_id).toBeUndefined();
  });
});

describe("wiring", () => {
  it("switching an ad on checks the monthly cap before anything goes ACTIVE", () => {
    const src = read("api/_ads-meta.ts");
    expect(src.indexOf("capCheck(")).toBeGreaterThan(0);
    expect(src.indexOf("capCheck(")).toBeLessThan(src.indexOf('status: "ACTIVE"'));
  });

  it("the sync runs from the Vercel cron with CRON_SECRET, or for admins", () => {
    const src = read("api/_ads-sync.ts");
    expect(src).toMatch(/req\.headers\.authorization === `Bearer \$\{cronSecret\}`/);
    expect(src).toMatch(/!!cronSecret &&/);
  });

  it("every ads operation checks its caller before doing anything", () => {
    for (const f of ["api/_ads-generate.ts", "api/_ads-meta.ts"]) {
      const src = read(f);
      expect(src).toMatch(/const denied = await requireAdmin\(req\);\n\s+if \(denied\) return/);
    }
    expect(read("api/_ads-sync.ts")).toMatch(/if \(!isCron\) \{[\s\S]{0,200}requireAdmin\(req\)/);
    const router = read("api/ads.ts");
    expect(router).toMatch(/return res\.status\(404\)/);
  });

  it("the ads tables are admin-only", () => {
    const sql = read("supabase/migrations/20261027_meta_ads.sql");
    expect(sql.match(/ENABLE ROW LEVEL SECURITY/g)).toHaveLength(3);
    expect(sql).toMatch(/REVOKE ALL ON public\.ad_settings, public\.ad_campaigns, public\.ad_insights_daily FROM anon;/);
    for (const m of sql.matchAll(/CREATE POLICY[^;]+;/g)) expect(m[0]).toMatch(/public\.is_admin\(\)/);
  });

  it("the Meta token is server-only", () => {
    expect(read("api/_meta.ts")).toMatch(/process\.env\.META_ADS_TOKEN/);
    expect(read("src/components/admin/AdminAdsTab.tsx")).not.toMatch(/META_ADS_TOKEN/);
  });
});
