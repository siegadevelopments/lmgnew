"use client";

// Admin > Ads: generate Meta ads from products, keep them within a monthly cap, and see what they
// earn. Server work happens in api/ads-generate.ts, api/ads-meta.ts and api/ads-sync.ts; the maths
// lives in api/_ads.ts. Rules: marketing/social/paid-social.md.

import { useCallback, useEffect, useMemo, useState } from "react";
import { toast } from "sonner";
import { Loader2, Megaphone, RefreshCw, Sparkles, Pause, Play, Send, Trash2, CalendarDays } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { Progress } from "@/components/ui/progress";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { supabase } from "@/integrations/supabase/client";
import { authHeaders } from "@/lib/auth-headers";
import { breakEven, COPY_LIMITS, melbourneDate, type AdCopy, type BreakEven } from "../../../api/_ads";

type Campaign = {
  id: string;
  name: string;
  status: "draft" | "paused" | "active" | "completed" | "error";
  daily_budget_cents: number;
  start_date: string;
  end_date: string;
  primary_text: string;
  headline: string;
  description: string | null;
  image_url: string;
  link_url: string;
  break_even_cents: number | null;
  stop_loss_cents: number | null;
  meta_campaign_id: string | null;
  meta_ad_id: string | null;
  last_error: string | null;
  paused_reason: string | null;
  spend_cents_total: number;
  meta_purchases_total: number;
  our_orders: number;
  our_revenue_cents: number;
  our_commission_cents: number;
  last_synced_at: string | null;
};
type ProductOption = { id: number; title: string; price: number; store: string };
type Generated = {
  product: { id: number; title: string; vendor_id: string; vendor_name: string; price_cents: number; image_url: string; link_url: string };
  commission_rate: number | null;
  break_even: BreakEven;
  suggested_daily_budget_cents: number;
  variants: AdCopy[];
  source: "ai" | "template";
};

const money = (cents: number | null | undefined) => `$${((cents ?? 0) / 100).toFixed(2)}`;
const addDays = (date: string, n: number) => {
  const d = new Date(`${date}T00:00:00Z`);
  d.setUTCDate(d.getUTCDate() + n);
  return d.toISOString().slice(0, 10);
};

async function callApi(path: string, body: unknown): Promise<any> {
  const res = await fetch(path, {
    method: "POST",
    headers: { "Content-Type": "application/json", ...(await authHeaders()) },
    body: JSON.stringify(body),
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(data?.error || `Request failed (HTTP ${res.status})`);
  return data;
}

const STATUS_STYLE: Record<Campaign["status"], string> = {
  draft: "bg-muted text-muted-foreground",
  paused: "bg-amber-100 text-amber-800 dark:bg-amber-900/40 dark:text-amber-200",
  active: "bg-emerald-100 text-emerald-800 dark:bg-emerald-900/40 dark:text-emerald-200",
  completed: "bg-sky-100 text-sky-800 dark:bg-sky-900/40 dark:text-sky-200",
  error: "bg-red-100 text-red-800 dark:bg-red-900/40 dark:text-red-200",
};

export function AdminAdsTab() {
  const today = melbourneDate(new Date());
  const [loading, setLoading] = useState(true);
  const [campaigns, setCampaigns] = useState<Campaign[]>([]);
  const [settings, setSettings] = useState({ monthly_cap_cents: 80000, auto_pause: true });
  const [capInput, setCapInput] = useState("800");
  const [monthSpend, setMonthSpend] = useState(0);
  const [posts, setPosts] = useState<{ id: string; title: string; scheduled_at: string; platforms: string[]; status: string }[]>([]);
  const [products, setProducts] = useState<ProductOption[]>([]);
  const [busy, setBusy] = useState<string | null>(null);
  const [confirm, setConfirm] = useState<Campaign | null>(null);

  // New ad form
  const [search, setSearch] = useState("");
  const [productId, setProductId] = useState<number | null>(null);
  const [gen, setGen] = useState<Generated | null>(null);
  const [draft, setDraft] = useState({ name: "", primary_text: "", headline: "", description: "", image_url: "", budget: "10", start: addDays(today, 1), end: addDays(today, 14) });

  const load = useCallback(async () => {
    setLoading(true);
    const monthStart = `${today.slice(0, 7)}-01`;
    const in30 = new Date(Date.now() + 30 * 86400_000).toISOString();
    const [c, s, spend, p, sp] = await Promise.all([
      (supabase.from("ad_campaigns" as any) as any).select("*").order("created_at", { ascending: false }),
      (supabase.from("ad_settings" as any) as any).select("monthly_cap_cents, auto_pause").eq("id", 1).maybeSingle(),
      (supabase.from("ad_insights_daily" as any) as any).select("spend_cents").gte("date", monthStart),
      supabase
        .from("products")
        .select("id, title, price, vendor_profiles(store_name)")
        .eq("status", "published")
        .order("title")
        .limit(1000),
      (supabase.from("scheduled_posts" as any) as any)
        .select("id, title, scheduled_at, platforms, status")
        .gte("scheduled_at", new Date().toISOString())
        .lte("scheduled_at", in30)
        .order("scheduled_at"),
    ]);
    if (c.error) toast.error("Couldn't load ads. Has the Meta ads migration been run?");
    setCampaigns((c.data ?? []) as Campaign[]);
    if (s.data) {
      setSettings(s.data);
      setCapInput(String(s.data.monthly_cap_cents / 100));
    }
    setMonthSpend((spend.data ?? []).reduce((sum: number, r: any) => sum + (r.spend_cents ?? 0), 0));
    setProducts(
      ((p.data ?? []) as any[]).map((x) => ({ id: x.id, title: x.title, price: Number(x.price), store: x.vendor_profiles?.store_name ?? "" })),
    );
    setPosts((sp.data ?? []) as any[]);
    setLoading(false);
  }, [today]);

  useEffect(() => {
    load();
  }, [load]);

  const filteredProducts = useMemo(() => {
    const q = search.trim().toLowerCase();
    const list = q ? products.filter((p) => `${p.title} ${p.store}`.toLowerCase().includes(q)) : products;
    return list.slice(0, 200);
  }, [products, search]);

  const saveSettings = async (next: Partial<typeof settings>) => {
    const merged = { ...settings, ...next };
    const { error } = await (supabase.from("ad_settings" as any) as any)
      .update({ ...merged, updated_at: new Date().toISOString() })
      .eq("id", 1);
    if (error) return toast.error("Couldn't save ad settings.");
    setSettings(merged);
    toast.success("Ad settings saved");
  };

  const generate = async () => {
    if (!productId) return toast.error("Choose a product first.");
    setBusy("generate");
    try {
      const data: Generated = await callApi("/api/ads-generate", { product_id: productId });
      setGen(data);
      const v = data.variants[0];
      const month = new Date(`${draft.start}T00:00:00Z`).toLocaleDateString("en-AU", { month: "short", year: "numeric", timeZone: "UTC" });
      setDraft((d) => ({
        ...d,
        name: `${data.product.title} · ${month}`.slice(0, 120),
        primary_text: v?.primary_text ?? "",
        headline: v?.headline ?? "",
        description: v?.description ?? "",
        image_url: data.product.image_url ?? "",
        budget: String(data.suggested_daily_budget_cents / 100),
      }));
      if (data.source === "template") toast.info("AI copy wasn't available, so this draft uses the product's own details. Edit it before saving.");
    } catch (err: any) {
      toast.error(err.message);
    } finally {
      setBusy(null);
    }
  };

  const saveDraft = async () => {
    if (!gen) return;
    const budgetCents = Math.round(Number(draft.budget) * 100);
    if (!draft.name.trim() || !draft.primary_text.trim() || !draft.headline.trim()) return toast.error("Name, primary text and headline are required.");
    if (!Number.isFinite(budgetCents) || budgetCents < 100 || budgetCents > 100000) return toast.error("Daily budget must be between $1 and $1,000.");
    if (draft.end < draft.start) return toast.error("The end date is before the start date.");
    if (!/^https:\/\//.test(draft.image_url)) return toast.error("Add an image URL.");
    const maths = breakEven(gen.product.price_cents, gen.commission_rate);
    const { data: auth } = await supabase.auth.getUser();
    setBusy("save");
    const { error } = await (supabase.from("ad_campaigns" as any) as any).insert({
      name: draft.name.trim().slice(0, 120),
      product_id: gen.product.id,
      vendor_id: gen.product.vendor_id,
      status: "draft",
      daily_budget_cents: budgetCents,
      start_date: draft.start,
      end_date: draft.end,
      primary_text: draft.primary_text.trim(),
      headline: draft.headline.trim(),
      description: draft.description.trim() || null,
      image_url: draft.image_url.trim(),
      link_url: gen.product.link_url,
      price_cents: gen.product.price_cents,
      commission_rate: gen.commission_rate,
      break_even_cents: maths.breakEvenCents,
      stop_loss_cents: maths.stopLossCents,
      created_by: auth.user?.id ?? null,
    });
    setBusy(null);
    if (error) return toast.error(error.message.includes("duplicate") ? "An ad with that name exists." : "Couldn't save the draft.");
    toast.success("Draft saved. Next: Create in Meta.");
    setGen(null);
    setProductId(null);
    load();
  };

  const metaAction = async (c: Campaign, action: "create" | "activate" | "pause") => {
    setBusy(`${action}:${c.id}`);
    try {
      await callApi("/api/ads-meta", { campaign_id: c.id, action });
      toast.success(action === "create" ? "Created in Meta (switched off)." : action === "activate" ? "Ad switched on." : "Ad paused.");
    } catch (err: any) {
      toast.error(err.message);
    } finally {
      setBusy(null);
      load();
    }
  };

  const syncNow = async () => {
    setBusy("sync");
    try {
      const r = await callApi("/api/ads-sync", {});
      if (r.errors?.length) toast.warning(r.errors.join(" · ").slice(0, 300));
      else toast.success(`Synced ${r.synced} ad(s). Meta: ${r.meta}.`);
    } catch (err: any) {
      toast.error(err.message);
    } finally {
      setBusy(null);
      load();
    }
  };

  const remove = async (c: Campaign) => {
    if (c.meta_campaign_id) return toast.error("This ad exists in Meta. Pause it instead.");
    const { error } = await (supabase.from("ad_campaigns" as any) as any).delete().eq("id", c.id);
    if (error) return toast.error("Couldn't delete the draft.");
    load();
  };

  // Next 30 days: organic posts and ad flights together.
  const calendar = useMemo(() => {
    const days: Record<string, string[]> = {};
    const end = addDays(today, 30);
    for (const p of posts) {
      const d = melbourneDate(new Date(p.scheduled_at));
      (days[d] ??= []).push(`Post (${(p.platforms ?? []).join(", ")}): ${p.title}${p.status === "draft" ? " · draft" : ""}`);
    }
    for (const c of campaigns.filter((x) => x.status !== "completed" && x.end_date >= today && x.start_date <= end)) {
      (days[c.start_date >= today ? c.start_date : today] ??= []).push(`Ad ${c.status}: ${c.name} · ${money(c.daily_budget_cents)}/day to ${c.end_date}`);
    }
    return Object.entries(days).sort(([a], [b]) => a.localeCompare(b));
  }, [posts, campaigns, today]);

  const capPct = settings.monthly_cap_cents > 0 ? Math.min(100, (monthSpend / settings.monthly_cap_cents) * 100) : 0;
  const maths = gen ? breakEven(gen.product.price_cents, gen.commission_rate) : null;

  if (loading) {
    return (
      <div className="flex justify-center py-16">
        <Loader2 className="h-6 w-6 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="grid gap-4 md:grid-cols-3">
        <Card className="md:col-span-2">
          <CardHeader className="pb-2">
            <CardTitle className="text-base">This month's ad spend</CardTitle>
            <CardDescription>
              {money(monthSpend)} of {money(settings.monthly_cap_cents)} cap. Ads can't be switched on past the cap, and the daily sync pauses everything once it's reached.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <Progress value={capPct} />
            <div className="flex flex-wrap items-end gap-3">
              <div className="space-y-1">
                <Label htmlFor="ads-cap">Monthly cap ($)</Label>
                <Input id="ads-cap" type="number" min={0} step={10} className="w-32" value={capInput} onChange={(e) => setCapInput(e.target.value)} />
              </div>
              <Button variant="outline" onClick={() => saveSettings({ monthly_cap_cents: Math.max(0, Math.round(Number(capInput) * 100) || 0) })}>
                Save cap
              </Button>
              <label className="flex items-center gap-2 text-sm">
                <Switch checked={settings.auto_pause} onCheckedChange={(v) => saveSettings({ auto_pause: v })} />
                Auto-pause ads that spend 3× break-even with no sale
              </label>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-base">Results</CardTitle>
            <CardDescription>Spend and purchases come from Meta once a day (7am). Orders come from our own checkout tracking.</CardDescription>
          </CardHeader>
          <CardContent>
            <Button onClick={syncNow} disabled={busy === "sync"} className="w-full">
              {busy === "sync" ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <RefreshCw className="mr-2 h-4 w-4" />}
              Sync now
            </Button>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <div className="flex items-center gap-2">
            <Sparkles className="h-5 w-5 text-primary" />
            <CardTitle>New ad</CardTitle>
          </div>
          <CardDescription>Pick a product. We'll work out its break-even and draft the ad copy for you to edit.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid gap-3 md:grid-cols-[1fr_2fr_auto] md:items-end">
            <div className="space-y-1">
              <Label htmlFor="ads-search">Search products</Label>
              <Input id="ads-search" placeholder="e.g. gift set" value={search} onChange={(e) => setSearch(e.target.value)} />
            </div>
            <div className="space-y-1">
              <Label htmlFor="ads-product">Product</Label>
              <select
                id="ads-product"
                className="h-10 w-full rounded-md border border-input bg-background px-3 text-sm"
                value={productId ?? ""}
                onChange={(e) => setProductId(e.target.value ? Number(e.target.value) : null)}
              >
                <option value="">Choose a product…</option>
                {filteredProducts.map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.title} · {p.store} · ${p.price.toFixed(2)}
                  </option>
                ))}
              </select>
            </div>
            <Button onClick={generate} disabled={!productId || busy === "generate"}>
              {busy === "generate" ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Sparkles className="mr-2 h-4 w-4" />}
              Generate
            </Button>
          </div>

          {gen && maths && (
            <div className="space-y-4 rounded-lg border p-4">
              <div className="grid gap-2 text-sm sm:grid-cols-4">
                <div>
                  <div className="text-muted-foreground">Price</div>
                  <div className="font-semibold">{money(gen.product.price_cents)}</div>
                </div>
                <div>
                  <div className="text-muted-foreground">LMG commission ({gen.commission_rate ?? 10}%)</div>
                  <div className="font-semibold">{money(maths.commissionCents)}</div>
                </div>
                <div>
                  <div className="text-muted-foreground">Break-even per sale</div>
                  <div className="font-semibold">{money(maths.breakEvenCents)}</div>
                </div>
                <div>
                  <div className="text-muted-foreground">Stop rule</div>
                  <div className="font-semibold">{money(maths.stopLossCents)} with no sale</div>
                </div>
              </div>
              {maths.breakEvenCents < 1000 && (
                <p className="text-sm text-amber-700 dark:text-amber-300">
                  Break-even is under $10 a sale, which is hard for cold Meta ads to beat. Consider a higher-priced product or asking the vendor to share the cost.
                </p>
              )}

              <div className="space-y-2">
                <Label>Copy options {gen.source === "template" && <span className="text-muted-foreground">(from product details)</span>}</Label>
                <div className="grid gap-2 md:grid-cols-3">
                  {gen.variants.map((v, i) => (
                    <button
                      key={i}
                      type="button"
                      onClick={() => setDraft((d) => ({ ...d, primary_text: v.primary_text, headline: v.headline, description: v.description }))}
                      className="rounded-md border p-3 text-left text-xs hover:border-primary"
                    >
                      <div className="mb-1 font-semibold">{v.headline}</div>
                      <div className="line-clamp-4 text-muted-foreground">{v.primary_text}</div>
                    </button>
                  ))}
                </div>
              </div>

              <div className="grid gap-3 md:grid-cols-2">
                <div className="space-y-1 md:col-span-2">
                  <Label htmlFor="ads-name">Ad name (also the utm_campaign)</Label>
                  <Input id="ads-name" value={draft.name} maxLength={120} onChange={(e) => setDraft({ ...draft, name: e.target.value })} />
                </div>
                <div className="space-y-1 md:col-span-2">
                  <Label htmlFor="ads-primary">Primary text</Label>
                  <Textarea id="ads-primary" rows={4} maxLength={COPY_LIMITS.primary_text} value={draft.primary_text} onChange={(e) => setDraft({ ...draft, primary_text: e.target.value })} />
                </div>
                <div className="space-y-1">
                  <Label htmlFor="ads-headline">Headline</Label>
                  <Input id="ads-headline" maxLength={COPY_LIMITS.headline} value={draft.headline} onChange={(e) => setDraft({ ...draft, headline: e.target.value })} />
                </div>
                <div className="space-y-1">
                  <Label htmlFor="ads-description">Description</Label>
                  <Input id="ads-description" maxLength={COPY_LIMITS.description} value={draft.description} onChange={(e) => setDraft({ ...draft, description: e.target.value })} />
                </div>
                <div className="space-y-1 md:col-span-2">
                  <Label htmlFor="ads-image">Image URL (1080×1350 or 1080×1080 works best)</Label>
                  <Input id="ads-image" value={draft.image_url} onChange={(e) => setDraft({ ...draft, image_url: e.target.value })} />
                </div>
                <div className="space-y-1">
                  <Label htmlFor="ads-budget">Daily budget ($)</Label>
                  <Input id="ads-budget" type="number" min={1} max={1000} step={1} value={draft.budget} onChange={(e) => setDraft({ ...draft, budget: e.target.value })} />
                </div>
                <div className="grid grid-cols-2 gap-2">
                  <div className="space-y-1">
                    <Label htmlFor="ads-start">Start</Label>
                    <Input id="ads-start" type="date" value={draft.start} onChange={(e) => setDraft({ ...draft, start: e.target.value })} />
                  </div>
                  <div className="space-y-1">
                    <Label htmlFor="ads-end">End</Label>
                    <Input id="ads-end" type="date" value={draft.end} onChange={(e) => setDraft({ ...draft, end: e.target.value })} />
                  </div>
                </div>
              </div>
              <div className="flex gap-2">
                <Button onClick={saveDraft} disabled={busy === "save"}>
                  {busy === "save" && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                  Save draft
                </Button>
                <Button variant="ghost" onClick={() => setGen(null)}>
                  Cancel
                </Button>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <div className="flex items-center gap-2">
            <Megaphone className="h-5 w-5 text-primary" />
            <CardTitle>Ads</CardTitle>
          </div>
          <CardDescription>Cost per sale is green when it's under the product's break-even. Profit is LMG's commission minus ad spend.</CardDescription>
        </CardHeader>
        <CardContent>
          {campaigns.length === 0 ? (
            <p className="py-8 text-center text-sm text-muted-foreground">No ads yet. Generate one above.</p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full min-w-[900px] text-sm">
                <thead>
                  <tr className="border-b text-left text-muted-foreground">
                    <th className="pb-2 font-medium">Ad</th>
                    <th className="pb-2 font-medium">Budget</th>
                    <th className="pb-2 text-right font-medium">Spend</th>
                    <th className="pb-2 text-right font-medium">Sales (Meta / ours)</th>
                    <th className="pb-2 text-right font-medium">Cost per sale</th>
                    <th className="pb-2 text-right font-medium">Revenue</th>
                    <th className="pb-2 text-right font-medium">Profit</th>
                    <th className="pb-2 text-right font-medium">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {campaigns.map((c) => {
                    const sales = Math.max(c.meta_purchases_total, c.our_orders);
                    const cps = sales > 0 ? Math.round(c.spend_cents_total / sales) : null;
                    const good = cps != null && c.break_even_cents != null && cps <= c.break_even_cents;
                    const profit = c.our_commission_cents - c.spend_cents_total;
                    return (
                      <tr key={c.id} className="border-b align-top last:border-0">
                        <td className="py-3 pr-3">
                          <div className="font-medium">{c.name}</div>
                          <div className="mt-1 flex flex-wrap items-center gap-2 text-xs text-muted-foreground">
                            <Badge className={STATUS_STYLE[c.status]}>{c.status}</Badge>
                            {c.start_date} to {c.end_date}
                          </div>
                          {c.paused_reason && <div className="mt-1 text-xs text-muted-foreground">{c.paused_reason}</div>}
                          {c.last_error && <div className="mt-1 text-xs text-red-600">{c.last_error}</div>}
                        </td>
                        <td className="py-3">{money(c.daily_budget_cents)}/day</td>
                        <td className="py-3 text-right">{money(c.spend_cents_total)}</td>
                        <td className="py-3 text-right">
                          {c.meta_purchases_total} / {c.our_orders}
                        </td>
                        <td className={`py-3 text-right ${cps == null ? "text-muted-foreground" : good ? "text-emerald-600" : "text-red-600"}`}>
                          {cps == null ? "–" : money(cps)}
                          <div className="text-xs text-muted-foreground">break-even {money(c.break_even_cents)}</div>
                        </td>
                        <td className="py-3 text-right">{money(c.our_revenue_cents)}</td>
                        <td className={`py-3 text-right ${profit >= 0 ? "text-emerald-600" : "text-red-600"}`}>{money(profit)}</td>
                        <td className="py-3">
                          <div className="flex justify-end gap-1">
                            {(c.status === "draft" || c.status === "error" || !c.meta_ad_id) && (
                              <Button size="sm" variant="outline" disabled={!!busy} onClick={() => metaAction(c, "create")}>
                                {busy === `create:${c.id}` ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="mr-1 h-4 w-4" />}
                                Create in Meta
                              </Button>
                            )}
                            {c.status === "paused" && c.meta_ad_id && (
                              <Button size="sm" disabled={!!busy} onClick={() => setConfirm(c)}>
                                <Play className="mr-1 h-4 w-4" />
                                Switch on
                              </Button>
                            )}
                            {c.status === "active" && (
                              <Button size="sm" variant="outline" disabled={!!busy} onClick={() => metaAction(c, "pause")}>
                                {busy === `pause:${c.id}` ? <Loader2 className="h-4 w-4 animate-spin" /> : <Pause className="mr-1 h-4 w-4" />}
                                Pause
                              </Button>
                            )}
                            {!c.meta_campaign_id && (
                              <Button size="sm" variant="ghost" disabled={!!busy} onClick={() => remove(c)} aria-label="Delete draft">
                                <Trash2 className="h-4 w-4" />
                              </Button>
                            )}
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <div className="flex items-center gap-2">
            <CalendarDays className="h-5 w-5 text-primary" />
            <CardTitle>Next 30 days</CardTitle>
          </div>
          <CardDescription>Scheduled posts from Marketing & Buffer, and ads that are running or about to start.</CardDescription>
        </CardHeader>
        <CardContent>
          {calendar.length === 0 ? (
            <p className="text-sm text-muted-foreground">Nothing scheduled.</p>
          ) : (
            <ul className="space-y-3 text-sm">
              {calendar.map(([date, items]) => (
                <li key={date}>
                  <div className="font-medium">
                    {new Date(`${date}T00:00:00Z`).toLocaleDateString("en-AU", { weekday: "short", day: "numeric", month: "short", timeZone: "UTC" })}
                  </div>
                  <ul className="ml-4 list-disc text-muted-foreground">
                    {items.map((t, i) => (
                      <li key={i}>{t}</li>
                    ))}
                  </ul>
                </li>
              ))}
            </ul>
          )}
        </CardContent>
      </Card>

      <AlertDialog open={!!confirm} onOpenChange={(o) => !o && setConfirm(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Switch this ad on?</AlertDialogTitle>
            <AlertDialogDescription>
              {confirm &&
                `"${confirm.name}" will spend up to ${money(confirm.daily_budget_cents)} a day from ${confirm.start_date} to ${confirm.end_date}. This month's spend so far is ${money(monthSpend)} of the ${money(settings.monthly_cap_cents)} cap.`}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => {
                const c = confirm;
                setConfirm(null);
                if (c) metaAction(c, "activate");
              }}
            >
              Switch on
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
