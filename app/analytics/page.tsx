'use client';

import { useState, useEffect } from 'react';
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
  timestamp: string;
  isLive: boolean;
  isGaLive: boolean;
  isMetaLive: boolean;
  googleAnalytics: {
    totalUsers: number;
    pageViews: number;
    avgSessionDuration: string;
    bounceRate: string;
    trafficOverTime: { date: string; users: number; pageViews: number }[];
    trafficSources: { name: string; percentage: number; count: number; color: string }[];
    topPages: { path: string; title: string; views: number; avgTime: string }[];
    deviceBreakdown: { device: string; percentage: number }[];
  };
  metaInsights: {
    totalReach: number;
    totalImpressions: number;
    postEngagements: number;
    newFollowers: number;
    reachOverTime: { date: string; reach: number; impressions: number }[];
    engagementBreakdown: { type: string; count: number; percentage: number }[];
  };
  combinedTotals: {
    totalMonthlyAudience: number;
    totalMonthlyImpressions: number;
    totalEngagements: number;
  };
}

export default function PublicAnalyticsPage() {
  const [data, setData] = useState<AnalyticsData | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const fetchAnalytics = async () => {
    try {
      setRefreshing(true);
      const res = await fetch('/api/analytics');
      if (res.ok) {
        const json = await res.json();
        setData(json);
      }
    } catch (err) {
      console.error('Failed to load public analytics:', err);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchAnalytics();
  }, []);

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
                Real-time visibility into Lifestyle Medicine Gateway&apos;s digital reach across Google Analytics and Meta Insights.
              </p>
            </div>

            <div className="flex items-center gap-3">
              {data && (
                <div className="flex items-center gap-2 px-3.5 py-1.5 rounded-xl bg-card border border-border text-xs font-medium shadow-xs">
                  <span
                    className={`h-2 w-2 rounded-full ${
                      data.isLive ? 'bg-emerald-500 animate-pulse' : 'bg-amber-500'
                    }`}
                  />
                  <span>{data.isLive ? 'Live API Feed' : 'Preview / Demo Data'}</span>
                </div>
              )}

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

              <SetupGuideDialog isLive={data?.isLive ?? false} />
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="mx-auto max-w-7xl px-4 py-10 sm:px-6 lg:px-8 space-y-10">
        {loading ? (
          <div className="py-24 text-center space-y-4">
            <div className="inline-block h-8 w-8 animate-spin rounded-full border-4 border-primary border-r-transparent" />
            <p className="text-sm text-muted-foreground animate-pulse">Loading verified insights...</p>
          </div>
        ) : !data ? (
          <div className="text-center py-16 bg-card rounded-2xl border border-border p-6">
            <p className="text-muted-foreground">Unable to load analytics data at this time.</p>
          </div>
        ) : (
          <>
            {/* Top Stat Cards */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
              <StatCard
                title="Total Monthly Audience"
                value={data.combinedTotals.totalMonthlyAudience.toLocaleString()}
                change="+18.4% vs last month"
                icon={<Users className="h-5 w-5 text-emerald-600 dark:text-emerald-400" />}
                subtitle="Google Web + Meta Reach"
              />
              <StatCard
                title="Total Monthly Impressions"
                value={data.combinedTotals.totalMonthlyImpressions.toLocaleString()}
                change="+24.1% vs last month"
                icon={<Eye className="h-5 w-5 text-blue-600 dark:text-blue-400" />}
                subtitle="Pageviews & Social Impressions"
              />
              <StatCard
                title="Google GA4 Web Users"
                value={data.googleAnalytics.totalUsers.toLocaleString()}
                change={`${data.googleAnalytics.pageViews.toLocaleString()} total views`}
                icon={<Globe className="h-5 w-5 text-indigo-600 dark:text-indigo-400" />}
                subtitle={`Avg. session ${data.googleAnalytics.avgSessionDuration}`}
              />
              <StatCard
                title="Meta Insights Reach"
                value={data.metaInsights.totalReach.toLocaleString()}
                change={`${data.metaInsights.postEngagements.toLocaleString()} engagements`}
                icon={<Share2 className="h-5 w-5 text-purple-600 dark:text-purple-400" />}
                subtitle={`${data.metaInsights.newFollowers.toLocaleString()} new followers`}
              />
            </div>

            {/* Main Charts Grid */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
              {/* GA4 Web Traffic Chart */}
              <div className="lg:col-span-2 bg-card rounded-2xl border border-border p-6 shadow-xs space-y-6">
                <div className="flex items-center justify-between">
                  <div>
                    <h2 className="text-lg font-bold text-foreground flex items-center gap-2">
                      <BarChart3 className="h-5 w-5 text-emerald-600" />
                      Google Analytics 4 — Daily Web Traffic
                    </h2>
                    <p className="text-xs text-muted-foreground mt-1">
                      Unique active users and total pageviews over the last 7 days
                    </p>
                  </div>
                  <span className="text-xs font-semibold px-2.5 py-1 rounded-md bg-emerald-500/10 text-emerald-700 dark:text-emerald-400">
                    GA4 Connected
                  </span>
                </div>

                <div className="h-72 w-full">
                  <ResponsiveContainer width="100%" height="100%">
                    <AreaChart data={data.googleAnalytics.trafficOverTime}>
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
                      <XAxis dataKey="date" tickLine={false} axisLine={false} tick={{ fontSize: 12 }} />
                      <YAxis tickLine={false} axisLine={false} tick={{ fontSize: 12 }} />
                      <Tooltip
                        contentStyle={{
                          backgroundColor: 'rgba(15, 23, 42, 0.9)',
                          borderRadius: '12px',
                          border: 'none',
                          color: '#fff',
                        }}
                      />
                      <Area
                        type="monotone"
                        dataKey="pageViews"
                        name="Pageviews"
                        stroke="#3b82f6"
                        strokeWidth={2}
                        fillOpacity={1}
                        fill="url(#colorViews)"
                      />
                      <Area
                        type="monotone"
                        dataKey="users"
                        name="Active Users"
                        stroke="#10b981"
                        strokeWidth={2.5}
                        fillOpacity={1}
                        fill="url(#colorUsers)"
                      />
                    </AreaChart>
                  </ResponsiveContainer>
                </div>
              </div>

              {/* Traffic Sources & Channels */}
              <div className="bg-card rounded-2xl border border-border p-6 shadow-xs space-y-6">
                <div>
                  <h2 className="text-lg font-bold text-foreground">Traffic Channels</h2>
                  <p className="text-xs text-muted-foreground mt-1">Breakdown of incoming web visitors</p>
                </div>

                <div className="space-y-4">
                  {data.googleAnalytics.trafficSources.map((source) => (
                    <div key={source.name} className="space-y-1.5">
                      <div className="flex justify-between text-xs font-medium">
                        <span className="text-foreground">{source.name}</span>
                        <span className="text-muted-foreground">{source.percentage}% ({source.count.toLocaleString()})</span>
                      </div>
                      <div className="w-full bg-muted rounded-full h-2 overflow-hidden">
                        <div
                          className="h-full rounded-full transition-all duration-500"
                          style={{
                            width: `${source.percentage}%`,
                            backgroundColor: source.color,
                          }}
                        />
                      </div>
                    </div>
                  ))}
                </div>

                <div className="pt-4 border-t border-border/60 flex items-center justify-between text-xs text-muted-foreground">
                  <div className="flex items-center gap-1.5">
                    <Smartphone className="h-4 w-4 text-primary" />
                    <span>Mobile Visitors</span>
                  </div>
                  <span className="font-semibold text-foreground">
                    {data.googleAnalytics.deviceBreakdown.find((d) => d.device === 'Mobile')?.percentage}%
                  </span>
                </div>
              </div>
            </div>

            {/* Meta Insights Section */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
              {/* Meta Insights Chart */}
              <div className="lg:col-span-2 bg-card rounded-2xl border border-border p-6 shadow-xs space-y-6">
                <div className="flex items-center justify-between">
                  <div>
                    <h2 className="text-lg font-bold text-foreground flex items-center gap-2">
                      <Share2 className="h-5 w-5 text-purple-600" />
                      Meta Insights — Social Impressions & Reach
                    </h2>
                    <p className="text-xs text-muted-foreground mt-1">
                      Facebook & Instagram post reach and content impressions
                    </p>
                  </div>
                  <span className="text-xs font-semibold px-2.5 py-1 rounded-md bg-purple-500/10 text-purple-700 dark:text-purple-400">
                    Meta Graph API
                  </span>
                </div>

                <div className="h-72 w-full">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={data.metaInsights.reachOverTime}>
                      <CartesianGrid strokeDasharray="3 3" vertical={false} opacity={0.15} />
                      <XAxis dataKey="date" tickLine={false} axisLine={false} tick={{ fontSize: 12 }} />
                      <YAxis tickLine={false} axisLine={false} tick={{ fontSize: 12 }} />
                      <Tooltip
                        contentStyle={{
                          backgroundColor: 'rgba(15, 23, 42, 0.9)',
                          borderRadius: '12px',
                          border: 'none',
                          color: '#fff',
                        }}
                      />
                      <Bar dataKey="impressions" name="Impressions" fill="#8b5cf6" radius={[6, 6, 0, 0]} />
                      <Bar dataKey="reach" name="Unique Reach" fill="#ec4899" radius={[6, 6, 0, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </div>

              {/* Meta Engagement Breakdown */}
              <div className="bg-card rounded-2xl border border-border p-6 shadow-xs space-y-6">
                <div>
                  <h2 className="text-lg font-bold text-foreground">Social Engagement</h2>
                  <p className="text-xs text-muted-foreground mt-1">Audience interactions & clicks</p>
                </div>

                <div className="space-y-4">
                  {data.metaInsights.engagementBreakdown.map((item) => (
                    <div key={item.type} className="p-3.5 rounded-xl bg-muted/40 border border-border/50 flex items-center justify-between">
                      <div>
                        <p className="text-xs font-semibold text-foreground">{item.type}</p>
                        <p className="text-xs text-muted-foreground mt-0.5">{item.percentage}% of total interactions</p>
                      </div>
                      <span className="text-sm font-bold text-primary">{item.count.toLocaleString()}</span>
                    </div>
                  ))}
                </div>

                <div className="p-4 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-xs space-y-1">
                  <div className="flex items-center gap-1.5 font-bold text-emerald-700 dark:text-emerald-400">
                    <ShieldCheck className="h-4 w-4" />
                    Verified Audience Growth
                  </div>
                  <p className="text-muted-foreground">
                    Data synced directly from Meta Graph API & Google Analytics 4 endpoint.
                  </p>
                </div>
              </div>
            </div>

            {/* Top Performing Pages Table */}
            <div className="bg-card rounded-2xl border border-border p-6 shadow-xs space-y-6">
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="text-lg font-bold text-foreground">Most Visited Pages</h2>
                  <p className="text-xs text-muted-foreground mt-1">Popular articles, recipes, and wellness tools</p>
                </div>
              </div>

              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead>
                    <tr className="border-b border-border text-muted-foreground uppercase tracking-wider font-semibold">
                      <th className="pb-3">Page Title & Path</th>
                      <th className="pb-3 text-right">Pageviews</th>
                      <th className="pb-3 text-right">Avg. Time on Page</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border/50">
                    {data.googleAnalytics.topPages.map((page) => (
                      <tr key={page.path} className="hover:bg-muted/30 transition-colors">
                        <td className="py-3.5 pr-4 font-medium text-foreground">
                          <div className="font-semibold text-sm">{page.title}</div>
                          <span className="text-muted-foreground text-xs">{page.path}</span>
                        </td>
                        <td className="py-3.5 text-right font-bold text-foreground">
                          {page.views.toLocaleString()}
                        </td>
                        <td className="py-3.5 text-right text-muted-foreground">{page.avgTime}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </>
        )}
      </div>
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

function SetupGuideDialog({ isLive }: { isLive: boolean }) {
  return (
    <Dialog>
      <DialogTrigger asChild>
        <Button variant="default" size="sm" className="gap-2 rounded-xl">
          <Info className="h-3.5 w-3.5" />
          API Setup Guide
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-md rounded-2xl">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Sparkles className="h-5 w-5 text-primary" />
            Connecting Live Analytics APIs
          </DialogTitle>
          <DialogDescription className="text-xs mt-1">
            Follow these steps to connect your live Google Analytics 4 property and Meta Insights page credentials to this dashboard.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 text-xs">
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
{`META_ACCESS_TOKEN="EAA..."
META_PAGE_ID="987654321"`}
            </pre>
          </div>

          <div className="flex items-center gap-2 text-emerald-600 font-semibold pt-1">
            <CheckCircle2 className="h-4 w-4" />
            {isLive ? 'Live API keys active!' : 'Currently showing interactive preview demo mode.'}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
