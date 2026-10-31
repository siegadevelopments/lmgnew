"use client";

// Admin > Product Catalog > Import from Shopify. Imports a vendor's Shopify catalogue as draft
// products (every image copied to R2), lets the admin publish the clean drafts, and shows the
// daily stock sync for each linked store. The work happens in the import-shopify-catalogue Edge
// Function; see supabase/functions/import-shopify-catalogue/index.ts.

import { useCallback, useEffect, useMemo, useState } from "react";
import { toast } from "sonner";
import { AlertTriangle, Loader2, RefreshCw, Store } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { supabase } from "@/integrations/supabase/client";

type VendorOption = { id: string; store_name: string | null };
type ProductRow = {
  id: number;
  vendor_id: string | null;
  status: string;
  source_platform?: string | null;
  import_issue?: string | null;
};
type StoreRow = {
  vendor_id: string;
  store_url: string;
  sync_enabled: boolean;
  last_synced_at: string | null;
  last_sync_status: "ok" | "failed" | null;
  last_sync_message: string | null;
  created_at: string;
};
type Totals = {
  imported: number;
  existing: number;
  retried: number;
  flagged: Array<{ name: string; issue: string }>;
  skipped: Array<{ name: string; reason: string }>;
};

const EMPTY: Totals = { imported: 0, existing: 0, retried: 0, flagged: [], skipped: [] };
const MAX_BATCHES = 400; // a safety stop; a real catalogue is a few dozen batches at most

// The schedule runs daily; more than 36 hours without a sync means it has stopped working.
const isStale = (iso: string) => Date.now() - new Date(iso).getTime() > 36 * 3600 * 1000;

// A failed function call carries the server's message in the response body.
async function messageFrom(error: any): Promise<string> {
  try {
    const body = await error?.context?.json?.();
    if (body?.error) return String(body.error);
  } catch {
    // fall through
  }
  return error?.message || "Something went wrong.";
}

export function AdminShopifyImport({
  vendors,
  products,
  setProducts,
}: {
  vendors: VendorOption[];
  products: ProductRow[];
  setProducts: (rows: any[]) => void;
}) {
  const [storeUrl, setStoreUrl] = useState("");
  const [vendorId, setVendorId] = useState("");
  const [quantity, setQuantity] = useState("100");
  const [running, setRunning] = useState(false);
  const [totals, setTotals] = useState<Totals | null>(null);
  const [stores, setStores] = useState<StoreRow[]>([]);
  const [busyStore, setBusyStore] = useState<string | null>(null);
  const [publishing, setPublishing] = useState(false);

  const vendorName = useCallback(
    (id: string) => vendors.find((v) => v.id === id)?.store_name || "Unknown vendor",
    [vendors],
  );

  const loadStores = useCallback(async () => {
    const { data, error } = await (supabase.from("vendor_shopify_stores") as any).select("*").order("created_at");
    if (error) console.error("Shopify stores error:", error.message);
    else setStores((data || []) as StoreRow[]);
  }, []);

  useEffect(() => {
    loadStores();
  }, [loadStores]);

  const refreshProducts = useCallback(async () => {
    const { data } = await supabase
      .from("products")
      .select("*, vendor_profiles(store_name)")
      .order("created_at", { ascending: false })
      .limit(500);
    setProducts((data || []).map((p: any) => ({ ...p, vendor: p.vendor_profiles || null })));
  }, [setProducts]);

  // Imported drafts for the chosen vendor: the clean ones can be published, flagged ones cannot.
  const drafts = useMemo(
    () => products.filter((p) => p.vendor_id === vendorId && p.source_platform === "shopify" && p.status === "draft"),
    [products, vendorId],
  );
  const publishable = drafts.filter((p) => !p.import_issue);
  const flaggedCount = drafts.length - publishable.length;

  const runImport = async () => {
    if (!storeUrl.trim() || !vendorId) {
      toast.error("Enter the store address and choose the vendor.");
      return;
    }
    setRunning(true);
    const acc: Totals = { ...EMPTY, flagged: [], skipped: [] };
    setTotals(acc);
    try {
      let cursor: { page: number; offset: number } | null | undefined;
      for (let i = 0; i < MAX_BATCHES; i++) {
        const { data, error }: { data: any; error: any } = await supabase.functions.invoke("import-shopify-catalogue", {
          body: { op: "import", storeUrl, vendorId, startingQuantity: Number(quantity), cursor },
        });
        if (error) throw new Error(await messageFrom(error));
        acc.imported += data.imported;
        acc.existing += data.existing;
        acc.retried += data.retried;
        acc.flagged.push(...data.flagged);
        acc.skipped.push(...data.skipped);
        setTotals({ ...acc, flagged: [...acc.flagged], skipped: [...acc.skipped] });
        cursor = data.next;
        if (!cursor) break;
      }
      toast.success("Import finished. Review the drafts below.");
    } catch (err: any) {
      toast.error(err.message || "Import failed");
    } finally {
      setRunning(false);
      await Promise.all([refreshProducts(), loadStores()]);
    }
  };

  const publishClean = async () => {
    if (publishable.length === 0) return;
    setPublishing(true);
    const { error } = await (supabase.from("products") as any)
      .update({ status: "published" })
      .in("id", publishable.map((p) => p.id));
    setPublishing(false);
    if (error) return toast.error("Publishing failed: " + error.message);
    toast.success(`${publishable.length} product${publishable.length === 1 ? "" : "s"} published.`);
    await refreshProducts();
  };

  const toggleSync = async (s: StoreRow) => {
    setBusyStore(s.vendor_id);
    const { error } = await (supabase.from("vendor_shopify_stores") as any)
      .update({ sync_enabled: !s.sync_enabled, updated_at: new Date().toISOString() })
      .eq("vendor_id", s.vendor_id);
    setBusyStore(null);
    if (error) return toast.error("Couldn't change sync: " + error.message);
    await loadStores();
  };

  const syncNow = async (s: StoreRow) => {
    setBusyStore(s.vendor_id);
    const { error } = await supabase.functions.invoke("import-shopify-catalogue", {
      body: { op: "sync", vendorId: s.vendor_id },
    });
    setBusyStore(null);
    if (error) toast.error(await messageFrom(error));
    await Promise.all([loadStores(), refreshProducts()]);
  };

  return (
    <Card className="mb-6 border-border/50">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Store className="h-5 w-5" /> Import from Shopify
        </CardTitle>
        <CardDescription>
          Brings a vendor's Shopify products in as drafts and copies every image to our own storage. Nothing goes
          live until you publish it. Stock then follows their store daily.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="grid gap-4 sm:grid-cols-3">
          <div className="space-y-1.5 sm:col-span-2">
            <Label htmlFor="shopify-url">Shopify store address</Label>
            <Input
              id="shopify-url"
              placeholder="vendor-store.com"
              value={storeUrl}
              onChange={(e) => setStoreUrl(e.target.value)}
              disabled={running}
            />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="shopify-qty">Starting stock per variant</Label>
            <Input
              id="shopify-qty"
              type="number"
              min={0}
              max={100000}
              value={quantity}
              onChange={(e) => setQuantity(e.target.value)}
              disabled={running}
            />
          </div>
          <div className="space-y-1.5 sm:col-span-2">
            <Label htmlFor="shopify-vendor">Vendor</Label>
            <select
              id="shopify-vendor"
              value={vendorId}
              onChange={(e) => setVendorId(e.target.value)}
              disabled={running}
              className="h-10 w-full rounded-md border border-input bg-background px-3 text-sm"
            >
              <option value="">Choose a vendor…</option>
              {vendors.map((v) => (
                <option key={v.id} value={v.id}>
                  {v.store_name || v.id}
                </option>
              ))}
            </select>
          </div>
          <div className="flex items-end">
            <Button onClick={runImport} disabled={running} className="w-full">
              {running ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
              {running ? "Importing…" : "Import products"}
            </Button>
          </div>
        </div>

        {totals && (
          <div className="rounded-lg border border-border/50 bg-muted/30 p-4 text-sm space-y-2">
            <p className="font-semibold">
              {running ? "Importing… " : "Import result: "}
              {totals.imported} new draft{totals.imported === 1 ? "" : "s"}, {totals.existing} already imported
              {totals.retried ? `, ${totals.retried} fixed on retry` : ""}.
            </p>
            {totals.flagged.length > 0 && (
              <div>
                <p className="flex items-center gap-1.5 font-medium text-amber-700">
                  <AlertTriangle className="h-4 w-4" /> {totals.flagged.length} need fixing before they can be published
                </p>
                <ul className="ml-5 list-disc text-muted-foreground">
                  {totals.flagged.map((f, i) => (
                    <li key={i}>
                      {f.name}: {f.issue}
                    </li>
                  ))}
                </ul>
              </div>
            )}
            {totals.skipped.length > 0 && (
              <div>
                <p className="font-medium text-destructive">{totals.skipped.length} not imported</p>
                <ul className="ml-5 list-disc text-muted-foreground">
                  {totals.skipped.map((s, i) => (
                    <li key={i}>
                      {s.name}: {s.reason}
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </div>
        )}

        {vendorId && drafts.length > 0 && (
          <div className="flex flex-wrap items-center justify-between gap-3 rounded-lg border border-border/50 p-4 text-sm">
            <p>
              <strong>{publishable.length}</strong> imported draft{publishable.length === 1 ? "" : "s"} for{" "}
              {vendorName(vendorId)} ready to publish
              {flaggedCount > 0 ? `; ${flaggedCount} flagged and skipped (re-import once the images are fixed)` : ""}.
              Check the descriptions against the health-claims rules first; use Edit on each product in the list
              below.
            </p>
            <Button onClick={publishClean} disabled={publishing || publishable.length === 0}>
              {publishing ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
              Publish {publishable.length}
            </Button>
          </div>
        )}

        {stores.length > 0 && (
          <div>
            <h3 className="mb-2 text-sm font-semibold">Daily stock sync</h3>
            <div className="divide-y divide-border/50 rounded-lg border border-border/50">
              {stores.map((s) => (
                <div key={s.vendor_id} className="flex flex-wrap items-center justify-between gap-3 p-3 text-sm">
                  <div className="min-w-0">
                    <p className="font-medium">{vendorName(s.vendor_id)}</p>
                    <p className="truncate text-xs text-muted-foreground">{s.store_url}</p>
                    <p className="mt-1 text-xs text-muted-foreground">
                      {s.last_synced_at ? new Date(s.last_synced_at).toLocaleString("en-AU") : "Not synced yet"}
                      {s.last_sync_message ? `: ${s.last_sync_message}` : ""}
                    </p>
                  </div>
                  <div className="flex items-center gap-3">
                    {s.sync_enabled && isStale(s.last_synced_at ?? s.created_at) && (
                      <Badge variant="destructive" className="uppercase" title="No sync in over 36 hours. Check the schedule and the SHOPIFY_SYNC_SECRET setup.">
                        Stale
                      </Badge>
                    )}
                    {s.last_sync_status && (
                      <Badge variant={s.last_sync_status === "ok" ? "outline" : "destructive"} className="uppercase">
                        {s.last_sync_status === "ok" ? "OK" : "Failed"}
                      </Badge>
                    )}
                    <Button size="sm" variant="outline" onClick={() => syncNow(s)} disabled={busyStore === s.vendor_id}>
                      <RefreshCw className="mr-1.5 h-3.5 w-3.5" /> Sync now
                    </Button>
                    <div className="flex items-center gap-2">
                      <Switch
                        checked={s.sync_enabled}
                        onCheckedChange={() => toggleSync(s)}
                        disabled={busyStore === s.vendor_id}
                        aria-label={`Daily sync for ${vendorName(s.vendor_id)}`}
                      />
                      <span className="text-xs text-muted-foreground">{s.sync_enabled ? "On" : "Off"}</span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
