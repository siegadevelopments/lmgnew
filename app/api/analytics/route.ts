import { NextResponse } from "next/server";
import * as crypto from "crypto";

export const dynamic = "force-dynamic";

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

// Fetch GA4 Realtime active users (last 30 minutes)
async function fetchGa4RealtimeData(propertyId: string, accessToken: string): Promise<number> {
  const endpoint = `https://analyticsdata.googleapis.com/v1beta/properties/${propertyId}:runRealtimeReport`;

  try {
    const res = await fetch(endpoint, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${accessToken}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        metrics: [{ name: "activeUsers" }],
      }),
    });

    if (!res.ok) return 0;
    const json = await res.json();
    return parseInt(json.rows?.[0]?.metricValues?.[0]?.value || "0", 10);
  } catch (err) {
    return 0;
  }
}

// Fetch GA4 report data from Google Analytics Data API v1beta
async function fetchGa4Data(propertyId: string, accessToken: string) {
  const endpoint = `https://analyticsdata.googleapis.com/v1beta/properties/${propertyId}:runReport`;

  const reqBody = {
    dateRanges: [{ startDate: "30daysAgo", endDate: "today" }],
    metrics: [
      { name: "activeUsers" },
      { name: "screenPageViews" },
      { name: "averageSessionDuration" },
      { name: "bounceRate" },
    ],
  };

  const [res, activeNow] = await Promise.all([
    fetch(endpoint, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${accessToken}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify(reqBody),
    }),
    fetchGa4RealtimeData(propertyId, accessToken),
  ]);

  if (!res.ok) {
    const err = await res.text();
    throw new Error(`GA4 runReport failed: ${res.status} ${err}`);
  }

  const json = await res.json();
  const values = json.rows?.[0]?.metricValues || [];

  const totalUsers = parseInt(values[0]?.value || "0", 10);
  const pageViews = parseInt(values[1]?.value || "0", 10);
  const avgDurationSec = parseFloat(values[2]?.value || "0");
  const bounceRatePct = (parseFloat(values[3]?.value || "0") * 100).toFixed(1);

  const mins = Math.floor(avgDurationSec / 60);
  const secs = Math.round(avgDurationSec % 60);
  const avgSessionDuration = `${mins}m ${secs < 10 ? "0" : ""}${secs}s`;

  return {
    totalUsers,
    pageViews,
    avgSessionDuration,
    bounceRate: `${bounceRatePct}%`,
    activeNow,
  };
}

// Realistic Demo/Fallback Data when APIs are pending setup
const demoGaData = {
  totalUsers: 48920,
  pageViews: 124850,
  avgSessionDuration: "2m 45s",
  bounceRate: "34.2%",
  trafficOverTime: [
    { date: "Mon", users: 5400, pageViews: 14200 },
    { date: "Tue", users: 6200, pageViews: 16800 },
    { date: "Wed", users: 7100, pageViews: 19500 },
    { date: "Thu", users: 6800, pageViews: 18100 },
    { date: "Fri", users: 7900, pageViews: 21300 },
    { date: "Sat", users: 8400, pageViews: 22400 },
    { date: "Sun", users: 7120, pageViews: 12550 }
  ],
  trafficSources: [
    { name: "Organic Search", percentage: 48, count: 23480, color: "#10b981" },
    { name: "Direct", percentage: 26, count: 12720, color: "#3b82f6" },
    { name: "Social Media", percentage: 18, count: 8800, color: "#8b5cf6" },
    { name: "Referrals", percentage: 8, count: 3920, color: "#f59e0b" }
  ],
  topPages: [
    { path: "/recipes", title: "Healthy Recipes & Meal Ideas", views: 34200, avgTime: "3m 12s" },
    { path: "/healthy-aging-starter-kit", title: "Healthy Aging Starter Kit", views: 28900, avgTime: "4m 05s" },
    { path: "/articles", title: "Evidence-Based Wellness Articles", views: 22100, avgTime: "2m 50s" },
    { path: "/natural-remedies", title: "Natural Remedies & Herbs", views: 18500, avgTime: "3m 40s" },
    { path: "/products", title: "Wellness Marketplace", views: 14200, avgTime: "2m 10s" }
  ],
  deviceBreakdown: [
    { device: "Mobile", percentage: 65 },
    { device: "Desktop", percentage: 30 },
    { device: "Tablet", percentage: 5 }
  ]
};

const demoMetaData = {
  totalReach: 84500,
  totalImpressions: 162300,
  postEngagements: 19400,
  newFollowers: 1280,
  reachOverTime: [
    { date: "Mon", reach: 11200, impressions: 21000 },
    { date: "Tue", reach: 12800, impressions: 24500 },
    { date: "Wed", reach: 14500, impressions: 28100 },
    { date: "Thu", reach: 13100, impressions: 25400 },
    { date: "Fri", reach: 15900, impressions: 30200 },
    { date: "Sat", reach: 17200, impressions: 33100 },
    { date: "Sun", reach: 14800, impressions: 27800 }
  ],
  engagementBreakdown: [
    { type: "Post Likes & Reactions", count: 9850, percentage: 51 },
    { type: "Comments & Shares", count: 5420, percentage: 28 },
    { type: "Link Clicks", count: 4130, percentage: 21 }
  ]
};

export async function GET() {
  const gaPropertyId = process.env.GA4_PROPERTY_ID;
  const gaClientEmail = process.env.GA4_CLIENT_EMAIL;
  const gaPrivateKey = process.env.GA4_PRIVATE_KEY?.replace(/\\n/g, "\n");

  const metaAccessToken = process.env.META_ACCESS_TOKEN;
  const metaPageId = process.env.META_PAGE_ID;

  let gaData = null;
  let metaData = null;
  let isGaLive = false;
  let isMetaLive = false;

  let gaError: string | null = null;
  let metaError: string | null = null;

  // 1. Fetch Google Analytics 4 Data if credentials are provided
  if (gaPropertyId && gaClientEmail && gaPrivateKey) {
    try {
      const accessToken = await getGa4AccessToken(gaClientEmail, gaPrivateKey);
      const liveGaMetrics = await fetchGa4Data(gaPropertyId, accessToken);

      gaData = {
        ...demoGaData,
        ...liveGaMetrics,
      };
      isGaLive = true;
    } catch (err: any) {
      console.error("Error fetching GA4 data:", err);
      gaError = err?.message || String(err);
    }
  } else {
    const missing = [];
    if (!gaPropertyId) missing.push("GA4_PROPERTY_ID");
    if (!gaClientEmail) missing.push("GA4_CLIENT_EMAIL");
    if (!gaPrivateKey) missing.push("GA4_PRIVATE_KEY");
    gaError = `Missing environment variables: ${missing.join(", ")}`;
  }

  // 2. Fetch Meta Insights Data if credentials are provided
  if (metaAccessToken && metaPageId) {
    try {
      const metaMetrics = [
        "page_impressions_unique",
        "page_post_engagements",
        "page_views_total",
        "page_fan_adds"
      ].join(",");

      const url = `https://graph.facebook.com/v19.0/${metaPageId}/insights?metric=${metaMetrics}&period=day&access_token=${metaAccessToken}`;
      const res = await fetch(url, { next: { revalidate: 300 } } as RequestInit);

      if (res.ok) {
        const json = await res.json();
        metaData = json.data;
        isMetaLive = true;
      } else {
        metaError = `Meta API returned status ${res.status}`;
      }
    } catch (err: any) {
      console.error("Error fetching Meta insights:", err);
      metaError = err?.message || String(err);
    }
  } else {
    const missing = [];
    if (!metaAccessToken) missing.push("META_ACCESS_TOKEN");
    if (!metaPageId) missing.push("META_PAGE_ID");
    metaError = `Missing environment variables: ${missing.join(", ")}`;
  }

  const responsePayload = {
    timestamp: new Date().toISOString(),
    isLive: isGaLive || isMetaLive,
    isGaLive,
    isMetaLive,
    googleAnalytics: gaData || demoGaData,
    metaInsights: metaData || demoMetaData,
    combinedTotals: {
      totalMonthlyAudience: (gaData?.totalUsers || demoGaData.totalUsers) + (metaData?.totalReach || demoMetaData.totalReach),
      totalMonthlyImpressions: (gaData?.pageViews || demoGaData.pageViews) + (metaData?.totalImpressions || demoMetaData.totalImpressions),
      totalEngagements: demoMetaData.postEngagements + Math.round(demoGaData.pageViews * 0.15)
    },
    debug: {
      hasGaPropertyId: Boolean(gaPropertyId),
      hasGaClientEmail: Boolean(gaClientEmail),
      hasGaPrivateKey: Boolean(gaPrivateKey),
      gaError,
      hasMetaAccessToken: Boolean(metaAccessToken),
      hasMetaPageId: Boolean(metaPageId),
      metaError,
    }
  };

  return NextResponse.json(responsePayload, {
    headers: {
      "Cache-Control": "no-store, no-cache, must-revalidate",
    },
  });
}
