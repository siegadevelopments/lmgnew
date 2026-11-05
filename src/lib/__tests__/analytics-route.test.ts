import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { generateKeyPairSync } from "crypto";

const caller = vi.hoisted(() => ({ admin: false }));
vi.mock("@/lib/server-auth", () => ({
  requireUser: async () => (caller.admin ? null : new Response("no", { status: 401 })),
}));

const { privateKey } = generateKeyPairSync("rsa", { modulusLength: 2048, privateKeyEncoding: { type: "pkcs8", format: "pem" }, publicKeyEncoding: { type: "spki", format: "pem" } });

const rows = (...r: [string[], string[]][]) => ({ rows: r.map(([d, m]) => ({ dimensionValues: d.map((value) => ({ value })), metricValues: m.map((value) => ({ value })) })) });

// Mimics GA4 for a small site: 926 users, 1,248 views.
function ga(body: any) {
  const dims = (body.dimensions ?? []).map((d: any) => d.name).join(",");
  if (dims === "") return rows([[], ["926", "1100", "1248", "41"]]);
  if (dims === "sessionDefaultChannelGroup") return rows([["Organic Search"], ["600", "500"]], [["Direct"], ["300", "250"]], [["Referral"], ["200", "176"]]);
  if (dims === "deviceCategory") return rows([["mobile"], ["600"]], [["desktop"], ["326"]]);
  if (dims === "pagePath,pageTitle") return rows([["/recipes", "Recipes"], ["400", "4000"]], [["/", "Home"], ["300", "900"]]);
  if (dims === "date") return rows([["20261103"], ["120", "180"]], [["20261104"], ["130", "200"]]);
  return { rows: [] };
}

function installFetch(opts: { gaFail?: (dims: string) => boolean; meta?: "ok" | "fail" | "bad-token" } = {}) {
  const calls: string[] = [];
  vi.stubGlobal("fetch", vi.fn(async (url: string, init?: any) => {
    calls.push(String(url));
    if (url.includes("oauth2.googleapis.com")) return Response.json({ access_token: "tok" });
    if (url.includes("analyticsdata.googleapis.com")) {
      const body = JSON.parse(init.body);
      const dims = (body.dimensions ?? []).map((d: any) => d.name).join(",");
      if (opts.gaFail?.(dims)) return new Response("boom", { status: 500 });
      return Response.json(ga(body));
    }
    if (url.includes("graph.facebook.com")) {
      if (opts.meta === "fail") return Response.json({ error: { message: "nope" } }, { status: 400 });
      if (opts.meta === "bad-token") return Response.json({ error: { message: "Invalid OAuth access token EAAB123secret.", code: 190 } }, { status: 401 });
      const metric = /metric=([a-z_]+)/.exec(url)![1];
      // pretend the legacy name is the only one that works
      if (metric === "page_total_media_view_unique" || metric === "page_media_view") return Response.json({ error: {} }, { status: 400 });
      return Response.json({ data: [{ values: [{ value: 10, end_time: "2026-11-03T08:00:00+0000" }, { value: 15, end_time: "2026-11-04T08:00:00+0000" }] }] });
    }
    throw new Error(`unexpected fetch ${url}`);
  }));
  return calls;
}

async function load() {
  vi.resetModules(); // route keeps a module-level cache
  const { GET } = await import("../../../app/api/analytics/route");
  return (await GET(new Request("http://localhost/api/analytics"))).json();
}

beforeEach(() => {
  caller.admin = false;
  process.env.GA4_PROPERTY_ID = "123";
  process.env.GA4_CLIENT_EMAIL = "sa@example.iam.gserviceaccount.com";
  process.env.GA4_PRIVATE_KEY = privateKey.replace(/\n/g, "\\n");
  process.env.META_PAGE_ACCESS_TOKEN = "meta-token";
  process.env.META_PAGE_ID = "999";
  delete process.env.META_ACCESS_TOKEN;
});
afterEach(() => vi.unstubAllGlobals());

describe("GET /api/analytics", () => {
  it("returns real, mutually consistent website figures and a single period", async () => {
    installFetch();
    const j = await load();
    expect(j.website.totals.users).toBe(926);
    expect(j.website.totals.pageViews).toBe(1248);
    const channelSessions = j.website.channels.reduce((s: number, c: any) => s + c.sessions, 0);
    expect(channelSessions).toBe(j.website.totals.sessions);
    expect(j.website.channels.reduce((s: number, c: any) => s + c.percentage, 0)).toBeCloseTo(100, 0);
    expect(j.website.topPages.reduce((s: number, p: any) => s + p.views, 0)).toBeLessThanOrEqual(j.website.totals.pageViews);
    expect(j.website.mobilePercentage).toBeCloseTo(64.8, 0);
    expect(j.website.daily).toHaveLength(7);
    expect(j.period.days).toBe(28);
    expect(j.chartPeriod.days).toBe(7);
    expect(j.period.end).toBe(j.chartPeriod.end);
    expect(typeof j.generatedAt).toBe("string");
  });

  it("never combines website and social into one audience figure and has no demo numbers", async () => {
    installFetch();
    const j = await load();
    expect(j).not.toHaveProperty("combinedTotals");
    expect(JSON.stringify(j)).not.toMatch(/48920|84500|124850|162300|19400|1280/);
  });

  it("reads the Meta token from META_PAGE_ACCESS_TOKEN and falls back from new to legacy metric names", async () => {
    installFetch();
    const j = await load();
    expect(j.social.reach).toBe(15); // rolling value: latest
    expect(j.social.engagements).toBe(25);
  });

  it("blanks only the section whose request failed", async () => {
    installFetch({ gaFail: (d) => d === "pagePath,pageTitle" });
    const j = await load();
    expect(j.website.topPages).toBeNull();
    expect(j.website.totals.users).toBe(926);
  });

  it("returns null sections (not placeholders) when everything fails or is unconfigured", async () => {
    installFetch({ gaFail: () => true, meta: "fail" });
    const j = await load();
    expect(j.website).toBeNull();
    expect(j.social).toBeNull();
    delete process.env.GA4_PROPERTY_ID;
    delete process.env.META_PAGE_ID;
    const k = await load();
    expect(k.website).toBeNull();
    expect(k.social).toBeNull();
  });

  it("hides diagnostics from the public", async () => {
    installFetch({ gaFail: () => true });
    const j = await load();
    expect(j).not.toHaveProperty("debug");
    expect(j).not.toHaveProperty("diagnostics");
  });

  it("tells admins why Meta returned nothing (error code, page probe) without leaking the token", async () => {
    installFetch({ meta: "bad-token" });
    caller.admin = true;
    const j = await load();
    expect(j.social).toBeNull();
    expect(j.debug.metaError).toMatch(/no insights/);
    expect(j.debug.metaError).toMatch(/code 190/);
    expect(j.debug.metaError).toMatch(/page lookup failed/);
    expect(JSON.stringify(j)).not.toMatch(/EAAB123secret|meta-token/);
  });

  it("keeps Meta errors away from the public", async () => {
    installFetch({ meta: "bad-token" });
    const j = await load();
    expect(j.social).toBeNull();
    expect(JSON.stringify(j)).not.toMatch(/190|insights|OAuth/);
  });

  it("lists partly-missing Meta metrics for admins while still showing the rest", async () => {
    installFetch();
    caller.admin = true;
    const j = await load();
    expect(j.social.reach).toBe(15);
    expect(j.debug.metaIssues.join(" ")).toMatch(/page_total_media_view_unique/);
  });
});
