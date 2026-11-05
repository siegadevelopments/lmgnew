import { NextResponse } from "next/server";
import * as crypto from "crypto";
import { requireUser } from "@/lib/server-auth";
import {
  reportPeriods,
  shapeGaTotals,
  shapeGaChannels,
  shapeGaDevices,
  shapeGaTopPages,
  shapeGaDaily,
  mobileShare,
  sumMetaValues,
  lastMetaValue,
  metaDaily,
  type GaReport,
  type MetaValue,
  type ReportPeriod,
} from "@/lib/analytics-report";

export const dynamic = "force-dynamic";

// Public endpoint that costs Google/Meta API quota: cache the shaped result per server instance.
const CACHE_MS = 10 * 60 * 1000;
const FAILURE_CACHE_MS = 60 * 1000;
const FETCH_TIMEOUT_MS = 8000;
let cache: { at: number; ttl: number; payload: unknown } | null = null;

// Helper to generate Google OAuth2 Access Token via JWT Service Account credentials
async function getGa4AccessToken(clientEmail: string, privateKey: string): Promise<string> {
  const header = { alg: "RS256", typ: "JWT" };
  const now = Math.floor(Date.now() / 1000);
  const claim = {
    iss: clientEmail,
    scope: "https://www.googleapis.com/auth/analytics.readonly",
    aud: "https://oauth2.googleapis.com/token",
    exp: now + 3600,
    iat: now,
  };

  const base64Url = (str: string) =>
    Buffer.from(str)
      .toString("base64")
      .replace(/=/g, "")
      .replace(/\+/g, "-")
      .replace(/\//g, "_");

  const unsignedToken = `${base64Url(JSON.stringify(header))}.${base64Url(JSON.stringify(claim))}`;

  const signer = crypto.createSign("RSA-SHA256");
  signer.update(unsignedToken);
  const signature = signer
    .sign(privateKey, "base64")
    .replace(/=/g, "")
    .replace(/\+/g, "-")
    .replace(/\//g, "_");

  const jwt = `${unsignedToken}.${signature}`;

  const tokenRes = await fetch("https://oauth2.googleapis.com/token", {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({
      grant_type: "urn:ietf:params:oauth:grant-type:jwt-bearer",
      assertion: jwt,
    }),
  });

  if (!tokenRes.ok) {
    const errText = await tokenRes.text();
    throw new Error(`Google OAuth failed: ${tokenRes.status} ${errText}`);
  }

  const tokenData = await tokenRes.json();
  return tokenData.access_token;
}


// ---------- GA4 (Data API v1beta runReport) ----------

async function runGaReport(propertyId: string, accessToken: string, body: Record<string, unknown>): Promise<GaReport | null> {
  try {
    const res = await fetch(`https://analyticsdata.googleapis.com/v1beta/properties/${propertyId}:runReport`, {
      method: "POST",
      headers: { Authorization: `Bearer ${accessToken}`, "Content-Type": "application/json" },
      body: JSON.stringify(body),
      signal: AbortSignal.timeout(FETCH_TIMEOUT_MS),
    });
    if (!res.ok) {
      console.error("GA4 runReport failed:", res.status, (await res.text()).slice(0, 300));
      return null;
    }
    return (await res.json()) as GaReport;
  } catch (err) {
    console.error("GA4 runReport error:", err);
    return null;
  }
}

async function fetchWebsite(propertyId: string, clientEmail: string, privateKey: string, report: ReportPeriod, chart: ReportPeriod) {
  const accessToken = await getGa4AccessToken(clientEmail, privateKey);
  const range = [{ startDate: report.start, endDate: report.end }];
  const q = (extra: Record<string, unknown>) => runGaReport(propertyId, accessToken, { dateRanges: range, ...extra });

  // Independent requests: one failing only blanks its own section.
  const [totals, channels, devices, pages, daily] = await Promise.all([
    q({ metrics: [{ name: "activeUsers" }, { name: "sessions" }, { name: "screenPageViews" }, { name: "averageSessionDuration" }] }),
    q({ dimensions: [{ name: "sessionDefaultChannelGroup" }], metrics: [{ name: "sessions" }, { name: "activeUsers" }], limit: 20 }),
    q({ dimensions: [{ name: "deviceCategory" }], metrics: [{ name: "activeUsers" }] }),
    q({
      dimensions: [{ name: "pagePath" }, { name: "pageTitle" }],
      metrics: [{ name: "screenPageViews" }, { name: "userEngagementDuration" }],
      orderBys: [{ metric: { metricName: "screenPageViews" }, desc: true }],
      limit: 5,
    }),
    runGaReport(propertyId, accessToken, {
      dateRanges: [{ startDate: chart.start, endDate: chart.end }],
      dimensions: [{ name: "date" }],
      metrics: [{ name: "activeUsers" }, { name: "screenPageViews" }],
      orderBys: [{ dimension: { dimensionName: "date" } }],
    }),
  ]);

  const devicesShaped = shapeGaDevices(devices);
  return {
    totals: shapeGaTotals(totals),
    channels: shapeGaChannels(channels),
    devices: devicesShaped,
    mobilePercentage: mobileShare(devicesShaped),
    topPages: shapeGaTopPages(pages),
    daily: shapeGaDaily(daily, chart),
  };
}

// ---------- Meta Graph API ----------

const GRAPH = "https://graph.facebook.com/v21.0";

/** Fetch one Page insights metric, trying each candidate name until one returns data. */
async function metaMetric(pageId: string, token: string, candidates: string[], period: "day" | "days_28", sinceTs: number, untilTs: number): Promise<MetaValue[] | null> {
  for (const metric of candidates) {
    try {
      const url = `${GRAPH}/${pageId}/insights?metric=${metric}&period=${period}&since=${sinceTs}&until=${untilTs}`;
      const res = await fetch(url, { headers: { Authorization: `Bearer ${token}` }, signal: AbortSignal.timeout(FETCH_TIMEOUT_MS) });
      if (!res.ok) continue;
      const json = await res.json();
      const values = json?.data?.[0]?.values as MetaValue[] | undefined;
      if (values?.length) return values;
    } catch {
      // try the next candidate
    }
  }
  return null;
}

async function fetchSocial(pageId: string, token: string, report: ReportPeriod, chart: ReportPeriod) {
  const ts = (iso: string, endOfDay = false) => Math.floor(new Date(`${iso}T${endOfDay ? "23:59:59" : "00:00:00"}Z`).getTime() / 1000);
  const [rs, re, cs, ce] = [ts(report.start), ts(report.end, true), ts(chart.start), ts(chart.end, true)];

  // Meta renamed its Page metrics (impressions -> views); try the current names first, then legacy.
  const REACH = ["page_total_media_view_unique", "page_impressions_unique"];
  const VIEWS = ["page_media_view", "page_impressions"];
  const ENGAGEMENTS = ["page_post_engagements"];
  const FOLLOWS = ["page_daily_follows", "page_fan_adds"];

  const [reach28, views28, engagements28, follows28, reachDaily, viewsDaily] = await Promise.all([
    metaMetric(pageId, token, REACH, "days_28", re - 86400, re),
    metaMetric(pageId, token, VIEWS, "day", rs, re),
    metaMetric(pageId, token, ENGAGEMENTS, "day", rs, re),
    metaMetric(pageId, token, FOLLOWS, "day", rs, re),
    metaMetric(pageId, token, REACH, "day", cs, ce),
    metaMetric(pageId, token, VIEWS, "day", cs, ce),
  ]);

  const reachSeries = metaDaily(reachDaily);
  const viewsSeries = metaDaily(viewsDaily);
  const daily =
    reachSeries && viewsSeries
      ? reachSeries.map((r) => ({ date: r.date, label: r.label, reach: r.value, views: viewsSeries.find((v) => v.date === r.date)?.value ?? 0 }))
      : null;

  return {
    reach: lastMetaValue(reach28),
    views: sumMetaValues(views28),
    engagements: sumMetaValues(engagements28),
    newFollowers: sumMetaValues(follows28),
    daily,
  };
}

// ---------- handler ----------

export async function GET(req: Request) {
  // Aggregate stats are public (transparency dashboard); config diagnostics are admin-only.
  const isAdmin = (await requireUser(req, "admin")) === null;

  const gaPropertyId = process.env.GA4_PROPERTY_ID;
  const gaClientEmail = process.env.GA4_CLIENT_EMAIL;
  const gaPrivateKey = process.env.GA4_PRIVATE_KEY?.replace(/\\n/g, "\n");
  // The Vercel project defines META_PAGE_ACCESS_TOKEN; older docs used META_ACCESS_TOKEN.
  const metaToken = process.env.META_ACCESS_TOKEN || process.env.META_PAGE_ACCESS_TOKEN;
  const metaPageId = process.env.META_PAGE_ID;

  const missingGa = ["GA4_PROPERTY_ID", "GA4_CLIENT_EMAIL", "GA4_PRIVATE_KEY"].filter((k) => !process.env[k]);
  const missingMeta = [!metaToken && "META_ACCESS_TOKEN (or META_PAGE_ACCESS_TOKEN)", !metaPageId && "META_PAGE_ID"].filter(Boolean) as string[];

  let payload = cache && Date.now() - cache.at < cache.ttl ? (cache.payload as any) : null;

  if (!payload) {
    const { report, chart } = reportPeriods();
    let website: Awaited<ReturnType<typeof fetchWebsite>> | null = null;
    let social: Awaited<ReturnType<typeof fetchSocial>> | null = null;
    let gaError: string | null = missingGa.length ? `Missing environment variables: ${missingGa.join(", ")}` : null;
    let metaError: string | null = missingMeta.length ? `Missing environment variables: ${missingMeta.join(", ")}` : null;

    await Promise.all([
      gaError
        ? null
        : fetchWebsite(gaPropertyId!, gaClientEmail!, gaPrivateKey!, report, chart)
            .then((w) => { website = w; })
            .catch((err) => { console.error("Error fetching GA4 data:", err); gaError = err?.message || String(err); }),
      metaError
        ? null
        : fetchSocial(metaPageId!, metaToken!, report, chart)
            .then((m) => { social = m; })
            .catch((err) => { console.error("Error fetching Meta insights:", err); metaError = err?.message || String(err); }),
    ]);

    const hasWebsite = website !== null && Object.values(website as object).some((v) => v !== null);
    const hasSocial = social !== null && Object.values(social as object).some((v) => v !== null);

    payload = {
      generatedAt: new Date().toISOString(),
      period: report,
      chartPeriod: chart,
      // null sections are shown as "Data temporarily unavailable" — never filled with placeholders.
      website: hasWebsite ? website : null,
      social: hasSocial ? social : null,
      diagnostics: { gaError, metaError, missingGa, missingMeta },
    };
    cache = { at: Date.now(), ttl: hasWebsite || hasSocial ? CACHE_MS : FAILURE_CACHE_MS, payload };
  }

  const { diagnostics, ...publicPayload } = payload;
  return NextResponse.json(isAdmin ? { ...publicPayload, debug: diagnostics } : publicPayload, {
    headers: { "Cache-Control": "no-store, no-cache, must-revalidate" },
  });
}
