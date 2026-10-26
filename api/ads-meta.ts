// POST /api/ads-meta { campaign_id, action: "create" | "activate" | "pause" } — Admin > Ads.
// Auth: admins only (requireAdmin).
//   create:   builds campaign → ad set → image → creative → ad in Meta, all PAUSED. Each step stores
//             its id, so a retry after an error continues where it stopped. Nothing spends.
//   activate: switches the ad on, only if this month's projected spend stays within the cap.
//   pause:    switches it off.
import type { VercelRequest, VercelResponse } from "@vercel/node";
import { createClient } from "@supabase/supabase-js";
import { requireAdmin } from "./_require-admin.js";
import { metaConfig, metaPost, MetaError, type MetaConfig } from "./_meta.js";
import {
  capCheck,
  isAllowedImageUrl,
  isSiteUrl,
  melbourneDate,
  metaAdParams,
  metaAdSetParams,
  metaCampaignParams,
  metaCreativeParams,
} from "./_ads.js";

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
const MAX_IMAGE_BYTES = 8 * 1024 * 1024;

async function uploadImage(cfg: MetaConfig, imageUrl: string): Promise<string> {
  if (!isAllowedImageUrl(imageUrl)) throw new MetaError("The ad image must be hosted on the LMG site or its media storage.");
  const res = await fetch(imageUrl, { redirect: "error", headers: { "User-Agent": "Mozilla/5.0 LMG-Ads" } });
  const type = res.headers.get("content-type") || "";
  if (!res.ok || !type.startsWith("image/")) throw new MetaError(`Couldn't load the ad image (HTTP ${res.status}).`);
  const buf = Buffer.from(await res.arrayBuffer());
  if (buf.length > MAX_IMAGE_BYTES) throw new MetaError("The ad image is larger than 8 MB.");
  const data = await metaPost(cfg, `${cfg.adAccountId}/adimages`, { bytes: buf.toString("base64") });
  const first: any = Object.values(data?.images ?? {})[0];
  if (!first?.hash) throw new MetaError("Meta didn't return an image hash.");
  return first.hash;
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== "POST") return res.status(405).json({ error: "Method not allowed" });
  const denied = await requireAdmin(req);
  if (denied) return res.status(denied.status).json({ error: denied.error });

  const campaignId = String(req.body?.campaign_id ?? "");
  const action = String(req.body?.action ?? "");
  if (!UUID.test(campaignId) || !["create", "activate", "pause"].includes(action)) {
    return res.status(400).json({ error: "Invalid request." });
  }

  const { config: cfg, missing } = metaConfig();
  if (!cfg) return res.status(503).json({ error: `Meta ads aren't connected yet. Missing in Vercel: ${missing.join(", ")}.` });

  const url = process.env.SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL || process.env.VITE_SUPABASE_URL || "";
  const db = createClient(url, process.env.SUPABASE_SERVICE_ROLE_KEY || "", { auth: { persistSession: false } });
  const { data: c, error } = await db.from("ad_campaigns").select("*").eq("id", campaignId).maybeSingle();
  if (error || !c) return res.status(404).json({ error: "Ad not found." });
  const save = (fields: Record<string, unknown>) =>
    db.from("ad_campaigns").update({ ...fields, updated_at: new Date().toISOString() }).eq("id", campaignId);

  try {
    if (action === "create") {
      if (!isSiteUrl(c.link_url)) throw new MetaError("The ad link must go to lifestylemedicinegateway.com.");
      let { meta_campaign_id, meta_adset_id, meta_creative_id, meta_ad_id } = c;
      if (!meta_campaign_id) {
        meta_campaign_id = (await metaPost(cfg, `${cfg.adAccountId}/campaigns`, metaCampaignParams(c))).id;
        await save({ meta_campaign_id });
      }
      if (!meta_adset_id) {
        meta_adset_id = (await metaPost(cfg, `${cfg.adAccountId}/adsets`, metaAdSetParams(c, { campaignId: meta_campaign_id, pixelId: cfg.pixelId }))).id;
        await save({ meta_adset_id });
      }
      if (!meta_creative_id) {
        const imageHash = await uploadImage(cfg, c.image_url);
        meta_creative_id = (
          await metaPost(cfg, `${cfg.adAccountId}/adcreatives`, metaCreativeParams(c, { pageId: cfg.pageId, imageHash, instagramUserId: cfg.instagramUserId }))
        ).id;
        await save({ meta_creative_id });
      }
      if (!meta_ad_id) {
        meta_ad_id = (await metaPost(cfg, `${cfg.adAccountId}/ads`, metaAdParams(c, { adSetId: meta_adset_id, creativeId: meta_creative_id }))).id;
      }
      await save({ meta_ad_id, status: "paused", paused_reason: "Created in Meta, not yet switched on", last_error: null });
      return res.status(200).json({ ok: true, status: "paused" });
    }

    if (!c.meta_campaign_id || !c.meta_adset_id || !c.meta_ad_id) {
      return res.status(400).json({ error: "Create the ad in Meta first." });
    }

    if (action === "pause") {
      await metaPost(cfg, c.meta_campaign_id, { status: "PAUSED" });
      await save({ status: "paused", paused_reason: "Paused by an admin", last_error: null });
      return res.status(200).json({ ok: true, status: "paused" });
    }

    // activate: enforce the monthly cap before anything can spend.
    const today = melbourneDate(new Date());
    const monthStart = `${today.slice(0, 7)}-01`;
    const [{ data: settings }, { data: spendRows }, { data: active }] = await Promise.all([
      db.from("ad_settings").select("monthly_cap_cents").eq("id", 1).maybeSingle(),
      db.from("ad_insights_daily").select("spend_cents").gte("date", monthStart),
      db.from("ad_campaigns").select("id, daily_budget_cents, start_date, end_date").eq("status", "active").neq("id", campaignId),
    ]);
    const check = capCheck({
      monthlyCapCents: settings?.monthly_cap_cents ?? 0,
      spentThisMonthCents: (spendRows ?? []).reduce((s: number, r: any) => s + (r.spend_cents ?? 0), 0),
      activeFlights: (active ?? []).map((a: any) => ({ dailyBudgetCents: a.daily_budget_cents, startDate: a.start_date, endDate: a.end_date })),
      candidate: { dailyBudgetCents: c.daily_budget_cents, startDate: c.start_date, endDate: c.end_date },
      today,
    });
    if (!check.ok) return res.status(400).json({ error: check.reason, projected_cents: check.projectedCents });

    await metaPost(cfg, c.meta_ad_id, { status: "ACTIVE" });
    await metaPost(cfg, c.meta_adset_id, { status: "ACTIVE" });
    await metaPost(cfg, c.meta_campaign_id, { status: "ACTIVE" });
    await save({ status: "active", paused_reason: null, last_error: null });
    return res.status(200).json({ ok: true, status: "active", projected_cents: check.projectedCents });
  } catch (err: any) {
    const message = err instanceof MetaError ? err.message : "Something went wrong talking to Meta.";
    if (!(err instanceof MetaError)) console.error("ads-meta failed:", err?.message ?? err);
    await save({ last_error: message, ...(action === "create" ? { status: c.meta_ad_id ? c.status : "error" } : {}) });
    return res.status(502).json({ error: message });
  }
}
