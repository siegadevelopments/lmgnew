import { describe, it, expect } from "vitest";
import { readFileSync, readdirSync } from "fs";
import path from "path";

// Regression: api/buffer-auto-publish.ts posted to LMG's Facebook/Instagram via Buffer with no
// auth check. Every Vercel api route that acts on LMG's accounts or data must check the caller.
const API = path.resolve(import.meta.dirname, "../../../api");
const PUBLIC_BY_DESIGN = new Set(["ai-chat.ts"]); // public site chat assistant

describe("api routes check the caller", () => {
  const routes = readdirSync(API).filter((f) => f.endsWith(".ts") && !f.startsWith("_") && !PUBLIC_BY_DESIGN.has(f));
  it.each(routes)("%s", (f) => {
    const src = readFileSync(path.join(API, f), "utf8");
    expect(src).toMatch(/requireAdmin\(req\)|auth\.getUser\(\)|CRON_SECRET/);
  });

  it("the admin Marketing tab sends the session to the Buffer endpoint", () => {
    const tab = readFileSync(path.resolve(import.meta.dirname, "../../components/admin/AdminMarketingTab.tsx"), "utf8");
    const calls = tab.split('fetch("/api/buffer-auto-publish"').slice(1);
    expect(calls.length).toBeGreaterThan(0);
    for (const c of calls) expect(c.slice(0, 200)).toContain("...(await authHeaders())");
  });
});
