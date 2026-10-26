// /api/ads?op=generate|meta|sync — Admin > Meta Ads. One function for all three operations, to stay
// within the Vercel plan's serverless function limit. Each operation checks its own caller:
//   generate, meta: admins only (requireAdmin)            — see api/_ads-generate.ts, api/_ads-meta.ts
//   sync: the Vercel cron (Bearer CRON_SECRET) or an admin — see api/_ads-sync.ts
import type { VercelRequest, VercelResponse } from "@vercel/node";
import { generateAd } from "./_ads-generate.js";
import { metaAction } from "./_ads-meta.js";
import { syncAds } from "./_ads-sync.js";

export default async function handler(req: VercelRequest, res: VercelResponse) {
  const op = String(req.query?.op ?? "");
  if (op === "generate") return generateAd(req, res);
  if (op === "meta") return metaAction(req, res);
  if (op === "sync") return syncAds(req, res);
  return res.status(404).json({ error: "Unknown operation." });
}
