/**
 * Shapes raw GA4 Data API / Meta Graph API responses for the public /analytics page.
 * Pure functions (no I/O) so the arithmetic that the page displays can be unit tested.
 *
 * Rule for this module: a section is either built from real API rows or it is `null`.
 * There are no fallback or placeholder numbers anywhere.
 */

export const REPORT_DAYS = 28;
export const CHART_DAYS = 7;
export const REPORT_TIME_ZONE = "Australia/Sydney";

export interface ReportPeriod {
  days: number;
  start: string; // YYYY-MM-DD, inclusive
  end: string; // YYYY-MM-DD, inclusive
}

export interface GaTotals {
  users: number;
  sessions: number;
  pageViews: number;
  avgSessionDuration: string;
}
export interface GaChannel { name: string; sessions: number; users: number; percentage: number }
export interface GaDevice { device: string; users: number; percentage: number }
export interface GaTopPage { path: string; title: string; views: number; avgEngagement: string }
export interface GaDailyPoint { date: string; label: string; users: number; pageViews: number }

/** A GA4 runReport response (only the parts we read). */
export interface GaReport {
  rows?: { dimensionValues?: { value?: string }[]; metricValues?: { value?: string }[] }[];
}

// ---------- dates ----------

function isoDateInZone(d: Date): string {
  // en-CA formats as YYYY-MM-DD
  return new Intl.DateTimeFormat("en-CA", { timeZone: REPORT_TIME_ZONE, year: "numeric", month: "2-digit", day: "2-digit" }).format(d);
}

function addDays(iso: string, delta: number): string {
  const [y, m, d] = iso.split("-").map(Number);
  const dt = new Date(Date.UTC(y, m - 1, d + delta));
  return dt.toISOString().slice(0, 10);
}

/**
 * Both periods end yesterday (Sydney time) so a partial "today" never skews the numbers.
 * The 28-day window and the 7-day chart window therefore end on the same day.
 */
export function reportPeriods(now: Date = new Date()): { report: ReportPeriod; chart: ReportPeriod } {
  const end = addDays(isoDateInZone(now), -1);
  return {
    report: { days: REPORT_DAYS, start: addDays(end, -(REPORT_DAYS - 1)), end },
    chart: { days: CHART_DAYS, start: addDays(end, -(CHART_DAYS - 1)), end },
  };
}

export function eachDay(start: string, end: string): string[] {
  const out: string[] = [];
  for (let d = start; d <= end; d = addDays(d, 1)) out.push(d);
  return out;
}

function shortLabel(iso: string): string {
  const [y, m, d] = iso.split("-").map(Number);
  return new Intl.DateTimeFormat("en-AU", { day: "numeric", month: "short", timeZone: "UTC" }).format(new Date(Date.UTC(y, m - 1, d)));
}

// ---------- formatting ----------

export function formatDuration(totalSeconds: number): string {
  const s = Math.max(0, Math.round(totalSeconds));
  const m = Math.floor(s / 60);
  const r = s % 60;
  return `${m}m ${r < 10 ? "0" : ""}${r}s`;
}

const num = (v: string | undefined): number => {
  const n = Number(v);
  return Number.isFinite(n) ? n : 0;
};

// ---------- GA4 ----------

export function shapeGaTotals(report: GaReport | null | undefined): GaTotals | null {
  const row = report?.rows?.[0];
  if (!row) return null;
  const m = row.metricValues ?? [];
  // metrics requested in order: activeUsers, sessions, screenPageViews, averageSessionDuration
  return {
    users: Math.round(num(m[0]?.value)),
    sessions: Math.round(num(m[1]?.value)),
    pageViews: Math.round(num(m[2]?.value)),
    avgSessionDuration: formatDuration(num(m[3]?.value)),
  };
}

/** Channel share is measured in sessions, so the percentages add up to 100. */
export function shapeGaChannels(report: GaReport | null | undefined): GaChannel[] | null {
  const rows = report?.rows ?? [];
  // metrics requested in order: sessions, activeUsers
  const parsed = rows
    .map((r) => ({ name: r.dimensionValues?.[0]?.value || "Unassigned", sessions: Math.round(num(r.metricValues?.[0]?.value)), users: Math.round(num(r.metricValues?.[1]?.value)) }))
    .filter((c) => c.sessions > 0)
    .sort((a, b) => b.sessions - a.sessions);
  const total = parsed.reduce((s, c) => s + c.sessions, 0);
  if (total === 0) return null;
  return parsed.map((c) => ({ ...c, percentage: Math.round((c.sessions / total) * 1000) / 10 }));
}

export function shapeGaDevices(report: GaReport | null | undefined): GaDevice[] | null {
  const rows = report?.rows ?? [];
  const parsed = rows
    .map((r) => ({ device: (r.dimensionValues?.[0]?.value || "other").toLowerCase(), users: Math.round(num(r.metricValues?.[0]?.value)) }))
    .filter((d) => d.users > 0);
  const total = parsed.reduce((s, d) => s + d.users, 0);
  if (total === 0) return null;
  return parsed
    .sort((a, b) => b.users - a.users)
    .map((d) => ({ ...d, percentage: Math.round((d.users / total) * 1000) / 10 }));
}

export function mobileShare(devices: GaDevice[] | null): number | null {
  if (!devices) return null;
  return devices.find((d) => d.device === "mobile")?.percentage ?? 0;
}

export function shapeGaTopPages(report: GaReport | null | undefined, limit = 5): GaTopPage[] | null {
  const rows = report?.rows ?? [];
  // dimensions: pagePath, pageTitle; metrics: screenPageViews, userEngagementDuration (seconds, summed)
  const parsed = rows
    .map((r) => {
      const views = Math.round(num(r.metricValues?.[0]?.value));
      const engagement = num(r.metricValues?.[1]?.value);
      return {
        path: r.dimensionValues?.[0]?.value || "",
        title: r.dimensionValues?.[1]?.value || "",
        views,
        avgEngagement: formatDuration(views > 0 ? engagement / views : 0),
      };
    })
    .filter((p) => p.path && p.views > 0)
    .sort((a, b) => b.views - a.views)
    .slice(0, limit)
    .map((p) => ({ ...p, title: p.title && p.title !== "(not set)" ? p.title : p.path }));
  return parsed.length ? parsed : null;
}

/** One point per day in the window. GA omits days with no traffic, so those are real zeros. */
export function shapeGaDaily(report: GaReport | null | undefined, period: ReportPeriod): GaDailyPoint[] | null {
  if (!report?.rows?.length) return null;
  const byDay = new Map<string, { users: number; pageViews: number }>();
  for (const r of report.rows) {
    const raw = r.dimensionValues?.[0]?.value ?? "";
    if (!/^\d{8}$/.test(raw)) continue;
    const iso = `${raw.slice(0, 4)}-${raw.slice(4, 6)}-${raw.slice(6, 8)}`;
    byDay.set(iso, { users: Math.round(num(r.metricValues?.[0]?.value)), pageViews: Math.round(num(r.metricValues?.[1]?.value)) });
  }
  if (byDay.size === 0) return null;
  return eachDay(period.start, period.end).map((iso) => ({
    date: iso,
    label: shortLabel(iso),
    users: byDay.get(iso)?.users ?? 0,
    pageViews: byDay.get(iso)?.pageViews ?? 0,
  }));
}

// ---------- Meta ----------

export interface MetaValue { value: number | Record<string, number>; end_time?: string }

/** Sum of a daily metric over the returned values. Non-numeric values are ignored. */
export function sumMetaValues(values: MetaValue[] | null | undefined): number | null {
  if (!values?.length) return null;
  let total = 0;
  let any = false;
  for (const v of values) {
    if (typeof v.value === "number" && Number.isFinite(v.value)) {
      total += v.value;
      any = true;
    }
  }
  return any ? total : null;
}

/** The latest numeric value (used for rolling 28-day unique metrics such as reach). */
export function lastMetaValue(values: MetaValue[] | null | undefined): number | null {
  if (!values?.length) return null;
  for (let i = values.length - 1; i >= 0; i--) {
    const v = values[i].value;
    if (typeof v === "number" && Number.isFinite(v)) return v;
  }
  return null;
}

export function metaDaily(values: MetaValue[] | null | undefined): { date: string; label: string; value: number }[] | null {
  if (!values?.length) return null;
  const out = values
    .filter((v) => typeof v.value === "number" && v.end_time)
    .map((v) => {
      // end_time is when the reporting day ended (midnight Pacific, i.e. early on the next UTC
      // date), so the metric's own day is the UTC date minus one.
      const iso = addDays((v.end_time as string).slice(0, 10), -1);
      return { date: iso, label: shortLabel(iso), value: v.value as number };
    });
  return out.length ? out : null;
}
