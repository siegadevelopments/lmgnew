import { useState, useEffect, useMemo } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import {
  Sparkles,
  Calendar,
  Send,
  CheckCircle2,
  AlertCircle,
  Clock,
  FileEdit,
  Trash2,
  ChevronLeft,
  ChevronRight,
  Loader2,
  Eye,
  X,
  Facebook,
  Instagram,
  Zap,
  BarChart3,
  RefreshCw,
  Plus,
} from "lucide-react";
import { cn } from "@/lib/utils";

interface ScheduledPost {
  id: string;
  title: string;
  caption: string;
  hashtags: string[];
  image_url: string | null;
  source_type: string;
  source_id: string | null;
  source_url: string | null;
  platforms: string[];
  scheduled_at: string;
  status: string;
  published_at: string | null;
  fb_post_id: string | null;
  ig_post_id: string | null;
  error_message: string | null;
  created_at: string;
}

const statusConfig: Record<string, { label: string; color: string; icon: any }> = {
  draft: { label: "Draft", color: "bg-slate-500/10 text-slate-600 border-slate-200", icon: FileEdit },
  approved: { label: "Approved", color: "bg-blue-500/10 text-blue-600 border-blue-200", icon: CheckCircle2 },
  published: { label: "Published", color: "bg-emerald-500/10 text-emerald-600 border-emerald-200", icon: Send },
  failed: { label: "Failed", color: "bg-red-500/10 text-red-600 border-red-200", icon: AlertCircle },
};

export function AdminMarketingTab() {
  const [posts, setPosts] = useState<ScheduledPost[]>([]);
  const [loading, setLoading] = useState(true);
  const [generating, setGenerating] = useState(false);
  const [numWeeks, setNumWeeks] = useState(4);
  const [publishing, setPublishing] = useState<string | null>(null);
  const [selectedPost, setSelectedPost] = useState<ScheduledPost | null>(null);
  const [editCaption, setEditCaption] = useState("");
  const [editHashtags, setEditHashtags] = useState("");
  const [editImageUrl, setEditImageUrl] = useState("");
  const [calendarMonth, setCalendarMonth] = useState(new Date());
  const [view, setView] = useState<"calendar" | "list">("calendar");
  const [showManualForm, setShowManualForm] = useState(false);
  const [enhancingField, setEnhancingField] = useState<string | null>(null);
  const [manualForm, setManualForm] = useState({
    title: "",
    caption: "",
    hashtags: "",
    image_url: "",
    scheduled_at: "",
    source_url: "",
  });

  useEffect(() => {
    loadPosts();
  }, []);

  async function loadPosts() {
    setLoading(true);
    const { data, error } = await (supabase.from("scheduled_posts") as any)
      .select("*")
      .order("scheduled_at", { ascending: true });
    if (error) {
      console.error("Load error:", error);
      toast.error("Failed to load scheduled posts");
    }
    setPosts((data || []) as ScheduledPost[]);
    setLoading(false);
  }

  // Stats
  const stats = useMemo(() => {
    const total = posts.length;
    const drafts = posts.filter(p => p.status === "draft").length;
    const approved = posts.filter(p => p.status === "approved").length;
    const published = posts.filter(p => p.status === "published").length;
    const failed = posts.filter(p => p.status === "failed").length;
    return { total, drafts, approved, published, failed };
  }, [posts]);

  // Calendar helpers
  const calendarDays = useMemo(() => {
    const year = calendarMonth.getFullYear();
    const month = calendarMonth.getMonth();
    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);
    const startPad = firstDay.getDay(); // 0 = Sunday
    const days: (Date | null)[] = [];

    for (let i = 0; i < startPad; i++) days.push(null);
    for (let d = 1; d <= lastDay.getDate(); d++) {
      days.push(new Date(year, month, d));
    }
    return days;
  }, [calendarMonth]);

  const getPostsForDate = (date: Date) => {
    return posts.filter(p => {
      const postDate = new Date(p.scheduled_at);
      return postDate.getFullYear() === date.getFullYear() &&
             postDate.getMonth() === date.getMonth() &&
             postDate.getDate() === date.getDate();
    });
  };

  const previewDates = useMemo(() => {
    const dates: string[] = [];
    const targetDays = [1, 3, 5]; // Mon, Wed, Fri
    const totalPosts = numWeeks * 3;
    
    let current = new Date();
    current.setHours(0, 0, 0, 0);
    current.setDate(current.getDate() + 1); // tomorrow

    let count = 0;
    while (count < totalPosts) {
      if (targetDays.includes(current.getDay())) {
        dates.push(current.toDateString());
        count++;
      }
      current.setDate(current.getDate() + 1);
      if (dates.length > 100) break; // Safety
    }
    return dates;
  }, [numWeeks]);

  // Generate 30 days
  async function handleGenerate() {
    setGenerating(true);
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) throw new Error("Not authenticated");

      const response = await fetch("/api/generate-posts", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${session.access_token}`,
        },
        body: JSON.stringify({ 
          startDate: new Date().toISOString(),
          numWeeks
        }),
      });

      const data = await response.json();
      if (!response.ok) throw new Error(data.suggestion || data.error || "Generation failed");

      toast.success(data.message || `Generated ${data.count} posts!`);
      await loadPosts();
    } catch (err: any) {
      const message = err.message || "Failed to generate posts";
      toast.error(message, {
        duration: 5000,
      });
      console.error("Generation error:", err);
    } finally {
      setGenerating(false);
    }
  }

  // Publish single post
  async function handlePublish(postId: string) {
    setPublishing(postId);
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) throw new Error("Not authenticated");

      const response = await fetch("/api/publish-social", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${session.access_token}`,
        },
        body: JSON.stringify({ post_id: postId }),
      });

      const data = await response.json();
      if (!response.ok) throw new Error(data.error || "Publish failed");

      toast.success(data.message || "Published!");
      await loadPosts();
    } catch (err: any) {
      toast.error(err.message || "Failed to publish");
    } finally {
      setPublishing(null);
    }
  }

  // Update post
  async function handleUpdatePost() {
    if (!selectedPost) return;
    try {
      const { error } = await (supabase.from("scheduled_posts") as any)
        .update({
          caption: editCaption,
          hashtags: editHashtags.split(",").map((h: string) => h.trim()).filter(Boolean),
          image_url: editImageUrl || null,
          updated_at: new Date().toISOString(),
        })
        .eq("id", selectedPost.id);

      if (error) throw error;
      toast.success("Post updated!");
      setSelectedPost(null);
      await loadPosts();
    } catch (err: any) {
      toast.error(err.message);
    }
  }

  // Approve post
  async function handleApprove(postId: string) {
    const { error } = await (supabase.from("scheduled_posts") as any)
      .update({ status: "approved", updated_at: new Date().toISOString() })
      .eq("id", postId);
    if (error) toast.error(error.message);
    else {
      toast.success("Post approved!");
      await loadPosts();
    }
  }

  // Bulk approve all drafts
  async function handleBulkApprove() {
    const draftIds = posts.filter(p => p.status === "draft").map(p => p.id);
    if (draftIds.length === 0) return toast.info("No drafts to approve");

    const { error } = await (supabase.from("scheduled_posts") as any)
      .update({ status: "approved", updated_at: new Date().toISOString() })
      .in("id", draftIds);

    if (error) toast.error(error.message);
    else {
      toast.success(`Approved ${draftIds.length} posts!`);
      await loadPosts();
    }
  }

  // Delete post
  async function handleDelete(postId: string) {
    if (!confirm("Delete this scheduled post?")) return;
    const { error } = await (supabase.from("scheduled_posts") as any).delete().eq("id", postId);
    if (error) toast.error(error.message);
    else {
      toast.success("Post deleted");
      if (selectedPost?.id === postId) setSelectedPost(null);
      await loadPosts();
    }
  }

  // Clear all drafts
  async function handleClearDrafts() {
    if (!confirm("Delete ALL draft posts? This cannot be undone.")) return;
    const { error } = await (supabase.from("scheduled_posts") as any)
      .delete()
      .eq("status", "draft");
    if (error) toast.error(error.message);
    else {
      toast.success("All drafts cleared");
      await loadPosts();
    }
  }

  // Create manual post
  async function handleManualCreate(e: React.FormEvent) {
    e.preventDefault();
    if (!manualForm.title || !manualForm.caption || !manualForm.scheduled_at) {
      toast.error("Title, caption, and scheduled date are required");
      return;
    }
    try {
      const { error } = await (supabase.from("scheduled_posts") as any).insert({
        title: manualForm.title,
        caption: manualForm.caption,
        hashtags: manualForm.hashtags.split(",").map((h: string) => h.trim()).filter(Boolean),
        image_url: manualForm.image_url || null,
        source_type: "custom",
        source_url: manualForm.source_url || null,
        platforms: ["facebook", "instagram"],
        scheduled_at: new Date(manualForm.scheduled_at).toISOString(),
        status: "draft",
      });
      if (error) throw error;
      toast.success("Post created!");
      setManualForm({ title: "", caption: "", hashtags: "", image_url: "", scheduled_at: "", source_url: "" });
      setShowManualForm(false);
      await loadPosts();
    } catch (err: any) {
      toast.error(err.message);
    }
  }

  // AI Enhance a field
  async function aiEnhance(field: "title" | "caption" | "hashtags") {
    setEnhancingField(field);
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) throw new Error("Not authenticated");

      const response = await fetch("/api/ai-enhance", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${session.access_token}`,
        },
        body: JSON.stringify({
          field,
          value: manualForm[field],
          context: field === "title" ? manualForm.caption : field === "hashtags" ? manualForm.caption || manualForm.title : manualForm.title,
        }),
      });

      const data = await response.json();
      if (!response.ok) throw new Error(data.suggestion || data.error || "AI enhancement failed");

      setManualForm(prev => ({ ...prev, [field]: data.result }));
      toast.success(`${field.charAt(0).toUpperCase() + field.slice(1)} enhanced by AI!`);
    } catch (err: any) {
      toast.error(err.message || "AI enhancement failed");
    } finally {
      setEnhancingField(null);
    }
  }

  // Open editor
  function openEditor(post: ScheduledPost) {
    setSelectedPost(post);
    setEditCaption(post.caption);
    setEditHashtags((post.hashtags || []).join(", "));
    setEditImageUrl(post.image_url || "");
  }

  // Click on a date to add a post (Buffer-style)
  function handleDateClick(day: Date) {
    const d = new Date(day);
    d.setHours(9, 0, 0, 0);
    // Format to datetime-local: YYYY-MM-DDTHH:MM
    const pad = (n: number) => String(n).padStart(2, "0");
    const localStr = `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
    setManualForm({
      title: "",
      caption: "",
      hashtags: "",
      image_url: "",
      scheduled_at: localStr,
      source_url: "",
    });
    setShowManualForm(true);
    // Scroll to form
    setTimeout(() => document.getElementById("manual-post-form")?.scrollIntoView({ behavior: "smooth", block: "center" }), 100);
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Stats Bar */}
      <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
        {[
          { label: "Total", value: stats.total, color: "text-foreground", bg: "bg-muted/50" },
          { label: "Drafts", value: stats.drafts, color: "text-slate-600", bg: "bg-slate-50 dark:bg-slate-900/30" },
          { label: "Approved", value: stats.approved, color: "text-blue-600", bg: "bg-blue-50 dark:bg-blue-900/20" },
          { label: "Published", value: stats.published, color: "text-emerald-600", bg: "bg-emerald-50 dark:bg-emerald-900/20" },
          { label: "Failed", value: stats.failed, color: "text-red-600", bg: "bg-red-50 dark:bg-red-900/20" },
        ].map((s) => (
          <div key={s.label} className={cn("rounded-xl p-4 border border-border/50", s.bg)}>
            <p className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">{s.label}</p>
            <p className={cn("text-2xl font-black mt-1", s.color)}>{s.value}</p>
          </div>
        ))}
      </div>

      {/* Action Bar */}
      <Card className="border-border/50 shadow-md bg-white/50 backdrop-blur-sm">
        <CardContent className="pt-6">
          <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-6">
            <div className="space-y-1">
              <h3 className="text-xl font-bold flex items-center gap-2 text-primary">
                <Sparkles className="h-6 w-6" />
                Marketing Automation
              </h3>
              <p className="text-sm text-muted-foreground max-w-2xl">
                AI-generated strategy: <strong>3 posts/week (Mon, Wed, Fri)</strong> targeted at midlife wellness seekers, 
                supportive buyers & preventative wellness women.
              </p>
            </div>
            <div className="flex flex-wrap items-center gap-3">
              <div className="flex items-center gap-2 bg-muted/50 p-1 rounded-lg border border-border/50">
                <span className="text-xs font-medium px-2 text-muted-foreground uppercase tracking-wider">Plan:</span>
                <select 
                  className="h-8 rounded-md border-0 bg-transparent px-2 py-0 text-sm font-semibold focus:ring-0 cursor-pointer"
                  value={numWeeks}
                  onChange={(e) => setNumWeeks(Number(e.target.value))}
                  disabled={generating}
                >
                  <option value={1}>1 Week (3 posts)</option>
                  <option value={2}>2 Weeks (6 posts)</option>
                  <option value={4}>4 Weeks (12 posts)</option>
                  <option value={8}>8 Weeks (24 posts)</option>
                </select>
              </div>

              <Button
                onClick={handleGenerate}
                disabled={generating}
                className="bg-gradient-to-r from-primary to-purple-600 hover:from-primary/90 hover:to-purple-600/90 shadow-lg min-w-[160px]"
              >
                {generating ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Generating...
                  </>
                ) : (
                  <>
                    <Zap className="mr-2 h-4 w-4" />
                    Generate Strategy
                  </>
                )}
              </Button>
              <div className="flex items-center gap-2 h-10 px-1 border-l border-border/50 ml-1">
                <Button variant="outline" size="sm" onClick={handleBulkApprove} disabled={stats.drafts === 0} className="h-9">
                  <CheckCircle2 className="mr-2 h-4 w-4" />
                  Approve ({stats.drafts})
                </Button>
                <Button variant="outline" size="sm" onClick={handleClearDrafts} disabled={stats.drafts === 0} className="h-9 text-destructive hover:text-destructive hover:bg-destructive/10">
                  <Trash2 className="mr-2 h-4 w-4" />
                  Clear
                </Button>
                <Button variant="ghost" size="icon" onClick={loadPosts} className="h-9 w-9">
                  <RefreshCw className="h-4 w-4" />
                </Button>
                <Button variant="secondary" size="sm" onClick={() => setShowManualForm(!showManualForm)} className="h-9">
                  <Plus className="mr-2 h-4 w-4" />
                  Add Post
                </Button>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Manual Post Form */}
      {showManualForm && (
        <Card className="border-primary/20 bg-primary/5 animate-in fade-in slide-in-from-top-2 duration-300">
          <CardHeader className="pb-3">
         <CardTitle className="text-lg flex items-center gap-2">
              <Plus className="h-5 w-5" /> Create Post {manualForm.scheduled_at ? `for ${new Date(manualForm.scheduled_at).toLocaleDateString("en-AU", { weekday: "long", day: "numeric", month: "long" })}` : "Manually"}
            </CardTitle>
            <CardDescription>Schedule a custom social media post without AI generation.</CardDescription>
          </CardHeader>
          <CardContent>
            <form id="manual-post-form" onSubmit={handleManualCreate} className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2 sm:col-span-2">
                <div className="flex items-center justify-between">
                  <Label>Title</Label>
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    className="h-7 text-xs text-primary hover:text-primary gap-1.5"
                    disabled={enhancingField === "title"}
                    onClick={() => aiEnhance("title")}
                  >
                    {enhancingField === "title" ? <Loader2 className="h-3 w-3 animate-spin" /> : <Sparkles className="h-3 w-3" />}
                    {enhancingField === "title" ? "Enhancing..." : manualForm.title ? "Improve with AI" : "Generate with AI"}
                  </Button>
                </div>
                <Input
                  required
                  value={manualForm.title}
                  onChange={e => setManualForm({ ...manualForm, title: e.target.value })}
                  placeholder="e.g. Monday Motivation — Gut Health Tips"
                />
              </div>
              <div className="space-y-2 sm:col-span-2">
                <div className="flex items-center justify-between">
                  <Label>Caption</Label>
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    className="h-7 text-xs text-primary hover:text-primary gap-1.5"
                    disabled={enhancingField === "caption"}
                    onClick={() => aiEnhance("caption")}
                  >
                    {enhancingField === "caption" ? <Loader2 className="h-3 w-3 animate-spin" /> : <Sparkles className="h-3 w-3" />}
                    {enhancingField === "caption" ? "Writing..." : manualForm.caption ? "Rewrite with AI" : "Write with AI"}
                  </Button>
                </div>
                <Textarea
                  required
                  rows={5}
                  value={manualForm.caption}
                  onChange={e => setManualForm({ ...manualForm, caption: e.target.value })}
                  placeholder="Write your post caption here... or click 'Write with AI' to generate one"
                />
              </div>
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <Label>Hashtags</Label>
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    className="h-7 text-xs text-primary hover:text-primary gap-1.5"
                    disabled={enhancingField === "hashtags"}
                    onClick={() => aiEnhance("hashtags")}
                  >
                    {enhancingField === "hashtags" ? <Loader2 className="h-3 w-3 animate-spin" /> : <Sparkles className="h-3 w-3" />}
                    {enhancingField === "hashtags" ? "Generating..." : "Auto-generate"}
                  </Button>
                </div>
                <Input
                  value={manualForm.hashtags}
                  onChange={e => setManualForm({ ...manualForm, hashtags: e.target.value })}
                  placeholder="#NaturalWellness, #MenopauseSupport"
                />
              </div>
              <div className="space-y-2">
                <Label>Schedule Date & Time</Label>
                <Input
                  type="datetime-local"
                  required
                  value={manualForm.scheduled_at}
                  onChange={e => setManualForm({ ...manualForm, scheduled_at: e.target.value })}
                />
              </div>
              <div className="space-y-2">
                <Label>Image URL (optional)</Label>
                <Input
                  value={manualForm.image_url}
                  onChange={e => setManualForm({ ...manualForm, image_url: e.target.value })}
                  placeholder="https://..."
                />
              </div>
              <div className="space-y-2">
                <Label>Link URL (optional)</Label>
                <Input
                  value={manualForm.source_url}
                  onChange={e => setManualForm({ ...manualForm, source_url: e.target.value })}
                  placeholder="/articles/my-article-slug"
                />
              </div>
              <div className="flex gap-2 sm:col-span-2 pt-2">
                <Button type="submit">
                  <Plus className="mr-2 h-4 w-4" /> Create Post
                </Button>
                <Button type="button" variant="outline" onClick={() => setShowManualForm(false)}>Cancel</Button>
              </div>
            </form>
          </CardContent>
        </Card>
      )}

      {/* View Toggle */}
      <div className="flex items-center gap-2">
        <Button
          variant={view === "calendar" ? "default" : "outline"}
          size="sm"
          onClick={() => setView("calendar")}
        >
          <Calendar className="mr-2 h-4 w-4" /> Calendar
        </Button>
        <Button
          variant={view === "list" ? "default" : "outline"}
          size="sm"
          onClick={() => setView("list")}
        >
          <BarChart3 className="mr-2 h-4 w-4" /> List
        </Button>
      </div>

      {/* Calendar View */}
      {view === "calendar" && (
        <Card className="border-border/50 overflow-hidden">
          <CardHeader className="pb-2">
            <div className="flex items-center gap-4 text-[10px] text-muted-foreground font-medium bg-muted/30 px-3 py-1 rounded-full border border-border/50 mb-2">
              <div className="flex items-center gap-1.5">
                <div className="w-2.5 h-2.5 rounded-full bg-primary/20 border border-primary/40 shadow-sm" />
                <span>Proposed Slot</span>
              </div>
              <div className="flex items-center gap-1.5">
                <div className="w-2.5 h-2.5 rounded-full bg-primary border border-primary shadow-sm" />
                <span>Today</span>
              </div>
            </div>
            <div className="flex items-center justify-between">
              <Button variant="ghost" size="icon" onClick={() => setCalendarMonth(new Date(calendarMonth.getFullYear(), calendarMonth.getMonth() - 1, 1))}>
                <ChevronLeft className="h-4 w-4" />
              </Button>
              <h3 className="text-lg font-bold">
                {calendarMonth.toLocaleDateString("en-AU", { month: "long", year: "numeric" })}
              </h3>
              <Button variant="ghost" size="icon" onClick={() => setCalendarMonth(new Date(calendarMonth.getFullYear(), calendarMonth.getMonth() + 1, 1))}>
                <ChevronRight className="h-4 w-4" />
              </Button>
            </div>
          </CardHeader>
          <CardContent className="p-2 sm:p-4">
            {/* Day headers */}
            <div className="grid grid-cols-7 gap-1 mb-1">
              {["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"].map((d) => (
                <div key={d} className="text-center text-[10px] font-bold text-muted-foreground uppercase tracking-widest py-2">
                  {d}
                </div>
              ))}
            </div>
            {/* Calendar grid */}
            <div className="grid grid-cols-7 gap-1">
              {calendarDays.map((day, i) => {
                if (!day) return <div key={`pad-${i}`} className="min-h-[80px]" />;

                const dayPosts = getPostsForDate(day);
                const isToday = day.toDateString() === new Date().toDateString();
                const isProposed = previewDates.includes(day.toDateString());

                return (
                  <div
                    key={day.toISOString()}
                    className={cn(
                      "min-h-[100px] rounded-lg border border-border/30 p-1.5 transition-all hover:border-primary/40 hover:shadow-sm cursor-pointer group/day relative",
                      isToday && "bg-primary/5 border-primary/40 ring-1 ring-primary/20",
                      isProposed && !isToday && "bg-primary/10 border-primary/40 ring-1 ring-primary/10"
                    )}
                    onClick={(e) => {
                      // Only trigger if clicking the day cell itself, not a post button
                      if ((e.target as HTMLElement).closest("button[data-post]")) return;
                      handleDateClick(day);
                    }}
                  >
                    <div className="flex items-center justify-between mb-1">
                      <p className={cn(
                        "text-xs font-bold",
                        isToday ? "text-primary" : isProposed ? "text-primary/70" : "text-muted-foreground"
                      )}>
                        {day.getDate()}
                      </p>
                      <div className="flex items-center gap-1">
                        {isProposed && (
                          <Sparkles className="h-2.5 w-2.5 text-primary/40 animate-pulse" />
                        )}
                        <span className="h-4 w-4 rounded-full bg-primary/0 group-hover/day:bg-primary/10 flex items-center justify-center transition-all opacity-0 group-hover/day:opacity-100">
                          <Plus className="h-2.5 w-2.5 text-primary" />
                        </span>
                      </div>
                    </div>
                    <div className="space-y-0.5">
                      {dayPosts.slice(0, 3).map((p) => {
                        const cfg = statusConfig[p.status] || statusConfig.draft;
                        return (
                          <button
                            key={p.id}
                            data-post="true"
                            onClick={(e) => { e.stopPropagation(); openEditor(p); }}
                            className={cn(
                              "w-full text-left text-[9px] leading-tight font-medium px-1 py-0.5 rounded truncate transition-all hover:opacity-80",
                              cfg.color
                            )}
                            title={p.title}
                          >
                            {p.title}
                          </button>
                        );
                      })}
                      {dayPosts.length > 3 && (
                        <p className="text-[9px] text-muted-foreground text-center">
                          +{dayPosts.length - 3} more
                        </p>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </CardContent>
        </Card>
      )}

      {/* List View */}
      {view === "list" && (
        <div className="space-y-3">
          {posts.length === 0 ? (
            <Card>
              <CardContent className="py-16 text-center">
                <Sparkles className="h-12 w-12 mx-auto text-muted-foreground/30 mb-4" />
                <h3 className="text-lg font-bold mb-2">No posts scheduled yet</h3>
                <p className="text-sm text-muted-foreground mb-6">
                  Click "Generate 30 Days" to create AI-powered marketing content from your articles and products.
                </p>
              </CardContent>
            </Card>
          ) : (
            posts.map((post) => {
              const cfg = statusConfig[post.status] || statusConfig.draft;
              const StatusIcon = cfg.icon;
              return (
                <Card key={post.id} className="border-border/50 hover:shadow-sm transition-all">
                  <CardContent className="py-4">
                    <div className="flex items-start gap-4">
                      {/* Image preview */}
                      {post.image_url && (
                        <div className="hidden sm:block h-16 w-16 rounded-lg overflow-hidden bg-muted shrink-0">
                          <img src={post.image_url} alt="" className="h-full w-full object-cover" />
                        </div>
                      )}
                      {/* Content */}
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1">
                          <StatusIcon className="h-3.5 w-3.5 shrink-0" />
                          <Badge variant="outline" className={cn("text-[9px] font-bold uppercase tracking-wider", cfg.color)}>
                            {cfg.label}
                          </Badge>
                          <Badge variant="secondary" className="text-[9px] uppercase tracking-wider">
                            {post.source_type}
                          </Badge>
                          <span className="text-[10px] text-muted-foreground ml-auto shrink-0">
                            <Clock className="inline h-3 w-3 mr-0.5" />
                            {new Date(post.scheduled_at).toLocaleDateString("en-AU", { day: "numeric", month: "short" })} at{" "}
                            {new Date(post.scheduled_at).toLocaleTimeString("en-AU", { hour: "2-digit", minute: "2-digit" })}
                          </span>
                        </div>
                        <h4 className="text-sm font-bold truncate">{post.title}</h4>
                        <p className="text-xs text-muted-foreground line-clamp-2 mt-0.5">
                          {post.caption.replace(/\\n/g, " ").substring(0, 150)}...
                        </p>
                        <div className="flex items-center gap-1 mt-2 flex-wrap">
                          {(post.hashtags || []).slice(0, 4).map((h, i) => (
                            <span key={i} className="text-[9px] bg-primary/5 text-primary px-1.5 py-0.5 rounded-full font-medium">
                              {h.startsWith("#") ? h : `#${h}`}
                            </span>
                          ))}
                          <div className="ml-auto flex items-center gap-1">
                            {post.platforms?.includes("facebook") && <Facebook className="h-3.5 w-3.5 text-blue-600" />}
                            {post.platforms?.includes("instagram") && <Instagram className="h-3.5 w-3.5 text-pink-600" />}
                          </div>
                        </div>
                      </div>
                      {/* Actions */}
                      <div className="flex flex-col gap-1 shrink-0">
                        <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => openEditor(post)}>
                          <Eye className="h-3.5 w-3.5" />
                        </Button>
                        {post.status === "draft" && (
                          <Button variant="ghost" size="icon" className="h-7 w-7 text-blue-600" onClick={() => handleApprove(post.id)}>
                            <CheckCircle2 className="h-3.5 w-3.5" />
                          </Button>
                        )}
                        {(post.status === "approved" || post.status === "draft") && (
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-7 w-7 text-emerald-600"
                            onClick={() => handlePublish(post.id)}
                            disabled={publishing === post.id}
                          >
                            {publishing === post.id ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Send className="h-3.5 w-3.5" />}
                          </Button>
                        )}
                        <Button variant="ghost" size="icon" className="h-7 w-7 text-destructive" onClick={() => handleDelete(post.id)}>
                          <Trash2 className="h-3.5 w-3.5" />
                        </Button>
                      </div>
                    </div>
                    {post.error_message && (
                      <div className="mt-2 text-xs text-red-600 bg-red-50 dark:bg-red-900/10 rounded-lg p-2">
                        <AlertCircle className="inline h-3 w-3 mr-1" />
                        {post.error_message}
                      </div>
                    )}
                  </CardContent>
                </Card>
              );
            })
          )}
        </div>
      )}

      {/* Post Editor Modal */}
      {selectedPost && (
        <div className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4" onClick={() => setSelectedPost(null)}>
          <div
            className="bg-background rounded-2xl border border-border shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between p-6 border-b border-border">
              <div>
                <h3 className="text-lg font-bold">{selectedPost.title}</h3>
                <p className="text-xs text-muted-foreground mt-0.5">
                  Scheduled for {new Date(selectedPost.scheduled_at).toLocaleDateString("en-AU", { weekday: "long", day: "numeric", month: "long" })}
                </p>
              </div>
              <Button variant="ghost" size="icon" onClick={() => setSelectedPost(null)}>
                <X className="h-5 w-5" />
              </Button>
            </div>

            <div className="p-6 space-y-5">
              {/* Preview Image */}
              <div className="space-y-2">
                <Label>Image URL</Label>
                <Input value={editImageUrl} onChange={(e) => setEditImageUrl(e.target.value)} placeholder="https://..." />
                {editImageUrl && (
                  <div className="rounded-xl overflow-hidden border border-border aspect-video bg-muted">
                    <img src={editImageUrl} alt="Preview" className="h-full w-full object-cover" />
                  </div>
                )}
              </div>

              {/* Caption */}
              <div className="space-y-2">
                <Label>Caption</Label>
                <Textarea
                  value={editCaption}
                  onChange={(e) => setEditCaption(e.target.value)}
                  rows={8}
                  className="font-mono text-sm"
                />
                <p className="text-[10px] text-muted-foreground">
                  {editCaption.length} characters • Use \n for line breaks
                </p>
              </div>

              {/* Hashtags */}
              <div className="space-y-2">
                <Label>Hashtags (comma-separated)</Label>
                <Input
                  value={editHashtags}
                  onChange={(e) => setEditHashtags(e.target.value)}
                  placeholder="#MenopauseSupport, #NaturalWellness, #AustralianMade"
                />
              </div>

              {/* Platforms & Source */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label className="text-muted-foreground">Platforms</Label>
                  <div className="flex gap-2 mt-1">
                    {selectedPost.platforms?.includes("facebook") && (
                      <Badge variant="secondary" className="gap-1"><Facebook className="h-3 w-3" /> Facebook</Badge>
                    )}
                    {selectedPost.platforms?.includes("instagram") && (
                      <Badge variant="secondary" className="gap-1"><Instagram className="h-3 w-3" /> Instagram</Badge>
                    )}
                  </div>
                </div>
                <div>
                  <Label className="text-muted-foreground">Source</Label>
                  <p className="text-sm font-medium mt-1">
                    {selectedPost.source_type} {selectedPost.source_url && (
                      <a href={selectedPost.source_url} className="text-primary underline text-xs ml-1" target="_blank" rel="noopener">View →</a>
                    )}
                  </p>
                </div>
              </div>
            </div>

            {/* Footer Actions */}
            <div className="flex items-center justify-between p-6 border-t border-border bg-muted/30">
              <div className="flex gap-2">
                {selectedPost.status !== "published" && (
                  <Button variant="destructive" size="sm" onClick={() => { handleDelete(selectedPost.id); }}>
                    <Trash2 className="mr-2 h-4 w-4" /> Delete
                  </Button>
                )}
              </div>
              <div className="flex gap-2">
                <Button variant="outline" onClick={() => setSelectedPost(null)}>Cancel</Button>
                <Button onClick={handleUpdatePost}>
                  <FileEdit className="mr-2 h-4 w-4" /> Save Changes
                </Button>
                {selectedPost.status !== "published" && (
                  <Button
                    className="bg-gradient-to-r from-emerald-500 to-emerald-600"
                    onClick={() => { handlePublish(selectedPost.id); setSelectedPost(null); }}
                  >
                    <Send className="mr-2 h-4 w-4" /> Publish Now
                  </Button>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
