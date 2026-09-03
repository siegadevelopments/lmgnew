"use client";

import { useEffect, useState, useMemo } from "react";
import Head from "next/head";
import { cn } from "@/lib/utils";
import { 
  Loader2, 
  CheckCircle2, 
  Circle, 
  ChevronDown, 
  Search, 
  Filter, 
  RotateCcw, 
  Sparkles, 
  Target, 
  TrendingUp, 
  Calendar, 
  Check, 
  Layers, 
  Award, 
  ArrowRight,
  Maximize2,
  Minimize2,
  CheckSquare
} from "lucide-react";

export default function MarketingPlan90() {
  const [tasks, setTasks] = useState<Record<string, boolean>>({});
  const [openWeeks, setOpenWeeks] = useState<Record<string, boolean>>({ w1: true });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [activeMonth, setActiveMonth] = useState<string>("all");
  const [filterStatus, setFilterStatus] = useState<"all" | "pending" | "completed">("all");
  const [searchQuery, setSearchQuery] = useState("");

  // Fetch initial state from DB
  useEffect(() => {
    async function loadState() {
      try {
        const res = await fetch("/api/plan-90");
        if (res.ok) {
          const data = await res.json();
          if (data.state) setTasks(data.state);
        }
      } catch (err) {
        console.error("Failed to load marketing plan state:", err);
      } finally {
        setLoading(false);
      }
    }
    loadState();
  }, []);

  // Save state to DB
  const saveStateToDB = async (newState: Record<string, boolean>) => {
    setSaving(true);
    try {
      await fetch("/api/plan-90", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ state: newState }),
      });
    } catch (err) {
      console.error("Failed to save marketing plan state:", err);
    } finally {
      setSaving(false);
    }
  };

  const toggleTask = (taskId: string) => {
    const newState = { ...tasks, [taskId]: !tasks[taskId] };
    setTasks(newState);
    saveStateToDB(newState);
  };

  const toggleWeek = (weekId: string) => {
    setOpenWeeks(prev => ({ ...prev, [weekId]: !prev[weekId] }));
  };

  const expandAll = () => {
    const allWeeks: Record<string, boolean> = {};
    Object.keys(PLAN_DATA).forEach(w => { allWeeks[w] = true; });
    setOpenWeeks(allWeeks);
  };

  const collapseAll = () => {
    setOpenWeeks({});
  };

  const resetAll = () => {
    if (!window.confirm("Reset all task checkboxes? This action cannot be undone.")) return;
    const newState = {};
    setTasks(newState);
    saveStateToDB(newState);
  };

  // Helper to calculate progress
  const getProgress = (weekIds: string[]) => {
    let total = 0;
    let done = 0;
    
    Object.keys(PLAN_DATA).forEach(weekId => {
      if (weekIds.includes(weekId)) {
        PLAN_DATA[weekId].categories.forEach((cat: any) => {
          cat.tasks.forEach((t: any) => {
            total++;
            if (tasks[t.id]) done++;
          });
        });
      }
    });
    
    return { done, total, pct: total > 0 ? Math.round((done / total) * 100) : 0 };
  };

  const overall = useMemo(() => getProgress(Object.keys(PLAN_DATA)), [tasks]);
  const m1 = useMemo(() => getProgress(["w1", "w2", "w3", "w4"]), [tasks]);
  const m2 = useMemo(() => getProgress(["w5", "w6", "w7", "w8"]), [tasks]);
  const m3 = useMemo(() => getProgress(["w9", "w10", "w11", "w12"]), [tasks]);

  const filteredMonths = useMemo(() => {
    if (activeMonth === "all") return MONTHS;
    return MONTHS.filter(m => m.id === activeMonth);
  }, [activeMonth]);

  if (loading) {
    return (
      <div className="flex h-screen w-full flex-col items-center justify-center bg-slate-950 text-white">
        <div className="relative flex items-center justify-center">
          <div className="h-16 w-16 rounded-full border-4 border-emerald-500/20 border-t-emerald-500 animate-spin" />
          <Sparkles className="absolute h-6 w-6 text-emerald-400 animate-pulse" />
        </div>
        <p className="mt-4 text-sm font-medium text-slate-400">Loading 90-Day Strategy Dashboard...</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 font-sans selection:bg-emerald-500/30 selection:text-emerald-300">
      <Head>
        <title>90-Day Marketing Plan | Lifestyle Medicine Gateway</title>
        <meta name="robots" content="noindex, nofollow" />
      </Head>

      {/* AMBIENT BACKGROUND GLOWS */}
      <div className="fixed inset-0 pointer-events-none overflow-hidden z-0">
        <div className="absolute -top-40 -left-40 h-96 w-96 rounded-full bg-emerald-600/10 blur-3xl" />
        <div className="absolute top-1/3 -right-40 h-96 w-96 rounded-full bg-cyan-600/10 blur-3xl" />
        <div className="absolute bottom-10 left-1/3 h-96 w-96 rounded-full bg-purple-600/10 blur-3xl" />
      </div>

      <div className="relative z-10">
        {/* HEADER SECTION */}
        <header className="border-b border-slate-800/80 bg-slate-900/60 backdrop-blur-xl pt-10 pb-8 px-4 sm:px-6 lg:px-8">
          <div className="max-w-7xl mx-auto">
            
            {/* TOP BAR BRANDING */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
              <div>
                <div className="inline-flex items-center gap-2 rounded-full border border-emerald-500/30 bg-emerald-500/10 px-3 py-1 text-xs font-semibold text-emerald-400 mb-3">
                  <Sparkles className="h-3.5 w-3.5" />
                  <span>Full Funnel Execution Plan</span>
                </div>
                <h1 className="text-3xl sm:text-4xl lg:text-5xl font-black tracking-tight text-white">
                  90-Day Marketing Plan
                </h1>
                <p className="mt-1.5 text-sm sm:text-base text-slate-400">
                  Lifestyle Medicine Gateway — Australia | Launch & Scaled Growth Strategy
                </p>
              </div>

              {/* SAVE / RESET STATUS BADGE */}
              <div className="flex items-center gap-3 self-start md:self-auto">
                {saving && (
                  <span className="flex items-center gap-2 rounded-lg border border-amber-500/30 bg-amber-500/10 px-3 py-1.5 text-xs font-medium text-amber-400 animate-pulse">
                    <Loader2 className="h-3.5 w-3.5 animate-spin" />
                    Saving...
                  </span>
                )}
                <button 
                  onClick={resetAll}
                  className="flex items-center gap-1.5 rounded-lg border border-slate-700/80 bg-slate-800/50 px-3 py-1.5 text-xs font-medium text-slate-400 hover:text-red-400 hover:border-red-500/40 hover:bg-red-500/10 transition-all duration-200"
                  title="Reset all checked items"
                >
                  <RotateCcw className="h-3.5 w-3.5" />
                  <span>Reset Progress</span>
                </button>
              </div>
            </div>

            {/* STRATEGY KPI SUMMARY CARDS */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              
              {/* OVERALL PROGRESS */}
              <div className="relative overflow-hidden rounded-2xl border border-slate-800 bg-slate-900/80 p-5 shadow-lg backdrop-blur-md">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-xs font-bold uppercase tracking-wider text-slate-400">Overall Progress</span>
                  <Award className="h-5 w-5 text-emerald-400" />
                </div>
                <div className="flex items-baseline justify-between">
                  <span className="text-3xl font-black text-emerald-400">{overall.pct}%</span>
                  <span className="text-xs font-semibold text-slate-400">{overall.done} / {overall.total} Tasks</span>
                </div>
                <div className="mt-3 h-2 w-full overflow-hidden rounded-full bg-slate-800">
                  <div 
                    className="h-full rounded-full bg-gradient-to-r from-emerald-500 to-teal-400 transition-all duration-500"
                    style={{ width: `${overall.pct}%` }}
                  />
                </div>
              </div>

              {/* MONTH 1 */}
              <div 
                onClick={() => setActiveMonth("m1")}
                className={cn(
                  "relative cursor-pointer overflow-hidden rounded-2xl border p-5 shadow-lg transition-all duration-200 backdrop-blur-md",
                  activeMonth === "m1" ? "border-cyan-500 bg-cyan-950/30 ring-1 ring-cyan-500/50" : "border-slate-800 bg-slate-900/80 hover:border-slate-700"
                )}
              >
                <div className="flex items-center justify-between mb-2">
                  <span className="text-xs font-bold uppercase tracking-wider text-cyan-400">Month 1 · Foundation</span>
                  <span className="text-xs font-extrabold text-cyan-400">{m1.pct}%</span>
                </div>
                <div className="text-xl font-bold text-white mb-1">Weeks 1 – 4</div>
                <div className="h-1.5 w-full overflow-hidden rounded-full bg-slate-800 mt-3">
                  <div className="h-full rounded-full bg-cyan-400 transition-all duration-500" style={{ width: `${m1.pct}%` }} />
                </div>
                <div className="mt-2 text-[11px] text-slate-400">{m1.done} of {m1.total} tasks completed</div>
              </div>

              {/* MONTH 2 */}
              <div 
                onClick={() => setActiveMonth("m2")}
                className={cn(
                  "relative cursor-pointer overflow-hidden rounded-2xl border p-5 shadow-lg transition-all duration-200 backdrop-blur-md",
                  activeMonth === "m2" ? "border-emerald-500 bg-emerald-950/30 ring-1 ring-emerald-500/50" : "border-slate-800 bg-slate-900/80 hover:border-slate-700"
                )}
              >
                <div className="flex items-center justify-between mb-2">
                  <span className="text-xs font-bold uppercase tracking-wider text-emerald-400">Month 2 · Growth</span>
                  <span className="text-xs font-extrabold text-emerald-400">{m2.pct}%</span>
                </div>
                <div className="text-xl font-bold text-white mb-1">Weeks 5 – 8</div>
                <div className="h-1.5 w-full overflow-hidden rounded-full bg-slate-800 mt-3">
                  <div className="h-full rounded-full bg-emerald-400 transition-all duration-500" style={{ width: `${m2.pct}%` }} />
                </div>
                <div className="mt-2 text-[11px] text-slate-400">{m2.done} of {m2.total} tasks completed</div>
              </div>

              {/* MONTH 3 */}
              <div 
                onClick={() => setActiveMonth("m3")}
                className={cn(
                  "relative cursor-pointer overflow-hidden rounded-2xl border p-5 shadow-lg transition-all duration-200 backdrop-blur-md",
                  activeMonth === "m3" ? "border-amber-500 bg-amber-950/30 ring-1 ring-amber-500/50" : "border-slate-800 bg-slate-900/80 hover:border-slate-700"
                )}
              >
                <div className="flex items-center justify-between mb-2">
                  <span className="text-xs font-bold uppercase tracking-wider text-amber-400">Month 3 · Scale</span>
                  <span className="text-xs font-extrabold text-amber-400">{m3.pct}%</span>
                </div>
                <div className="text-xl font-bold text-white mb-1">Weeks 9 – 12</div>
                <div className="h-1.5 w-full overflow-hidden rounded-full bg-slate-800 mt-3">
                  <div className="h-full rounded-full bg-amber-400 transition-all duration-500" style={{ width: `${m3.pct}%` }} />
                </div>
                <div className="mt-2 text-[11px] text-slate-400">{m3.done} of {m3.total} tasks completed</div>
              </div>

            </div>
          </div>
        </header>

        {/* STICKY CONTROL & FILTER BAR */}
        <div className="sticky top-0 z-30 border-b border-slate-800/80 bg-slate-950/90 backdrop-blur-md py-3 px-4 sm:px-6 lg:px-8 shadow-md">
          <div className="max-w-7xl mx-auto flex flex-col md:flex-row md:items-center justify-between gap-3">
            
            {/* MONTH FILTER TABS */}
            <div className="flex items-center gap-1.5 overflow-x-auto pb-1 md:pb-0 no-scrollbar">
              <button
                onClick={() => setActiveMonth("all")}
                className={cn(
                  "whitespace-nowrap rounded-lg px-3.5 py-1.5 text-xs font-bold transition-all duration-150",
                  activeMonth === "all"
                    ? "bg-emerald-500 text-slate-950 shadow-md shadow-emerald-500/20"
                    : "bg-slate-900 text-slate-400 hover:bg-slate-800 hover:text-white border border-slate-800"
                )}
              >
                All Months (12 Weeks)
              </button>
              <button
                onClick={() => setActiveMonth("m1")}
                className={cn(
                  "whitespace-nowrap rounded-lg px-3.5 py-1.5 text-xs font-bold transition-all duration-150",
                  activeMonth === "m1"
                    ? "bg-cyan-500 text-slate-950 shadow-md shadow-cyan-500/20"
                    : "bg-slate-900 text-slate-400 hover:bg-slate-800 hover:text-white border border-slate-800"
                )}
              >
                Month 1: Foundation
              </button>
              <button
                onClick={() => setActiveMonth("m2")}
                className={cn(
                  "whitespace-nowrap rounded-lg px-3.5 py-1.5 text-xs font-bold transition-all duration-150",
                  activeMonth === "m2"
                    ? "bg-emerald-500 text-slate-950 shadow-md shadow-emerald-500/20"
                    : "bg-slate-900 text-slate-400 hover:bg-slate-800 hover:text-white border border-slate-800"
                )}
              >
                Month 2: Growth
              </button>
              <button
                onClick={() => setActiveMonth("m3")}
                className={cn(
                  "whitespace-nowrap rounded-lg px-3.5 py-1.5 text-xs font-bold transition-all duration-150",
                  activeMonth === "m3"
                    ? "bg-amber-500 text-slate-950 shadow-md shadow-amber-500/20"
                    : "bg-slate-900 text-slate-400 hover:bg-slate-800 hover:text-white border border-slate-800"
                )}
              >
                Month 3: Conversion
              </button>
            </div>

            {/* SEARCH & CONTROLS */}
            <div className="flex items-center gap-2">
              {/* SEARCH INPUT */}
              <div className="relative flex-1 md:w-64">
                <Search className="absolute left-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-slate-500" />
                <input
                  type="text"
                  placeholder="Search tasks..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full rounded-lg border border-slate-800 bg-slate-900 py-1.5 pl-9 pr-3 text-xs text-slate-200 placeholder-slate-500 focus:border-emerald-500 focus:outline-none focus:ring-1 focus:ring-emerald-500"
                />
                {searchQuery && (
                  <button
                    onClick={() => setSearchQuery("")}
                    className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-500 hover:text-slate-300 text-xs"
                  >
                    ✕
                  </button>
                )}
              </div>

              {/* STATUS FILTER */}
              <div className="flex items-center rounded-lg border border-slate-800 bg-slate-900 p-0.5">
                <button
                  onClick={() => setFilterStatus("all")}
                  className={cn(
                    "rounded-md px-2.5 py-1 text-[11px] font-semibold transition-colors",
                    filterStatus === "all" ? "bg-slate-800 text-emerald-400" : "text-slate-400 hover:text-slate-200"
                  )}
                >
                  All
                </button>
                <button
                  onClick={() => setFilterStatus("pending")}
                  className={cn(
                    "rounded-md px-2.5 py-1 text-[11px] font-semibold transition-colors",
                    filterStatus === "pending" ? "bg-slate-800 text-amber-400" : "text-slate-400 hover:text-slate-200"
                  )}
                >
                  Pending
                </button>
                <button
                  onClick={() => setFilterStatus("completed")}
                  className={cn(
                    "rounded-md px-2.5 py-1 text-[11px] font-semibold transition-colors",
                    filterStatus === "completed" ? "bg-slate-800 text-emerald-400" : "text-slate-400 hover:text-slate-200"
                  )}
                >
                  Done
                </button>
              </div>

              {/* EXPAND / COLLAPSE */}
              <button
                onClick={expandAll}
                className="hidden sm:flex items-center gap-1 rounded-lg border border-slate-800 bg-slate-900 px-2.5 py-1.5 text-xs text-slate-400 hover:bg-slate-800 hover:text-white"
                title="Expand All Weeks"
              >
                <Maximize2 className="h-3.5 w-3.5" />
              </button>
              <button
                onClick={collapseAll}
                className="hidden sm:flex items-center gap-1 rounded-lg border border-slate-800 bg-slate-900 px-2.5 py-1.5 text-xs text-slate-400 hover:bg-slate-800 hover:text-white"
                title="Collapse All Weeks"
              >
                <Minimize2 className="h-3.5 w-3.5" />
              </button>
            </div>

          </div>
        </div>

        {/* MAIN DASHBOARD CONTENT */}
        <main className="max-w-7xl mx-auto py-8 px-4 sm:px-6 lg:px-8">
          
          {filteredMonths.map((month) => (
            <div key={month.id} className="mb-14">
              
              {/* MONTH BANNER HEADER */}
              <div className={cn(
                "relative overflow-hidden rounded-2xl border p-6 md:p-8 mb-8 backdrop-blur-md shadow-xl",
                month.bannerBorderClass
              )}>
                <div className="absolute inset-0 bg-slate-900/90" />
                <div className={cn("absolute -right-10 -bottom-10 h-64 w-64 rounded-full blur-3xl opacity-20", month.glowBgClass)} />
                
                <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
                  <div className="flex items-start gap-5">
                    <div className={cn("syne-font text-5xl md:text-6xl font-black opacity-30 leading-none", month.targetColorClass)}>
                      {month.num}
                    </div>
                    <div>
                      <div className={cn("inline-block rounded-full px-3 py-0.5 text-xs font-bold uppercase tracking-wider mb-2", month.badgeClass)}>
                        {month.goal}
                      </div>
                      <h2 className="text-2xl md:text-3xl font-extrabold text-white tracking-tight">
                        {month.title}
                      </h2>
                      <p className="mt-1 text-sm italic text-slate-400">"{month.subtitle}"</p>
                    </div>
                  </div>
                </div>
              </div>

              {/* WEEKS GRID / ACCORDIONS */}
              <div className="space-y-4">
                {month.weeks.map(weekId => {
                  const weekData = PLAN_DATA[weekId];
                  const wProgress = getProgress([weekId]);
                  const isOpen = !!openWeeks[weekId];
                  const isAllDone = wProgress.total > 0 && wProgress.done === wProgress.total;

                  // Filter tasks inside categories if searchQuery or status filter active
                  const processedCategories = weekData.categories.map((cat: any) => {
                    const filteredTasks = cat.tasks.filter((t: any) => {
                      const matchesSearch = !searchQuery || 
                        t.text.toLowerCase().includes(searchQuery.toLowerCase()) || 
                        (t.note && t.note.toLowerCase().includes(searchQuery.toLowerCase())) ||
                        cat.name.toLowerCase().includes(searchQuery.toLowerCase());
                      
                      const isDone = !!tasks[t.id];
                      const matchesStatus = filterStatus === "all" || 
                        (filterStatus === "completed" && isDone) ||
                        (filterStatus === "pending" && !isDone);

                      return matchesSearch && matchesStatus;
                    });
                    return { ...cat, tasks: filteredTasks };
                  }).filter((cat: any) => cat.tasks.length > 0);

                  // If search filter yields 0 tasks in this week and user is searching, hide week
                  if ((searchQuery || filterStatus !== "all") && processedCategories.length === 0) {
                    return null;
                  }

                  return (
                    <div 
                      key={weekId}
                      className={cn(
                        "overflow-hidden rounded-2xl border transition-all duration-200 shadow-md",
                        isOpen ? "border-slate-700/80 bg-slate-900/90" : "border-slate-800/80 bg-slate-900/50 hover:border-slate-700/60 hover:bg-slate-900/70"
                      )}
                    >
                      {/* WEEK HEADER TILE */}
                      <div 
                        onClick={() => toggleWeek(weekId)}
                        className="flex cursor-pointer select-none items-center justify-between gap-4 p-4 sm:p-5 transition-colors"
                      >
                        <div className="flex items-center gap-3.5 min-w-0">
                          <span className={cn(
                            "flex-shrink-0 rounded-lg px-2.5 py-1 text-xs font-black uppercase tracking-wider",
                            month.badgeClass
                          )}>
                            {weekData.badge}
                          </span>
                          <h3 className="text-base sm:text-lg font-bold text-white truncate">
                            {weekData.title}
                          </h3>
                        </div>

                        <div className="flex items-center gap-3 flex-shrink-0">
                          {/* PROGRESS COUNTER PILL */}
                          <div className={cn(
                            "flex items-center gap-1.5 rounded-full border px-3 py-1 text-xs font-bold transition-all",
                            isAllDone
                              ? "border-emerald-500/40 bg-emerald-500/20 text-emerald-400"
                              : "border-slate-800 bg-slate-800/80 text-slate-300"
                          )}>
                            {isAllDone && <CheckCircle2 className="h-3.5 w-3.5 text-emerald-400" />}
                            <span>{wProgress.done} / {wProgress.total}</span>
                          </div>

                          {/* CHEVRON TOGGLE */}
                          <div className={cn(
                            "rounded-full p-1 text-slate-400 transition-transform duration-200",
                            isOpen && "rotate-180 text-white"
                          )}>
                            <ChevronDown className="h-5 w-5" />
                          </div>
                        </div>
                      </div>

                      {/* WEEK CONTENT BODY */}
                      {isOpen && (
                        <div className="border-t border-slate-800/80 p-4 sm:p-6 space-y-6 bg-slate-950/40">
                          
                          {/* CATEGORIES GRID */}
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            {processedCategories.map((cat: any, cIdx: number) => (
                              <div 
                                key={cIdx} 
                                className="rounded-xl border border-slate-800/80 bg-slate-900/60 p-4 backdrop-blur-sm"
                              >
                                {/* CATEGORY TITLE BAR */}
                                <div className="flex items-center gap-2 mb-3 pb-2 border-b border-slate-800/80">
                                  <span className="h-2 w-2 rounded-full flex-shrink-0" style={{ backgroundColor: cat.color }} />
                                  <h4 className="text-xs font-extrabold uppercase tracking-wider text-slate-300">
                                    {cat.name}
                                  </h4>
                                </div>

                                {/* TASKS LIST */}
                                <div className="space-y-2">
                                  {cat.tasks.map((task: any) => {
                                    const isCompleted = !!tasks[task.id];
                                    return (
                                      <div 
                                        key={task.id}
                                        onClick={() => toggleTask(task.id)}
                                        className={cn(
                                          "group flex cursor-pointer items-start gap-3 rounded-lg p-2.5 transition-all duration-150 border",
                                          isCompleted 
                                            ? "border-transparent bg-slate-950/40 opacity-60" 
                                            : "border-slate-800/50 bg-slate-900/80 hover:border-slate-700 hover:bg-slate-800/60"
                                        )}
                                      >
                                        {/* CHECKBOX */}
                                        <div className="mt-0.5 flex-shrink-0">
                                          {isCompleted ? (
                                            <div className="flex h-4 w-4 items-center justify-center rounded bg-emerald-500 text-slate-950 shadow-sm shadow-emerald-500/30">
                                              <Check className="h-3 w-3 stroke-[3]" />
                                            </div>
                                          ) : (
                                            <div className="h-4 w-4 rounded border-2 border-slate-600 group-hover:border-emerald-400 transition-colors" />
                                          )}
                                        </div>

                                        {/* TASK CONTENT */}
                                        <div className="min-w-0 flex-1">
                                          <p className={cn(
                                            "text-xs sm:text-sm leading-relaxed transition-colors",
                                            isCompleted ? "text-slate-500 line-through" : "text-slate-200 font-medium"
                                          )}>
                                            {task.text}
                                          </p>
                                          {task.note && (
                                            <span className="mt-1 inline-block rounded bg-slate-800/90 px-2 py-0.5 text-[11px] italic text-emerald-400/90">
                                              💡 {task.note}
                                            </span>
                                          )}
                                        </div>
                                      </div>
                                    );
                                  })}
                                </div>
                              </div>
                            ))}
                          </div>

                          {/* DELIVERABLES CALLOUT CARD */}
                          {weekData.deliverables && (
                            <div className="rounded-xl border border-emerald-500/30 bg-emerald-950/20 p-4 sm:p-5">
                              <div className="flex items-center gap-2 mb-3">
                                <Award className="h-4 w-4 text-emerald-400" />
                                <h4 className="text-xs font-extrabold uppercase tracking-wider text-emerald-400">
                                  {weekData.badge} Key Deliverables
                                </h4>
                              </div>
                              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                                {weekData.deliverables.map((del: string, dIdx: number) => (
                                  <div key={dIdx} className="flex items-center gap-2.5 text-xs text-slate-300">
                                    <div className="h-1.5 w-1.5 rounded-full bg-emerald-400 flex-shrink-0" />
                                    <span>{del}</span>
                                  </div>
                                ))}
                              </div>
                            </div>
                          )}

                        </div>
                      )}
                    </div>
                  );
                })}
              </div>

              {/* MONTH END TARGETS */}
              {month.targets && (
                <div className="mt-6 rounded-2xl border border-slate-800 bg-slate-900/60 p-6 backdrop-blur-md">
                  <div className="flex items-center gap-2 mb-4">
                    <Target className="h-4 w-4 text-slate-400" />
                    <h3 className="text-xs font-extrabold uppercase tracking-wider text-slate-400">
                      Month {month.id.replace('m', '')} Target Key Performance Indicators (KPIs)
                    </h3>
                  </div>
                  <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3">
                    {month.targets.map((t, tIdx) => (
                      <div key={tIdx} className="rounded-xl border border-slate-800 bg-slate-950/60 p-3.5 text-center">
                        <div className="text-[11px] font-medium uppercase tracking-wider text-slate-400 mb-1">
                          {t.metric}
                        </div>
                        <div className={cn("text-base sm:text-lg font-black", month.targetColorClass)}>
                          {t.value}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

            </div>
          ))}

        </main>
      </div>
    </div>
  );
}

// -------------------------------------------------------------
// DATA DEFINITIONS
// -------------------------------------------------------------

const MONTHS = [
  {
    id: "m1",
    num: "01",
    title: "Build The Foundation",
    subtitle: "You can't market on a broken base",
    goal: "Weeks 1–4 · Setup Everything From Scratch",
    bannerBorderClass: "border-cyan-500/30 bg-gradient-to-r from-cyan-950/40 via-slate-900 to-slate-900",
    glowBgClass: "bg-cyan-500",
    badgeClass: "bg-cyan-500/20 text-cyan-300 border border-cyan-500/30",
    targetColorClass: "text-cyan-400",
    weeks: ["w1", "w2", "w3", "w4"],
    targets: [
      { metric: "Social Followers", value: "500–1,000" },
      { metric: "Email Subscribers", value: "100–200" },
      { metric: "Website Visitors", value: "500–1,000" },
      { metric: "Warm Ad Audience", value: "500–1,000" },
      { metric: "Product Pages", value: "Top 5 Complete" },
    ]
  },
  {
    id: "m2",
    num: "02",
    title: "Grow the Audience and Warm Leads",
    subtitle: "Turn strangers into people who know, like, and trust you",
    goal: "Weeks 5–8 · Nurture & Build Community",
    bannerBorderClass: "border-emerald-500/30 bg-gradient-to-r from-emerald-950/40 via-slate-900 to-slate-900",
    glowBgClass: "bg-emerald-500",
    badgeClass: "bg-emerald-500/20 text-emerald-300 border border-emerald-500/30",
    targetColorClass: "text-emerald-400",
    weeks: ["w5", "w6", "w7", "w8"],
    targets: [
      { metric: "Social Followers", value: "1,500–3,000" },
      { metric: "Email Subscribers", value: "300–500" },
      { metric: "Facebook Group", value: "100–300" },
      { metric: "Ad Conversions", value: "10–20 sales" },
      { metric: "Monthly Revenue", value: "$1,500–$3,000" },
    ]
  },
  {
    id: "m3",
    num: "03",
    title: "Drive Conversions and Scale What Works",
    subtitle: "Turn warm audiences into buyers and buyers into repeat customers",
    goal: "Weeks 9–12 · Conversion & Bottom Funnel Scaling",
    bannerBorderClass: "border-amber-500/30 bg-gradient-to-r from-amber-950/40 via-slate-900 to-slate-900",
    glowBgClass: "bg-amber-500",
    badgeClass: "bg-amber-500/20 text-amber-300 border border-amber-500/30",
    targetColorClass: "text-amber-400",
    weeks: ["w9", "w10", "w11", "w12"],
    targets: [
      { metric: "Social Followers", value: "3,000–6,000" },
      { metric: "Email Subscribers", value: "500–1,000" },
      { metric: "Website Traffic", value: "3,000–6,000" },
      { metric: "Conversion Rate", value: "1.5–3%" },
      { metric: "Monthly Revenue", value: "$3,000–$6,000" },
      { metric: "Ad ROAS", value: "3x–5x" },
    ]
  }
];

const PLAN_DATA: Record<string, any> = {
  w1: {
    badge: "Week 1",
    title: "Audit and Setup Everything",
    categories: [
      {
        name: "Website and E-Commerce", color: "#38bdf8",
        tasks: [
          { id: "w1-c1-t1", text: "Install Microsoft Clarity for heatmaps and session recordings on the store", note: "Free tool — go to clarity.microsoft.com" },
          { id: "w1-c1-t2", text: "Set up Google Analytics 4 with proper e-commerce tracking" },
          { id: "w1-c1-t3", text: "Install Facebook Pixel and configure conversion events — add to cart, initiate checkout, purchase" },
          { id: "w1-c1-t4", text: "Audit all WooCommerce product pages — identify which ones have weak copy, missing images, or no CTA" },
          { id: "w1-c1-t5", text: "Check checkout flow — count steps to purchase and identify friction points" },
          { id: "w1-c1-t6", text: "Confirm Youngevity affiliate links are tracking properly" }
        ]
      },
      {
        name: "Social Media Setup", color: "#c084fc",
        tasks: [
          { id: "w1-c2-t1", text: "Audit existing Facebook and Instagram profiles — photo, bio, links, post history" },
          { id: "w1-c2-t2", text: "Create or optimize profiles on Facebook, Instagram, and TikTok" },
          { id: "w1-c2-t3", text: "Write clear consistent bio for all platforms that communicates exactly what the brand does" },
          { id: "w1-c2-t4", text: "Set up Linktree or link-in-bio tool pointing to shop, blog, and email signup" }
        ]
      },
      {
        name: "Email Marketing Setup", color: "#fb923c",
        tasks: [
          { id: "w1-c3-t1", text: "Set up Klaviyo or Mailchimp account — Klaviyo recommended for e-commerce" },
          { id: "w1-c3-t2", text: "Create email opt-in form and embed on homepage and blog pages" },
          { id: "w1-c3-t3", text: "Build lead magnet PDF — '7 Day Healthy Start Guide' or 'Top 10 Natural Remedies'", note: "Design in Canva — keep it clean and branded" },
          { id: "w1-c3-t4", text: "Build 3-email welcome sequence: Email 1 — deliver lead magnet" },
          { id: "w1-c3-t5", text: "Build Email 2 — brand story and what makes Lifestyle Medicine Gateway different" },
          { id: "w1-c3-t6", text: "Build Email 3 — introduce the shop with 10% off first purchase code" }
        ]
      },
      {
        name: "SEO Foundation", color: "#4ade80",
        tasks: [
          { id: "w1-c4-t1", text: "Install Yoast SEO on WordPress if not already installed" },
          { id: "w1-c4-t2", text: "Do keyword research for Australian health and wellness market using Google Keyword Planner or Ubersuggest" },
          { id: "w1-c4-t3", text: "Create keyword map — assign target keywords to existing blog posts and product pages" },
          { id: "w1-c4-t4", text: "Optimize top 5 most visited pages — meta titles, descriptions, header tags, internal links" }
        ]
      }
    ],
    deliverables: [
      "All tracking tools installed and verified",
      "Social profiles optimized across all platforms",
      "Email system live with welcome sequence ready",
      "Keyword map created for SEO strategy"
    ]
  },
  w2: {
    badge: "Week 2",
    title: "Build the Content Engine",
    categories: [
      {
        name: "Content Strategy", color: "#38bdf8",
        tasks: [
          { id: "w2-c1-t1", text: "Define 5 content pillars: Natural Remedies, Healthy Eating, Mental Wellness, Movement and Body, Product Education" },
          { id: "w2-c1-t2", text: "Create monthly content calendar — 4 to 6 social posts per week, 3 to 4 reels per week, 2 blogs per week, 1 email per week" },
          { id: "w2-c1-t3", text: "Create first 2 weeks of social media content in advance and schedule using Metricool or Buffer" }
        ]
      },
      {
        name: "Reels and Video", color: "#4ade80",
        tasks: [
          { id: "w2-c2-t1", text: "Film or edit Reel 1: '3 natural remedies for anxiety you can start today'" },
          { id: "w2-c2-t2", text: "Film or edit Reel 2: 'Why Celtic sea salt is better than regular salt'" },
          { id: "w2-c2-t3", text: "Film or edit Reel 3: 'What lifestyle medicine actually means'" },
          { id: "w2-c2-t4", text: "Apply reel formula to all videos: Hook (0–3s) → Value (3–25s) → CTA (last 3s)" }
        ]
      },
      {
        name: "Graphic Design", color: "#fb923c",
        tasks: [
          { id: "w2-c3-t1", text: "Design lead magnet PDF in Canva — clean, branded, and valuable" },
          { id: "w2-c3-t2", text: "Create branded Canva templates for social posts — static images and story templates" },
          { id: "w2-c3-t3", text: "Design 5 static social media posts for Week 3 launch" }
        ]
      },
      {
        name: "Blog Writing", color: "#c084fc",
        tasks: [
          { id: "w2-c4-t1", text: "Draft first SEO blog: 'Best Natural Supplements for Anxiety in Australia 2026' — link to relevant products", note: "Target 800 to 1,500 words with one primary keyword" },
          { id: "w2-c4-t2", text: "Draft second SEO blog: 'What Is Lifestyle Medicine and Why It's Changing Healthcare in Australia'" }
        ]
      }
    ],
    deliverables: [
      "Full Month 1 content calendar finalized",
      "First 2 weeks of content created and scheduled",
      "Lead magnet PDF designed and ready",
      "2 SEO blog posts drafted"
    ]
  },
  w3: {
    badge: "Week 3",
    title: "Launch Organic Social and Blog",
    categories: [
      {
        name: "Publishing", color: "#38bdf8",
        tasks: [
          { id: "w3-c1-t1", text: "Publish Week 3 social posts daily — minimum 4 posts this week" },
          { id: "w3-c1-t2", text: "Publish 3 reels this week — hook, value, CTA format strictly followed" },
          { id: "w3-c1-t3", text: "Publish Blog 1: 'Best Natural Supplements for Anxiety in Australia 2026'" },
          { id: "w3-c1-t4", text: "Publish Blog 2: 'What Is Lifestyle Medicine and Why It's Changing Healthcare in Australia'" },
          { id: "w3-c1-t5", text: "Send first email newsletter to current subscriber list" }
        ]
      },
      {
        name: "Reel Production This Week", color: "#4ade80",
        tasks: [
          { id: "w3-c2-t1", text: "Film or edit Reel 4: 'Morning routine for better gut health'" },
          { id: "w3-c2-t2", text: "Film or edit Reel 5: '5 signs your body needs more magnesium'" },
          { id: "w3-c2-t3", text: "Film or edit Reel 6: 'Castor oil — what nobody tells you'" },
          { id: "w3-c2-t4", text: "Repurpose all reels for TikTok — upload same content with TikTok text overlay" }
        ]
      },
      {
        name: "Blog SEO Checklist for Every Post", color: "#fb923c",
        tasks: [
          { id: "w3-c3-t1", text: "Each blog is 800 to 1,500 words targeting one primary keyword" },
          { id: "w3-c3-t2", text: "Each blog includes 2 to 3 internal links to products or other blogs" },
          { id: "w3-c3-t3", text: "Each blog ends with a CTA — shop or subscribe to email list" },
          { id: "w3-c3-t4", text: "Submit updated sitemap to Google Search Console after each new post" }
        ]
      }
    ],
    deliverables: [
      "Daily posting live on Instagram and Facebook",
      "2 blogs published and indexed",
      "First email newsletter sent",
      "TikTok account active with first content"
    ]
  },
  w4: {
    badge: "Week 4",
    title: "Review, Optimize, and Ads Foundation",
    categories: [
      {
        name: "Performance Review", color: "#38bdf8",
        tasks: [
          { id: "w4-c1-t1", text: "Review which reels got the most views and saves in Weeks 1 to 3" },
          { id: "w4-c1-t2", text: "Review which social posts got the most engagement" },
          { id: "w4-c1-t3", text: "Check email open rates and click rates on welcome sequence — target 20 to 25% open rate" },
          { id: "w4-c1-t4", text: "Review Microsoft Clarity heatmaps — where are people clicking and dropping off on the store" }
        ]
      },
      {
        name: "Meta Ads — Awareness Setup Only", color: "#fb923c",
        tasks: [
          { id: "w4-c2-t1", text: "Create Page Like campaign to grow Facebook and Instagram following", note: "Goal is audience building NOT selling yet" },
          { id: "w4-c2-t2", text: "Boost top performing reel from Week 3 — budget $5 to $10 AUD per day" },
          { id: "w4-c2-t3", text: "Set up Video View campaign to build warm audience for Month 2 retargeting" },
          { id: "w4-c2-t4", text: "Verify Facebook Pixel is firing correctly on all key pages" }
        ]
      },
      {
        name: "Product Page Round 1", color: "#4ade80",
        tasks: [
          { id: "w4-c3-t1", text: "Rewrite product titles for top 5 products to include keywords" },
          { id: "w4-c3-t2", text: "Expand product descriptions — benefits not just features, add 'why buy this' section" },
          { id: "w4-c3-t3", text: "Add trust elements to product pages — money back guarantee, shipping info, organic badges" }
        ]
      }
    ]
  },
  w5: {
    badge: "Week 5",
    title: "Deepen Content and Introduce Lead Gen",
    categories: [
      {
        name: "Content Upgrade", color: "#4ade80",
        tasks: [
          { id: "w5-c1-t1", text: "Double down on reel formats that performed best in Month 1 — create 3 more of the winning format" },
          { id: "w5-c1-t2", text: "Stop posting content formats that got zero traction — cut them from calendar" },
          { id: "w5-c1-t3", text: "Create Carousel 1: '5 Signs Your Gut Health Needs Attention' — hook slide + 5 signs + product CTA" },
          { id: "w5-c1-t4", text: "Create Carousel 2: 'The Lifestyle Medicine Daily Checklist' — highly shareable format" },
          { id: "w5-c1-t5", text: "Create Carousel 3: '10 Foods That Fight Inflammation' — educational and shareable" }
        ]
      },
      {
        name: "Lead Magnet Campaign", color: "#38bdf8",
        tasks: [
          { id: "w5-c2-t1", text: "Launch Meta Lead Gen Ad — target Australian women 30 to 65 interested in health and natural medicine", note: "Budget: $10 to $15 AUD per day — target CPL: $2 to $5 AUD" },
          { id: "w5-c2-t2", text: "Create ad creative — short video reel previewing the lead magnet and its benefits" },
          { id: "w5-c2-t3", text: "Monitor CPL daily — if above $8 AUD pause and test new creative" }
        ]
      },
      {
        name: "Product Content", color: "#fb923c",
        tasks: [
          { id: "w5-c3-t1", text: "Create 'What's in my morning wellness routine' post featuring store products" },
          { id: "w5-c3-t2", text: "Create 'Honest review' style content for one specific product — castor oil or Celtic sea salt" },
          { id: "w5-c3-t3", text: "Create 'How I use [product] every day' lifestyle content for best selling item" }
        ]
      }
    ]
  },
  w6: {
    badge: "Week 6",
    title: "Email Nurture and Community Building",
    categories: [
      {
        name: "Email Nurture Sequence — Emails 4 to 10", color: "#4ade80",
        tasks: [
          { id: "w6-c1-t1", text: "Write Email 4: 'The Truth About Chronic Disease and What Lifestyle Medicine Says' — educational, builds authority" },
          { id: "w6-c1-t2", text: "Write Email 5: 'Our Top 5 Products for Gut Health' — soft product introduction" },
          { id: "w6-c1-t3", text: "Write Email 6: 'Customer Story — How Sarah Changed Her Health' — social proof" },
          { id: "w6-c1-t4", text: "Write Email 7: 'This Week's Recipe — Anti-Inflammatory Turmeric Golden Milk' — links to blog" },
          { id: "w6-c1-t5", text: "Write Email 8: 'Your Exclusive Offer — 15% Off Your First Order' — first direct conversion push" },
          { id: "w6-c1-t6", text: "Write Email 9: 'Did You See This?' — reminder for non-openers of Email 8" },
          { id: "w6-c1-t7", text: "Write Email 10: 'Last Chance — Your Discount Expires Tomorrow' — urgency close" },
          { id: "w6-c1-t8", text: "Set up all emails as automation sequence in Klaviyo or Mailchimp — test all flows" }
        ]
      },
      {
        name: "Facebook Community", color: "#c084fc",
        tasks: [
          { id: "w6-c2-t1", text: "Create Facebook Group: 'Lifestyle Medicine Community Australia'" },
          { id: "w6-c2-t2", text: "Invite all email subscribers to join the group via email broadcast" },
          { id: "w6-c2-t3", text: "Post daily inside the group — questions, polls, tips, product highlights" },
          { id: "w6-c2-t4", text: "Set up group rules and welcome post pinned at the top" }
        ]
      }
    ]
  },
  w7: {
    badge: "Week 7",
    title: "Launch Retargeting Ads and SEO Push",
    categories: [
      {
        name: "Meta Retargeting Campaigns", color: "#fb923c",
        tasks: [
          { id: "w7-c1-t1", text: "Launch Retargeting Campaign 1 — Website Visitors: target last 30 days no purchase, 10% discount code ad — $10 AUD/day" },
          { id: "w7-c1-t2", text: "Launch Retargeting Campaign 2 — Video Viewers: target 50% video watches last 30 days, testimonial ad — $10 AUD/day" },
          { id: "w7-c1-t3", text: "Launch Retargeting Campaign 3 — Email List Custom Audience: upload subscriber list, product ads — $5 AUD/day" },
          { id: "w7-c1-t4", text: "Monitor retargeting CPL and ROAS daily — first 3 days learning phase, do not touch" }
        ]
      },
      {
        name: "Google SEO Push", color: "#4ade80",
        tasks: [
          { id: "w7-c2-t1", text: "Publish Blog 3: 'Best Organic Supplements to Buy Online in Australia' — high commercial intent keyword" },
          { id: "w7-c2-t2", text: "Publish Blog 4: 'Where to Buy Celtic Sea Salt in Australia' — product specific search intent" },
          { id: "w7-c2-t3", text: "Add internal links from every new blog to at least 2 store product pages" },
          { id: "w7-c2-t4", text: "Submit updated sitemap to Google Search Console" },
          { id: "w7-c2-t5", text: "Begin outreach for 2 to 3 backlinks from Australian health websites or directories" }
        ]
      }
    ]
  },
  w8: {
    badge: "Week 8",
    title: "Vendor Marketing and Affiliate Push",
    categories: [
      {
        name: "Vendor Recruitment", color: "#4ade80",
        tasks: [
          { id: "w8-c1-t1", text: "Improve the existing 'Sell With Us' page — clear benefits, process, and CTA for vendors" },
          { id: "w8-c1-t2", text: "Write blog: 'Why Selling on Lifestyle Medicine Gateway Makes Sense for Australian Health Brands'" },
          { id: "w8-c1-t3", text: "Create 3 to 5 social posts targeting small health product businesses to become vendors" },
          { id: "w8-c1-t4", text: "Run small Meta Ad targeting small business owners in Australian health and wellness space — $5 to $10 AUD/day" }
        ]
      },
      {
        name: "Youngevity and Young Living Affiliate Push", color: "#c084fc",
        tasks: [
          { id: "w8-c2-t1", text: "Create dedicated content around Youngevity products with 20% off offer featured prominently" },
          { id: "w8-c2-t2", text: "Write blog: 'How to Get 20% Off Premium Health Supplements in Australia'" },
          { id: "w8-c2-t3", text: "Feature Youngevity products in the weekly email newsletter with clear affiliate link" }
        ]
      }
    ]
  },
  w9: {
    badge: "Week 9",
    title: "Full Conversion Campaign Launch",
    categories: [
      {
        name: "Meta Conversion Campaigns", color: "#fb923c",
        tasks: [
          { id: "w9-c1-t1", text: "Launch Campaign 1 — Cold Audience Conversion: Australian women 30–65, health interests, lookalike audience — $20 to $30 AUD/day", note: "Landing page: direct to best selling low price point product — castor oil or Celtic sea salt" },
          { id: "w9-c1-t2", text: "Launch Campaign 2 — Cart Abandonment Retargeting: added to cart no purchase last 14 days, 10% discount code — $10 AUD/day" },
          { id: "w9-c1-t3", text: "Launch Campaign 3 — Past Purchaser Upsell: custom audience of past buyers, 'You loved X — try these next' ad — $5 AUD/day" },
          { id: "w9-c1-t4", text: "Do not touch campaigns for first 3 days — let Meta learning phase complete" },
          { id: "w9-c1-t5", text: "After Day 7 review ROAS — if above 3x increase budget by 20%, if below 2x review creative and audience" }
        ]
      },
      {
        name: "Abandoned Cart Email Sequence", color: "#4ade80",
        tasks: [
          { id: "w9-c2-t1", text: "Set up Cart Email 1: 1 hour after abandonment — 'Did something go wrong? Your cart is waiting'" },
          { id: "w9-c2-t2", text: "Set up Cart Email 2: 24 hours after — 'Still thinking about it? Here's 10% off'" },
          { id: "w9-c2-t3", text: "Set up Cart Email 3: 48 hours after — 'Last chance — your discount expires tonight'" },
          { id: "w9-c2-t4", text: "Test all 3 cart emails trigger correctly using a test purchase flow" }
        ]
      }
    ]
  },
  w10: {
    badge: "Week 10",
    title: "E-Commerce Conversion Rate Optimization",
    categories: [
      {
        name: "Product Page Round 2", color: "#fb923c",
        tasks: [
          { id: "w10-c1-t1", text: "Add customer reviews and ratings to every product page — number one conversion driver for health products" },
          { id: "w10-c1-t2", text: "Add FAQ section to each product page answering the most common customer objections" },
          { id: "w10-c1-t3", text: "Add urgency elements — 'Only 12 left in stock' or 'Order by Thursday for weekend delivery'" },
          { id: "w10-c1-t4", text: "Set up upsell and cross-sell product recommendations on all product pages" }
        ]
      },
      {
        name: "Checkout Optimization", color: "#38bdf8",
        tasks: [
          { id: "w10-c2-t1", text: "Reduce checkout to as few steps as possible — remove unnecessary fields" },
          { id: "w10-c2-t2", text: "Add trust badges to checkout page — secure payment, money back guarantee, Australian owned" },
          { id: "w10-c2-t3", text: "Add checkout progress bar showing how close the customer is to completing" },
          { id: "w10-c2-t4", text: "Add order bump at checkout — low cost complementary product for a few extra dollars" },
          { id: "w10-c2-t5", text: "Make return policy and shipping information visible at the checkout page" }
        ]
      },
      {
        name: "Data Analysis", color: "#4ade80",
        tasks: [
          { id: "w10-c3-t1", text: "Review Microsoft Clarity recordings — identify where people drop off before purchasing" },
          { id: "w10-c3-t2", text: "Check Google Analytics checkout funnel report — identify which step has the highest exit rate" },
          { id: "w10-c3-t3", text: "Fix the single biggest drop-off point identified from data — one change at a time" }
        ]
      }
    ]
  },
  w11: {
    badge: "Week 11",
    title: "Influencer Outreach and UGC Campaign",
    categories: [
      {
        name: "Micro Influencer Campaign", color: "#c084fc",
        tasks: [
          { id: "w11-c1-t1", text: "Identify 10 to 15 Australian health and wellness micro influencers on Instagram and TikTok — 5,000 to 50,000 followers" },
          { id: "w11-c1-t2", text: "Send outreach DM or email to top 10 influencers — offer free products in exchange for honest review reel" },
          { id: "w11-c1-t3", text: "Create unique discount code for each influencer to track actual sales driven" },
          { id: "w11-c1-t4", text: "Send product packages to confirmed influencers — include a personal note and clear brief" },
          { id: "w11-c1-t5", text: "Repost all influencer content to brand pages immediately when published" }
        ]
      },
      {
        name: "User Generated Content", color: "#fb923c",
        tasks: [
          { id: "w11-c2-t1", text: "Email existing customer list asking for a photo or video with their product and a branded hashtag" },
          { id: "w11-c2-t2", text: "Offer 10% discount on next order as thank you for UGC submission" },
          { id: "w11-c2-t3", text: "Feature UGC content on product pages — most trusted form of social proof for health products" },
          { id: "w11-c2-t4", text: "Repurpose UGC as paid ad creative — real customer content outperforms branded content in health niche" }
        ]
      }
    ]
  },
  w12: {
    badge: "Week 12",
    title: "Full Review, Report, and Plan Month 4",
    categories: [
      {
        name: "Social Media Review", color: "#fb923c",
        tasks: [
          { id: "w12-c1-t1", text: "Report follower growth Month 1 vs Month 3 — target 3,000 to 6,000 total" },
          { id: "w12-c1-t2", text: "Identify top 3 performing content formats and topics — double down on these in Month 4" },
          { id: "w12-c1-t3", text: "Report reach, impressions, and engagement rate trends across all platforms" }
        ]
      },
      {
        name: "Email and SEO Review", color: "#4ade80",
        tasks: [
          { id: "w12-c2-t1", text: "Report total email subscribers — target 500 to 1,000" },
          { id: "w12-c2-t2", text: "Report email open rate — target 30 to 35% and click through rate — target 3 to 5%" },
          { id: "w12-c2-t3", text: "Report revenue attributed to email sequence — which email drove the most purchases" },
          { id: "w12-c2-t4", text: "Report organic traffic growth and top performing blog posts by visits" },
          { id: "w12-c2-t5", text: "Report keyword ranking improvements from Google Search Console" }
        ]
      },
      {
        name: "Paid Ads and E-Commerce Review", color: "#38bdf8",
        tasks: [
          { id: "w12-c3-t1", text: "Report total ad spend and ROAS — target 3x to 5x by end of Month 3" },
          { id: "w12-c3-t2", text: "Report cost per purchase and cart abandonment recovery rate" },
          { id: "w12-c3-t3", text: "Report total revenue, conversion rate target 1.5 to 3%, average order value, and repeat purchase rate" },
          { id: "w12-c3-t4", text: "Prepare Month 4 strategy deck for client — what's working, what to scale, what to cut" }
        ]
      }
    ]
  }
};
