// Minimal Meta Graph / Marketing API client for api/ads-*.ts. Server-side only.
// Configuration (Vercel environment variables, see docs/DEVELOPMENT_STANDARDS.md §8):
//   META_ADS_TOKEN       System User token with ads_management, ads_read, business_management,
//                        pages_read_engagement (never NEXT_PUBLIC_)
//   META_AD_ACCOUNT_ID   ad account id, with or without the act_ prefix
//   META_PAGE_ID         the LMG Facebook page (already used by the old publisher)
//   META_PIXEL_ID        optional; falls back to NEXT_PUBLIC_META_PIXEL_ID
//   META_INSTAGRAM_USER_ID  optional; the Instagram account ads should run as
//   META_GRAPH_VERSION   optional; defaults to v23.0

export interface MetaConfig {
  token: string;
  adAccountId: string; // act_123
  pageId: string;
  pixelId: string;
  instagramUserId?: string;
  version: string;
}

export function metaConfig(): { config: MetaConfig | null; missing: string[] } {
  const token = process.env.META_ADS_TOKEN || "";
  const account = (process.env.META_AD_ACCOUNT_ID || "").trim();
  const pageId = process.env.META_PAGE_ID || "";
  const pixelId = process.env.META_PIXEL_ID || process.env.NEXT_PUBLIC_META_PIXEL_ID || "";
  const missing = [
    !token && "META_ADS_TOKEN",
    !account && "META_AD_ACCOUNT_ID",
    !pageId && "META_PAGE_ID",
    !pixelId && "META_PIXEL_ID",
  ].filter(Boolean) as string[];
  if (missing.length > 0) return { config: null, missing };
  return {
    config: {
      token,
      adAccountId: account.startsWith("act_") ? account : `act_${account}`,
      pageId,
      pixelId,
      instagramUserId: process.env.META_INSTAGRAM_USER_ID || undefined,
      version: process.env.META_GRAPH_VERSION || "v23.0",
    },
    missing: [],
  };
}

export class MetaError extends Error {}

async function call(cfg: MetaConfig, method: "GET" | "POST", path: string, params: Record<string, string>) {
  const url = new URL(`https://graph.facebook.com/${cfg.version}/${path.replace(/^\//, "")}`);
  const init: RequestInit = { method, headers: { Authorization: `Bearer ${cfg.token}` } };
  if (method === "GET") {
    for (const [k, v] of Object.entries(params)) url.searchParams.set(k, v);
  } else {
    init.body = new URLSearchParams(params);
  }
  const res = await fetch(url, init);
  const data: any = await res.json().catch(() => ({}));
  if (!res.ok || data?.error) {
    // Meta's message is safe to show admins (no token in it); keep it short.
    const msg = data?.error?.error_user_msg || data?.error?.message || `HTTP ${res.status}`;
    throw new MetaError(`Meta: ${String(msg).slice(0, 300)}`);
  }
  return data;
}

export const metaGet = (cfg: MetaConfig, path: string, params: Record<string, string> = {}) => call(cfg, "GET", path, params);
export const metaPost = (cfg: MetaConfig, path: string, params: Record<string, string>) => call(cfg, "POST", path, params);
