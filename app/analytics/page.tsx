'use client';

import { useState, useEffect } from 'react';
import { authHeaders } from "@/lib/auth-headers";
import {
  BarChart3,
  TrendingUp,
  Users,
  Eye,
  Share2,
  Globe,
  Smartphone,
  Info,
  CheckCircle2,
  Sparkles,
  ArrowUpRight,
  RefreshCw,
  ExternalLink,
  ShieldCheck,
} from 'lucide-react';
import {
  ResponsiveContainer,
  AreaChart,
  Area,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
  Cell,
  PieChart,
  Pie,
} from 'recharts';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogTrigger,
} from '@/components/ui/dialog';

interface AnalyticsData {
  generatedAt: string;
  period: { days: number; start: string; end: string };
  chartPeriod: { days: number; start: string; end: string };
  website: {
    totals: { users: number; sessions: number; pageViews: number; avgSessionDuration: string } | null;
    channels: { name: string; sessions: number; users: number; percentage: number }[] | null;
    mobilePercentage: number | null;
    topPages: { path: string; title: string; views: number; avgEngagement: string }[] | null;
    daily: { date: string; label: string; users: number; pageViews: number }[] | null;
  } | null;
  social: {
    reach: number | null;
    views: number | null;
    engagements: number | null;
    newFollowers: number | null;
    daily: { date: string; label: string; reach: number; views: number }[] | null;
  } | null;
  debug?: {
    gaError: string | null;
    metaError: string | null;
    missingGa: string[];
    missingMeta: string[];
  };
}

const CHANNEL_COLORS: Record<string, string> = {
  'Organic Search': '#10b981',
  Direct: '#3b82f6',
  'Organic Social': '#8b5cf6',
  'Paid Social': '#a855f7',
  Referral: '#f59e0b',
  Email: '#ec4899',
  'Paid Search': '#14b8a6',
};
const channelColor = (name: string) => CHANNEL_COLORS[name] ?? '#94a3b8';

const FETCH_TIMEOUT_MS = 15000;

const fmtDate = (iso: string) =>
  new Date(`${iso}T00:00:00Z`).toLocaleDateString('en-AU', { day: 'numeric', month: 'short', year: 'numeric', timeZone: 'UTC' });
const rangeLabel = (p: { start: string; end: string }) => `${fmtDate(p.start)} – ${fmtDate(p.end)}`;

export default function PublicAnalyticsPage() {
  const [data, setData] = useState<AnalyticsData | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [errorStatus, setErrorStatus] = useState<number | null>(null);
  const [failed, setFailed] = useState(false);

  const fetchAnalytics = async () => {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), FETCH_TIMEOUT_MS);
    try {
      setRefreshing(true);
      const res = await fetch(`/api/analytics?t=${Date.now()}`, {
        cache: 'no-store',
        headers: await authHeaders(),
        signal: controller.signal,
      });
      if (res.ok) {
        setData(await res.json());
        setErrorStatus(null);
        setFailed(false);
      } else {
        setErrorStatus(res.status);
        setFailed(true);
      }
    } catch (err) {
      console.error('Failed to load public analytics:', err);
      setFailed(true);
    } finally {
      clearTimeout(timer);
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchAnalytics();
  }, []);

  const web = data?.website ?? null;
  const social = data?.social ?? null;
  const hasAnything = Boolean(web || social);

  return (
    <div className="bg-background min-h-screen">
      {/* Header Banner */}
      <div className="bg-wellness-muted border-b border-border/50 py-12 sm:py-16">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-6">
            <div>
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-primary/10 text-primary text-xs font-semibold mb-3">
                <Globe className="h-3.5 w-3.5" />
                Public Transparency & Impact Dashboard
              </div>
              <h1 className="text-3xl font-bold tracking-tight text-foreground sm:text-4xl lg:text-5xl">
                Analytics & Reach Overview
              </h1>
              <p className="mt-2 text-base text-muted-foreground max-w-2xl">
                Lifestyle Medicine Gateway&apos;s website traffic (Google Analytics 4) and social reach (Meta Insights),
                reported separately. Website visitors and social reach are different measures and are not added together.
              </p>
              {data && (
                <p className="mt-3 text-xs text-muted-foreground">
                  Reporting period: <span className="font-semibold text-foreground">{rangeLabel(data.period)}</span> (last{' '}
                  {data.period.days} days). Daily charts cover the last {data.chartPeriod.days} days of that period. Last
                  updated{' '}
                  <span className="font-semibold text-foreground">
                    {new Date(data.generatedAt).toLocaleString('en-AU', { dateStyle: 'medium', timeStyle: 'short' })}
                  </span>
                  . Figures are cached for up to 10 minutes.
                </p>
              )}
            </div>

            <div className="flex items-center gap-3">
              <Button
                variant="outline"
                size="sm"
                onClick={fetchAnalytics}
                disabled={refreshing}
                className="gap-2 rounded-xl"
              >
                <RefreshCw className={`h-3.5 w-3.5 ${refreshing ? 'animate-spin' : ''}`} />
                Refresh
              </Button>

              {data?.debug && <SetupGuideDialog debug={data.debug} />}
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="mx-auto max-w-7xl px-4 py-10 sm:px-6 lg:px-8 space-y-10">
        {/* Admin-only diagnostics */}
        {data?.debug && (data.debug.gaError || data.debug.metaError) && (
          <div className="p-4 rounded-2xl bg-amber-500/10 border border-amber-500/30 text-amber-900 dark:text-amber-200 text-xs space-y-2">
            <div className="flex items-center gap-2 font-semibold text-sm">
              <Info className="h-4 w-4 text-amber-500" />
              Admin diagnostics (not shown to the public)
            </div>
            {data.debug.gaError && (
              <p className="font-mono bg-background/80 p-2 rounded border border-amber-500/20 text-[11px] overflow-x-auto">
                <strong>Google Analytics:</strong> {data.debug.gaError}
              </p>
            )}
            {data.debug.metaError && (
              <p className="font-mono bg-background/80 p-2 rounded border border-amber-500/20 text-[11px] overflow-x-auto">
                <strong>Meta:</strong> {data.debug.metaError}
              </p>
            )}
          </div>
        )}

        {loading ? (
          <div className="py-24 text-center space-y-4">
            <div className="inline-block h-8 w-8 animate-spin rounded-full border-4 border-primary border-r-transparent" />
            <p className="text-sm text-muted-foreground animate-pulse">Loading analytics…</p>
          </div>
        ) : failed || !data ? (
          <div className="text-center py-16 bg-card rounded-2xl border border-border p-6">
            <p className="text-muted-foreground">
              {errorStatus === 401 || errorStatus === 403
                ? 'Analytics could not be loaded for this session.'
                : 'Data temporarily unavailable. Please try again in a few minutes.'}
            </p>
            <Button onClick={fetchAnalytics} disabled={refreshing} className="mt-4 rounded-xl">
              Try again
            </Button>
          </div>
        ) : (
          <>
            {!hasAnything && (
              <div className="text-center py-10 bg-card rounded-2xl border border-border p-6">
                <p className="text-muted-foreground">Data temporarily unavailable. Please check back soon.</p>
              </div>
            )}

            {/* Website headline figures */}
            <section className="space-y-4">
              <SectionHeading
                title="Website (Google Analytics 4)"
                period={`Last ${data.period.days} days · ${rangeLabel(data.period)}`}
              />
              {web?.totals ? (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
                  <StatCard
                    title="Website users"
                    value={web.totals.users.toLocaleString()}
                    change={`${web.totals.sessions.toLocaleString()} sessions`}
                    icon={<Users className="h-5 w-5 text-emerald-600 dark:text-emerald-400" />}
                    subtitle="Active users on lifestylemedicinegateway.com"
                  />
                  <StatCard
                    title="Page views"
                    value={web.totals.pageViews.toLocaleString()}
                    change="Total pages viewed"
                    icon={<Eye className="h-5 w-5 text-blue-600 dark:text-blue-400" />}
                    subtitle="All pages, same period"
                  />
                  <StatCard
                    title="Avg. session duration"
                    value={web.totals.avgSessionDuration}
                    change="Per session"
                    icon={<Globe className="h-5 w-5 text-indigo-600 dark:text-indigo-400" />}
                    subtitle="Google Analytics 4"
                  />
                  <StatCard
                    title="Mobile visitors"
                    value={web.mobilePercentage !== null ? `${web.mobilePercentage}%` : '—'}
                    change="Share of users on mobile"
                    icon={<Smartphone className="h-5 w-5 text-purple-600 dark:text-purple-400" />}
                    subtitle="By device category"
                  />
                </div>
              ) : (
                <Unavailable />
              )}
            </section>

            {/* Website charts */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
              <div className="lg:col-span-2 bg-card rounded-2xl border border-border p-6 shadow-xs space-y-6">
                <div>
                  <h2 className="text-lg font-bold text-foreground flex items-center gap-2">
                    <BarChart3 className="h-5 w-5 text-emerald-600" />
                    Daily web traffic
                  </h2>
                  <p className="text-xs text-muted-foreground mt-1">
                    Active users and page views · last {data.chartPeriod.days} days · {rangeLabel(data.chartPeriod)}
                  </p>
                </div>

                {web?.daily ? (
                  <div className="h-72 w-full">
                    <ResponsiveContainer width="100%" height="100%">
                      <AreaChart data={web.daily}>
                        <defs>
                          <linearGradient id="colorUsers" x1="0" y1="0" x2="0" y2="1">
                            <stop offset="5%" stopColor="#10b981" stopOpacity={0.4} />
                            <stop offset="95%" stopColor="#10b981" stopOpacity={0} />
                          </linearGradient>
                          <linearGradient id="colorViews" x1="0" y1="0" x2="0" y2="1">
                            <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.3} />
                            <stop offset="95%" stopColor="#3b82f6" stopOpacity={0} />
                          </linearGradient>
                        </defs>
                        <CartesianGrid strokeDasharray="3 3" vertical={false} opacity={0.15} />
                        <XAxis dataKey="label" tickLine={false} axisLine={false} tick={{ fontSize: 12 }} />
                        <YAxis tickLine={false} axisLine={false} tick={{ fontSize: 12 }} allowDecimals={false} domain={[0, 'auto']} />
                        <Tooltip contentStyle={TOOLTIP_STYLE} />
                        <Area type="monotone" dataKey="pageViews" name="Page views" stroke="#3b82f6" strokeWidth={2} fillOpacity={1} fill="url(#colorViews)" />
                        <Area type="monotone" dataKey="users" name="Active users" stroke="#10b981" strokeWidth={2.5} fillOpacity={1} fill="url(#colorUsers)" />
                      </AreaChart>
                    </ResponsiveContainer>
                  </div>
                ) : (
                  <Unavailable />
                )}
              </div>

              <div className="bg-card rounded-2xl border border-border p-6 shadow-xs space-y-6">
                <div>
                  <h2 className="text-lg font-bold text-foreground">Traffic channels</h2>
                  <p className="text-xs text-muted-foreground mt-1">
                    Share of website sessions · last {data.period.days} days
                  </p>
                </div>

                {web?.channels ? (
                  <div className="space-y-4">
                    {web.channels.map((source) => (
                      <div key={source.name} className="space-y-1.5">
                        <div className="flex justify-between text-xs font-medium">
                          <span className="text-foreground">{source.name}</span>
                          <span className="text-muted-foreground">
                            {source.percentage}% ({source.sessions.toLocaleString()} sessions)
                          </span>
                        </div>
                        <div className="w-full bg-muted rounded-full h-2 overflow-hidden">
                          <div
                            className="h-full rounded-full transition-all duration-500"
                            style={{ width: `${source.percentage}%`, backgroundColor: channelColor(source.name) }}
                          />
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <Unavailable />
                )}
              </div>
            </div>

            {/* Social */}
            <section className="space-y-4">
              <SectionHeading
                title="Social (Meta: Facebook Page)"
                period={`Last ${data.period.days} days · ${rangeLabel(data.period)}`}
              />
              {social && (social.reach !== null || social.views !== null || social.engagements !== null || social.newFollowers !== null) ? (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
                  {social.reach !== null && (
                    <StatCard title="Social reach" value={social.reach.toLocaleString()} change="Unique accounts reached" icon={<Share2 className="h-5 w-5 text-purple-600 dark:text-purple-400" />} subtitle="Meta Graph API" />
                  )}
                  {social.views !== null && (
                    <StatCard title="Social views" value={social.views.toLocaleString()} change="Content views (not unique)" icon={<Eye className="h-5 w-5 text-blue-600 dark:text-blue-400" />} subtitle="Meta Graph API" />
                  )}
                  {social.engagements !== null && (
                    <StatCard title="Post engagements" value={social.engagements.toLocaleString()} change="Reactions, comments, shares and clicks" icon={<TrendingUp className="h-5 w-5 text-emerald-600 dark:text-emerald-400" />} subtitle="Meta Graph API" />
                  )}
                  {social.newFollowers !== null && (
                    <StatCard title="New followers" value={social.newFollowers.toLocaleString()} change="Gained in the period" icon={<Users className="h-5 w-5 text-indigo-600 dark:text-indigo-400" />} subtitle="Meta Graph API" />
                  )}
                </div>
              ) : (
                <Unavailable />
              )}

              {social?.daily && (
                <div className="bg-card rounded-2xl border border-border p-6 shadow-xs space-y-6">
                  <div>
                    <h2 className="text-lg font-bold text-foreground flex items-center gap-2">
                      <Share2 className="h-5 w-5 text-purple-600" />
                      Daily social views & reach
                    </h2>
                    <p className="text-xs text-muted-foreground mt-1">
                      Last {data.chartPeriod.days} days · {rangeLabel(data.chartPeriod)}
                    </p>
                  </div>
                  <div className="h-72 w-full">
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart data={social.daily}>
                        <CartesianGrid strokeDasharray="3 3" vertical={false} opacity={0.15} />
                        <XAxis dataKey="label" tickLine={false} axisLine={false} tick={{ fontSize: 12 }} />
                        <YAxis tickLine={false} axisLine={false} tick={{ fontSize: 12 }} allowDecimals={false} domain={[0, 'auto']} />
                        <Tooltip contentStyle={TOOLTIP_STYLE} />
                        <Bar dataKey="views" name="Views" fill="#8b5cf6" radius={[6, 6, 0, 0]} />
                        <Bar dataKey="reach" name="Unique reach" fill="#ec4899" radius={[6, 6, 0, 0]} />
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                </div>
              )}
            </section>

            {/* Top pages */}
            <div className="bg-card rounded-2xl border border-border p-6 shadow-xs space-y-6">
              <div>
                <h2 className="text-lg font-bold text-foreground">Most visited pages</h2>
                <p className="text-xs text-muted-foreground mt-1">
                  Top 5 pages by views · last {data.period.days} days · {rangeLabel(data.period)}
                </p>
              </div>

              {web?.topPages ? (
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs">
                    <thead>
                      <tr className="border-b border-border text-muted-foreground uppercase tracking-wider font-semibold">
                        <th className="pb-3">Page title & path</th>
                        <th className="pb-3 text-right">Page views</th>
                        <th className="pb-3 text-right">Avg. engagement per view</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-border/50">
                      {web.topPages.map((page) => (
                        <tr key={page.path} className="hover:bg-muted/30 transition-colors">
                          <td className="py-3.5 pr-4 font-medium text-foreground">
                            <div className="font-semibold text-sm">{page.title}</div>
                            <span className="text-muted-foreground text-xs">{page.path}</span>
                          </td>
                          <td className="py-3.5 text-right font-bold text-foreground">{page.views.toLocaleString()}</td>
                          <td className="py-3.5 text-right text-muted-foreground">{page.avgEngagement}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              ) : (
                <Unavailable />
              )}
            </div>

            <p className="text-center text-xs text-muted-foreground">
              Sources: Google Analytics 4 Data API and Meta Graph API, fetched at{' '}
              {new Date(data.generatedAt).toLocaleString('en-AU', { dateStyle: 'medium', timeStyle: 'short' })}.
              Sections that could not be retrieved are marked unavailable rather than estimated.
            </p>
          </>
        )}
      </div>
    </div>
  );
}

const TOOLTIP_STYLE = {
  backgroundColor: 'rgba(15, 23, 42, 0.9)',
  borderRadius: '12px',
  border: 'none',
  color: '#fff',
};

function SectionHeading({ title, period }: { title: string; period: string }) {
  return (
    <div>
      <h2 className="text-xl font-bold text-foreground">{title}</h2>
      <p className="text-xs text-muted-foreground mt-1">{period}</p>
    </div>
  );
}

function Unavailable() {
  return (
    <div className="rounded-xl border border-dashed border-border bg-muted/30 p-6 text-center text-sm text-muted-foreground">
      Data temporarily unavailable
    </div>
  );
}

function StatCard({
  title,
  value,
  change,
  icon,
  subtitle,
}: {
  title: string;
  value: string;
  change: string;
  icon: React.ReactNode;
  subtitle: string;
}) {
  return (
    <div className="bg-card rounded-2xl border border-border p-5 shadow-xs space-y-3">
      <div className="flex items-center justify-between">
        <span className="text-xs font-semibold text-muted-foreground">{title}</span>
        <div className="p-2 rounded-xl bg-muted/60">{icon}</div>
      </div>
      <div>
        <div className="text-2xl font-bold tracking-tight text-foreground">{value}</div>
        <p className="text-xs font-medium text-emerald-600 dark:text-emerald-400 mt-1 flex items-center gap-1">
          <TrendingUp className="h-3 w-3" />
          {change}
        </p>
      </div>
      <p className="text-[11px] text-muted-foreground border-t border-border/40 pt-2">{subtitle}</p>
    </div>
  );
}

function SetupGuideDialog({ debug, buttonText = 'API Setup Guide' }: { debug?: AnalyticsData['debug']; buttonText?: string }) {
  return (
    <Dialog>
      <DialogTrigger asChild>
        <Button variant="default" size="sm" className="gap-2 rounded-xl">
          <Info className="h-3.5 w-3.5" />
          {buttonText}
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-md rounded-2xl">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Sparkles className="h-5 w-5 text-primary" />
            Connecting Live Analytics APIs
          </DialogTitle>
          <DialogDescription className="text-xs mt-1">
            Follow these steps to connect your live Google Analytics 4 property and Meta Insights page credentials to this dashboard. Sections whose credentials are missing or failing show as unavailable.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 text-xs">
          {debug && (
            <div className="p-3 rounded-xl bg-amber-500/10 border border-amber-500/30 space-y-2 text-foreground">
              <div className="font-bold flex items-center gap-1.5 text-amber-700 dark:text-amber-300">
                <ShieldCheck className="h-4 w-4" />
                Connection status (admin only)
              </div>
              <div className="space-y-1 font-mono text-[11px]">
                <div className="flex justify-between">
                  <span>Google Analytics 4:</span>
                  <span className={debug.gaError ? 'text-rose-500 font-bold' : 'text-emerald-600 font-bold'}>
                    {debug.gaError ? 'PROBLEM' : 'OK'}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span>Meta Graph API:</span>
                  <span className={debug.metaError ? 'text-rose-500 font-bold' : 'text-emerald-600 font-bold'}>
                    {debug.metaError ? 'PROBLEM' : 'OK'}
                  </span>
                </div>
              </div>
              {debug.gaError && (
                <div className="mt-2 p-2 rounded bg-background border border-amber-500/30 text-[11px] text-rose-600 dark:text-rose-400 overflow-x-auto font-mono">
                  <strong>GA:</strong> {debug.gaError}
                </div>
              )}
              {debug.metaError && (
                <div className="mt-2 p-2 rounded bg-background border border-amber-500/30 text-[11px] text-rose-600 dark:text-rose-400 overflow-x-auto font-mono">
                  <strong>Meta:</strong> {debug.metaError}
                </div>
              )}
            </div>
          )}

          <div className="p-3 rounded-xl bg-muted border border-border space-y-2">
            <div className="font-bold text-foreground flex items-center gap-1.5">
              <Globe className="h-4 w-4 text-indigo-500" />
              1. Google Analytics 4 Setup
            </div>
            <p className="text-muted-foreground">
              Add the following environment variables to your <code className="text-primary font-mono">.env.local</code> file:
            </p>
            <pre className="p-2 rounded bg-background text-[11px] font-mono overflow-x-auto text-foreground">
{`GA4_PROPERTY_ID="123456789"
GA4_CLIENT_EMAIL="service-account@project.iam.gserviceaccount.com"
GA4_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----\\n..."`}
            </pre>
          </div>

          <div className="p-3 rounded-xl bg-muted border border-border space-y-2">
            <div className="font-bold text-foreground flex items-center gap-1.5">
              <Share2 className="h-4 w-4 text-purple-500" />
              2. Meta Graph API Setup
            </div>
            <p className="text-muted-foreground">
              Add your Page Access Token and Page ID from Meta Business Suite:
            </p>
            <pre className="p-2 rounded bg-background text-[11px] font-mono overflow-x-auto text-foreground">
{`META_ACCESS_TOKEN="EAA..."   # META_PAGE_ACCESS_TOKEN also works
META_PAGE_ID="987654321"`}
            </pre>
          </div>

        </div>
      </DialogContent>
    </Dialog>
  );
}
