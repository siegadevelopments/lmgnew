// /api/ads-sync — pulls each ad's daily results from Meta, matches our own attributed orders, and
// applies the stop rule and the monthly cap (marketing/social/paid-social.md).
// Auth: the Vercel cron (GET, Authorization: Bearer CRON_SECRET) or an admin (POST, requireAdmin).
import type { VercelRequest, VercelResponse } from "@vercel/node";
import { createClient } from "@supabase/supabase-js";
import { requireAdmin } from "./_require-admin.js";
import { metaConfig, metaGet, metaPost, type MetaConfig } from "./_meta.js";
import { melbourneDate, parseInsights, shouldStopLoss } from "./_ads.js";

const cents = (dollars: unknown) => Math.round((Number(dollars) || 0) * 100);

export default async function handler(req: VercelRequest, res: VercelResponse) {
  const cronSecret = process.env.CRON_SECRET;
  const isCron = !!cronSecret && req.headers.authorization === `Bearer ${cronSecret}`;
  if (!isCron) {
    if (req.method !== "POST") return res.status(405).json({ error: "Method not allowed" });
    const denied = await requireAdmin(req);
    if (denied) return res.status(denied.status).json({ error: denied.error });
  }

  const url = process.env.SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL || process.env.VITE_SUPABASE_URL || "";
  const db = createClient(url, process.env.SUPABASE_SERVICE_ROLE_KEY || "", { auth: { persistSession: false } });
  const { config: cfg, missing } = metaConfig();
  const today = melbourneDate(new Date());
  const summary = { synced: 0, completed: 0, paused: [] as string[], errors: [] as string[], meta: cfg ? "connected" : `missing ${missing.join(", ")}` };

  const { data: campaigns, error } = await db.from("ad_campaigns").select("*").in("status", ["active", "paused", "completed"]);
  if (error) return res.status(500).json({ error: "Couldn't load ads." });

  const notify = (title: string, message: string) =>
    db.from("notifications").insert({ recipient_role: "admin", type: "system", title, message, link: "/admin?tab=ads", read: false });
  const pause = async (c: any, reason: string) => {
    if (cfg && c.meta_campaign_id) await metaPost(cfg as MetaConfig, c.meta_campaign_id, { status: "PAUSED" });
    await db.from("ad_campaigns").update({ status: "paused", paused_reason: reason, updated_at: new Date().toISOString() }).eq("id", c.id);
    c.status = "paused";
    summary.paused.push(c.name);
    await notify(`⏸️ Ad paused: ${String(c.name).slice(0, 60)}`, reason);
  };

  // 1. Meta's daily figures.
  for (const c of campaigns ?? []) {
    if (!cfg || !c.meta_campaign_id) continue;
    const until = c.end_date < today ? c.end_date : today;
    if (until < c.start_date) continue;
    try {
      const data = await metaGet(cfg, `${c.meta_campaign_id}/insights`, {
        fields: "spend,impressions,clicks,actions,action_values",
        time_increment: "1",
        time_range: JSON.stringify({ since: c.start_date, until }),
        limit: "100",
      });
      const rows = parseInsights(data?.data).map((r) => ({ ...r, campaign_id: c.id, synced_at: new Date().toISOString() }));
      if (rows.length > 0) {
        const { error: upErr } = await db.from("ad_insights_daily").upsert(rows, { onConflict: "campaign_id,date" });
        if (upErr) throw upErr;
      }
      summary.synced++;
    } catch (err: any) {
      summary.errors.push(`${c.name}: ${String(err?.message ?? err).slice(0, 200)}`);
    }
  }

  // 2. Our own orders credited to each ad (orders.attribution from the ad's url_tags).
  const ids = (campaigns ?? []).map((c: any) => c.id);
  const { data: insightRows } = ids.length
    ? await db.from("ad_insights_daily").select("campaign_id, date, spend_cents, meta_purchases").in("campaign_id", ids)
    : { data: [] as any[] };
  const earliest = (campaigns ?? []).reduce((m: string, c: any) => (c.start_date < m ? c.start_date : m), today);
  const { data: orders, error: ordersError } = await db
    .from("orders")
    .select("id, total, created_at, attribution")
    .eq("payment_status", "paid")
    .not("attribution", "is", null)
    .gte("created_at", `${earliest}T00:00:00+10:00`);
  if (ordersError) summary.errors.push("Orders: attribution not available yet (run 20261027_orders_attribution.sql)");
  const orderIds = (orders ?? []).map((o: any) => o.id);
  const { data: earnings } = orderIds.length
    ? await db.from("vendor_earnings").select("order_id, platform_fee").in("order_id", orderIds)
    : { data: [] as any[] };

  for (const c of campaigns ?? []) {
    const mine = (insightRows ?? []).filter((r: any) => r.campaign_id === c.id);
    const spend = mine.reduce((s: number, r: any) => s + (r.spend_cents ?? 0), 0);
    const metaPurchases = mine.reduce((s: number, r: any) => s + (r.meta_purchases ?? 0), 0);
    const matched = (orders ?? []).filter((o: any) => {
      const a = o.attribution ?? {};
      return (c.meta_ad_id && a.utm_content === c.meta_ad_id) || a.utm_campaign === c.name;
    });
    const matchedIds = new Set(matched.map((o: any) => o.id));
    const commission = (earnings ?? []).filter((e: any) => matchedIds.has(e.order_id)).reduce((s: number, e: any) => s + cents(e.platform_fee), 0);
    const totals = {
      spend_cents_total: spend,
      meta_purchases_total: metaPurchases,
      our_orders: matched.length,
      our_revenue_cents: matched.reduce((s: number, o: any) => s + cents(o.total), 0),
      our_commission_cents: commission,
      last_synced_at: new Date().toISOString(),
    };
    Object.assign(c, totals);
    const finished = c.status === "active" && c.end_date < today;
    await db.from("ad_campaigns").update({ ...totals, ...(finished ? { status: "completed" } : {}) }).eq("id", c.id);
    if (finished) {
      c.status = "completed";
      summary.completed++;
    }
  }

  // 3. Stop rule and monthly cap.
  const { data: settings } = await db.from("ad_settings").select("monthly_cap_cents, auto_pause").eq("id", 1).maybeSingle();
  const monthStart = `${today.slice(0, 7)}-01`;
  const monthSpend = (insightRows ?? []).filter((r: any) => r.date >= monthStart).reduce((s: number, r: any) => s + (r.spend_cents ?? 0), 0);
  for (const c of (campaigns ?? []).filter((x: any) => x.status === "active")) {
    try {
      if (settings && monthSpend >= settings.monthly_cap_cents) {
        await pause(c, `This month's ad spend reached the $${(settings.monthly_cap_cents / 100).toFixed(2)} cap.`);
      } else if (
        settings?.auto_pause &&
        shouldStopLoss({ spendCents: c.spend_cents_total, stopLossCents: c.stop_loss_cents, purchases: Math.max(c.meta_purchases_total, c.our_orders) })
      ) {
        await pause(c, `Spent $${(c.spend_cents_total / 100).toFixed(2)} with no sale (stop rule: $${(c.stop_loss_cents / 100).toFixed(2)}).`);
      }
    } catch (err: any) {
      summary.errors.push(`Pausing ${c.name}: ${String(err?.message ?? err).slice(0, 200)}`);
    }
  }

  return res.status(200).json({ ok: true, ...summary });
}
