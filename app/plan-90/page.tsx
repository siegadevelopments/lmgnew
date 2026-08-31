"use client";

import { useEffect, useState, useMemo } from "react";
import Head from "next/head";
import { cn } from "@/lib/utils";
import { Loader2 } from "lucide-react";

export default function MarketingPlan90() {
  const [tasks, setTasks] = useState<Record<string, boolean>>({});
  const [openWeeks, setOpenWeeks] = useState<Record<string, boolean>>({ w1: true });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

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

  // Save state to DB whenever tasks change (debounced or directly)
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

  const resetAll = () => {
    if (!window.confirm("Reset all checkboxes? This cannot be undone.")) return;
    const newState = {};
    setTasks(newState);
    saveStateToDB(newState);
  };

  // Helper to calculate progress
  const getProgress = (weekIds: string[]) => {
    let total = 0;
    let done = 0;
    
    // We count tasks by matching taskId prefix
    Object.keys(PLAN_DATA).forEach(weekId => {
      if (weekIds.includes(weekId)) {
        PLAN_DATA[weekId].categories.forEach(cat => {
          cat.tasks.forEach(t => {
            total++;
            if (tasks[t.id]) done++;
          });
        });
      }
    });
    
    return { done, total, pct: total > 0 ? Math.round((done / total) * 100) : 0 };
  };

  const overall = getProgress(Object.keys(PLAN_DATA));
  const m1 = getProgress(["w1", "w2", "w3", "w4"]);
  const m2 = getProgress(["w5", "w6", "w7", "w8"]);
  const m3 = getProgress(["w9", "w10", "w11", "w12"]);

  if (loading) {
    return (
      <div className="flex h-screen w-full items-center justify-center bg-[#0d1117] text-white">
        <Loader2 className="h-8 w-8 animate-spin text-green-500" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#0d1117] text-[#e6edf3] font-sans">
      <Head>
        <meta name="robots" content="noindex, nofollow" />
      </Head>

      <style dangerouslySetInnerHTML={{ __html: `
        @import url('https://fonts.googleapis.com/css2?family=Syne:wght@400;600;700;800&family=DM+Sans:wght@300;400;500&display=swap');
        .syne-font { font-family: 'Syne', sans-serif; }
      `}} />

      {/* HEADER */}
      <div className="relative overflow-hidden border-b border-[#2a3441] bg-gradient-to-br from-[#0d1117] via-[#1a2332] to-[#0d1a12] px-6 pb-8 pt-10 text-center">
        <div className="absolute -left-1/2 -top-1/2 h-[200%] w-[200%] pointer-events-none" style={{
          background: "radial-gradient(ellipse at 30% 50%, rgba(88,166,255,0.06) 0%, transparent 50%), radial-gradient(ellipse at 70% 50%, rgba(63,185,80,0.06) 0%, transparent 50%)"
        }} />
        
        <div className="relative z-10 mx-auto max-w-3xl">
          <span className="syne-font mb-4 inline-block rounded-full border border-green-500/30 bg-green-500/15 px-4 py-1 text-[11px] font-semibold uppercase tracking-widest text-[#3fb950]">
            Full Funnel Strategy
          </span>
          <h1 className="syne-font mb-2 text-4xl font-extrabold leading-tight md:text-5xl" style={{
            background: "linear-gradient(135deg, #e6edf3 0%, #58a6ff 50%, #3fb950 100%)",
            WebkitBackgroundClip: "text",
            WebkitTextFillColor: "transparent",
            backgroundClip: "text"
          }}>
            90-Day Marketing Plan
          </h1>
          <p className="mb-7 text-sm text-[#8b949e]">Lifestyle Medicine Gateway — Australia | Starting From Scratch</p>

          <div className="mx-auto max-w-[600px] rounded-xl border border-[#2a3441] bg-[#161b22] p-5 text-left shadow-xl">
            <div className="mb-3 flex items-center justify-between">
              <span className="syne-font text-[13px] font-semibold uppercase tracking-wider text-[#8b949e]">Overall Progress</span>
              <div className="flex items-center gap-3">
                {saving && <Loader2 className="h-4 w-4 animate-spin text-green-500" />}
                <span className="syne-font text-2xl font-extrabold text-[#3fb950]">{overall.done} / {overall.total}</span>
              </div>
            </div>
            <div className="mb-4 h-2.5 overflow-hidden rounded-lg bg-[#2a3441]">
              <div 
                className="h-full rounded-lg bg-gradient-to-r from-[#58a6ff] to-[#3fb950] transition-all duration-500" 
                style={{ width: `${overall.pct}%` }} 
              />
            </div>
            <div className="grid grid-cols-3 gap-3">
              <div className="rounded-lg border border-blue-500/20 bg-blue-500/10 p-2.5 text-center">
                <span className="syne-font block text-xl font-extrabold text-[#58a6ff]">{m1.pct}%</span>
                <span className="text-[11px] uppercase tracking-wider text-[#8b949e]">Month 1</span>
              </div>
              <div className="rounded-lg border border-green-500/20 bg-green-500/10 p-2.5 text-center">
                <span className="syne-font block text-xl font-extrabold text-[#3fb950]">{m2.pct}%</span>
                <span className="text-[11px] uppercase tracking-wider text-[#8b949e]">Month 2</span>
              </div>
              <div className="rounded-lg border border-orange-500/20 bg-orange-500/10 p-2.5 text-center">
                <span className="syne-font block text-xl font-extrabold text-[#f0883e]">{m3.pct}%</span>
                <span className="text-[11px] uppercase tracking-wider text-[#8b949e]">Month 3</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* MAIN CONTAINER */}
      <div className="mx-auto max-w-[900px] p-4 md:p-8">
        
        {/* Render Months */}
        {MONTHS.map((month) => (
          <div key={month.id} className="mb-12">
            
            {/* Month Header */}
            <div className={cn(
              "relative mb-6 flex items-center gap-4 overflow-hidden rounded-xl border-l-4 p-5 md:p-6",
              month.colorClass
            )}>
              <div className="absolute inset-0 bg-gradient-to-br from-current to-transparent opacity-[0.06]" />
              <div className="syne-font flex-shrink-0 text-5xl font-extrabold opacity-40 leading-none">{month.num}</div>
              <div className="z-10 text-white">
                <h2 className="syne-font mb-1 text-xl font-extrabold text-[#e6edf3]">{month.title}</h2>
                <div className="text-[13px] italic opacity-80">"{month.subtitle}"</div>
                <div className="mt-1 text-xs text-[#8b949e]">{month.goal}</div>
              </div>
            </div>

            {/* Weeks */}
            {month.weeks.map(weekId => {
              const weekData = PLAN_DATA[weekId];
              const wProgress = getProgress([weekId]);
              const isOpen = !!openWeeks[weekId];
              const isAllDone = wProgress.total > 0 && wProgress.done === wProgress.total;

              return (
                <div key={weekId} className="mb-4 overflow-hidden rounded-xl border border-[#2a3441] bg-[#161b22]">
                  {/* Week Header */}
                  <div 
                    onClick={() => toggleWeek(weekId)}
                    className="flex cursor-pointer select-none items-center justify-between gap-3 p-4 transition-colors hover:bg-[#1c2330] md:p-5"
                  >
                    <div className="flex min-w-0 flex-1 items-center gap-3">
                      <span className={cn(
                        "syne-font flex-shrink-0 rounded-full px-2.5 py-1 text-[11px] font-bold uppercase tracking-wider",
                        month.badgeClass
                      )}>
                        {weekData.badge}
                      </span>
                      <span className="syne-font truncate text-sm font-bold text-[#e6edf3]">
                        {weekData.title}
                      </span>
                    </div>
                    <div className="flex flex-shrink-0 items-center gap-2">
                      <span className={cn(
                        "whitespace-nowrap rounded-full border border-[#2a3441] bg-[#1c2330] px-2.5 py-0.5 text-[11px] font-semibold text-[#8b949e]",
                        isAllDone && "border-green-500 bg-[#1a4a2a] text-green-500"
                      )}>
                        {wProgress.done} / {wProgress.total}
                      </span>
                      <span className={cn(
                        "text-[#6e7681] transition-transform duration-300",
                        isOpen && "rotate-180"
                      )}>
                        ▼
                      </span>
                    </div>
                  </div>

                  {/* Week Body */}
                  {isOpen && (
                    <div className="border-t border-[#2a3441] px-4 pb-5 md:px-5">
                      {weekData.categories.map((cat, cIdx) => (
                        <div key={cIdx} className="mt-4">
                          <div className="mb-2 flex items-center gap-2 border-b border-[#2a3441] pb-1.5">
                            <span className="h-1.5 w-1.5 flex-shrink-0 rounded-full" style={{ background: cat.color }} />
                            <span className="syne-font text-[11px] font-bold uppercase tracking-wider text-[#6e7681]">
                              {cat.name}
                            </span>
                          </div>
                          
                          <div>
                            {cat.tasks.map(task => {
                              const isCompleted = !!tasks[task.id];
                              return (
                                <div 
                                  key={task.id}
                                  onClick={() => toggleTask(task.id)}
                                  className={cn(
                                    "mb-1 flex cursor-pointer items-start gap-3 rounded-lg p-2.5 transition-colors hover:bg-[#1c2330]",
                                    isCompleted && "opacity-50"
                                  )}
                                >
                                  <div className={cn(
                                    "mt-0.5 flex h-4 w-4 flex-shrink-0 items-center justify-center rounded border-2 border-[#2a3441] transition-colors",
                                    isCompleted && "border-green-500 bg-green-500"
                                  )}>
                                    {isCompleted && <span className="text-[10px] font-black text-[#0d1117]">✓</span>}
                                  </div>
                                  <div>
                                    <div className={cn(
                                      "text-[13.5px] leading-relaxed transition-colors",
                                      isCompleted ? "text-[#6e7681] line-through" : "text-[#e6edf3]"
                                    )}>
                                      {task.text}
                                    </div>
                                    {task.note && (
                                      <div className="mt-0.5 text-[11.5px] italic text-[#8b949e]">
                                        {task.note}
                                      </div>
                                    )}
                                  </div>
                                </div>
                              );
                            })}
                          </div>
                        </div>
                      ))}

                      {/* Deliverables */}
                      {weekData.deliverables && (
                        <div className="mt-4 rounded-lg border border-[#2a3441] bg-[#1c2330] p-3.5 md:p-4">
                          <div className="syne-font mb-2 text-[11px] font-bold uppercase tracking-wider text-[#8b949e]">
                            ✅ {weekData.badge} Deliverables
                          </div>
                          {weekData.deliverables.map((del, dIdx) => (
                            <div key={dIdx} className="flex items-center gap-2 py-0.5 text-[12.5px] text-[#8b949e]">
                              <span className="flex-shrink-0 text-green-500">→</span>
                              {del}
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  )}
                </div>
              );
            })}

            {/* End of Month Targets */}
            {month.targets && (
              <div className="mt-6 grid grid-cols-2 gap-2.5 rounded-xl border border-[#2a3441] bg-[#1c2330] p-4 sm:grid-cols-3 md:gap-3 md:p-5">
                <div className="syne-font col-span-full mb-1 text-[12px] font-bold uppercase tracking-wider text-[#8b949e]">
                  🎯 Month {month.id.replace('m', '')} End Targets
                </div>
                {month.targets.map((t, tIdx) => (
                  <div key={tIdx} className="rounded-lg border border-[#2a3441] bg-[#161b22] p-3 text-center">
                    <div className="mb-1 text-[11px] uppercase tracking-wider text-[#6e7681]">{t.metric}</div>
                    <div className={cn("syne-font text-[15px] font-bold", month.targetColorClass)}>{t.value}</div>
                  </div>
                ))}
              </div>
            )}
          </div>
        ))}

        <button 
          onClick={resetAll}
          className="syne-font mx-auto mb-10 block rounded-lg border border-[#2a3441] bg-transparent px-6 py-2.5 text-[12px] font-semibold uppercase tracking-wider text-[#8b949e] transition-colors hover:border-red-500 hover:text-red-500"
        >
          Reset All Checkboxes
        </button>

      </div>
    </div>
  );
}

// -------------------------------------------------------------
// DATA DEFINITIONS (Extracted from the raw HTML structure)
// -------------------------------------------------------------

const MONTHS = [
  {
    id: "m1",
    num: "01",
    title: "Build The Foundation",
    subtitle: "You can't market on a broken base",
    goal: "Weeks 1–4 · Awareness · Setup Everything From Scratch",
    colorClass: "bg-[#1a3a4a] border-[#58a6ff] text-[#58a6ff]",
    badgeClass: "bg-blue-500/15 text-blue-500",
    targetColorClass: "text-[#58a6ff]",
    weeks: ["w1", "w2", "w3", "w4"],
    targets: [
      { metric: "Social Followers", value: "500–1,000" },
      { metric: "Email Subscribers", value: "100–200" },
      { metric: "Website Visitors", value: "500–1,000" },
      { metric: "Warm Ad Audience", value: "500–1,000" },
      { metric: "Product Pages Done", value: "Top 5" },
    ]
  },
  {
    id: "m2",
    num: "02",
    title: "Grow the Audience and Warm the Leads",
    subtitle: "Turn strangers into people who know, like, and trust you",
    goal: "Weeks 5–8 · Engagement · Nurture and Build",
    colorClass: "bg-[#1a3a2a] border-[#3fb950] text-[#3fb950]",
    badgeClass: "bg-green-500/15 text-green-500",
    targetColorClass: "text-[#3fb950]",
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
    goal: "Weeks 9–12 · Conversion · Bottom of Funnel",
    colorClass: "bg-[#3a2a1a] border-[#f0883e] text-[#f0883e]",
    badgeClass: "bg-orange-500/15 text-orange-500",
    targetColorClass: "text-[#f0883e]",
    weeks: ["w9", "w10", "w11", "w12"],
    targets: [
      { metric: "Social Followers", value: "3,000–6,000" },
      { metric: "Email Subscribers", value: "500–1,000" },
      { metric: "Website Traffic", value: "3,000–6,000" },
      { metric: "Conv. Rate", value: "1.5–3%" },
      { metric: "Monthly Revenue", value: "$3,000–$6,000" },
      { metric: "ROAS", value: "3x–5x" },
    ]
  }
];

const PLAN_DATA: Record<string, any> = {
  w1: {
    badge: "Week 1",
    title: "Audit and Setup Everything",
    categories: [
      {
        name: "Website and E-Commerce", color: "#58a6ff",
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
        name: "Social Media Setup", color: "#bc8cff",
        tasks: [
          { id: "w1-c2-t1", text: "Audit existing Facebook and Instagram profiles — photo, bio, links, post history" },
          { id: "w1-c2-t2", text: "Create or optimize profiles on Facebook, Instagram, and TikTok" },
          { id: "w1-c2-t3", text: "Write clear consistent bio for all platforms that communicates exactly what the brand does" },
          { id: "w1-c2-t4", text: "Set up Linktree or link-in-bio tool pointing to shop, blog, and email signup" }
        ]
      },
      {
        name: "Email Marketing Setup", color: "#f0883e",
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
        name: "SEO Foundation", color: "#3fb950",
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
        name: "Content Strategy", color: "#58a6ff",
        tasks: [
          { id: "w2-c1-t1", text: "Define 5 content pillars: Natural Remedies, Healthy Eating, Mental Wellness, Movement and Body, Product Education" },
          { id: "w2-c1-t2", text: "Create monthly content calendar — 4 to 6 social posts per week, 3 to 4 reels per week, 2 blogs per week, 1 email per week" },
          { id: "w2-c1-t3", text: "Create first 2 weeks of social media content in advance and schedule using Metricool or Buffer" }
        ]
      },
      {
        name: "Reels and Video", color: "#3fb950",
        tasks: [
          { id: "w2-c2-t1", text: "Film or edit Reel 1: '3 natural remedies for anxiety you can start today'" },
          { id: "w2-c2-t2", text: "Film or edit Reel 2: 'Why Celtic sea salt is better than regular salt'" },
          { id: "w2-c2-t3", text: "Film or edit Reel 3: 'What lifestyle medicine actually means'" },
          { id: "w2-c2-t4", text: "Apply reel formula to all videos: Hook (0–3s) → Value (3–25s) → CTA (last 3s)" }
        ]
      },
      {
        name: "Graphic Design", color: "#f0883e",
        tasks: [
          { id: "w2-c3-t1", text: "Design lead magnet PDF in Canva — clean, branded, and valuable" },
          { id: "w2-c3-t2", text: "Create branded Canva templates for social posts — static images and story templates" },
          { id: "w2-c3-t3", text: "Design 5 static social media posts for Week 3 launch" }
        ]
      },
      {
        name: "Blog Writing", color: "#bc8cff",
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
        name: "Publishing", color: "#58a6ff",
        tasks: [
          { id: "w3-c1-t1", text: "Publish Week 3 social posts daily — minimum 4 posts this week" },
          { id: "w3-c1-t2", text: "Publish 3 reels this week — hook, value, CTA format strictly followed" },
          { id: "w3-c1-t3", text: "Publish Blog 1: 'Best Natural Supplements for Anxiety in Australia 2026'" },
          { id: "w3-c1-t4", text: "Publish Blog 2: 'What Is Lifestyle Medicine and Why It's Changing Healthcare in Australia'" },
          { id: "w3-c1-t5", text: "Send first email newsletter to current subscriber list" }
        ]
      },
      {
        name: "Reel Production This Week", color: "#3fb950",
        tasks: [
          { id: "w3-c2-t1", text: "Film or edit Reel 4: 'Morning routine for better gut health'" },
          { id: "w3-c2-t2", text: "Film or edit Reel 5: '5 signs your body needs more magnesium'" },
          { id: "w3-c2-t3", text: "Film or edit Reel 6: 'Castor oil — what nobody tells you'" },
          { id: "w3-c2-t4", text: "Repurpose all reels for TikTok — upload same content with TikTok text overlay" }
        ]
      },
      {
        name: "Blog SEO Checklist for Every Post", color: "#f0883e",
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
        name: "Performance Review", color: "#58a6ff",
        tasks: [
          { id: "w4-c1-t1", text: "Review which reels got the most views and saves in Weeks 1 to 3" },
          { id: "w4-c1-t2", text: "Review which social posts got the most engagement" },
          { id: "w4-c1-t3", text: "Check email open rates and click rates on welcome sequence — target 20 to 25% open rate" },
          { id: "w4-c1-t4", text: "Review Microsoft Clarity heatmaps — where are people clicking and dropping off on the store" }
        ]
      },
      {
        name: "Meta Ads — Awareness Setup Only", color: "#f0883e",
        tasks: [
          { id: "w4-c2-t1", text: "Create Page Like campaign to grow Facebook and Instagram following", note: "Goal is audience building NOT selling yet" },
          { id: "w4-c2-t2", text: "Boost top performing reel from Week 3 — budget $5 to $10 AUD per day" },
          { id: "w4-c2-t3", text: "Set up Video View campaign to build warm audience for Month 2 retargeting" },
          { id: "w4-c2-t4", text: "Verify Facebook Pixel is firing correctly on all key pages" }
        ]
      },
      {
        name: "Product Page Round 1", color: "#3fb950",
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
        name: "Content Upgrade", color: "#3fb950",
        tasks: [
          { id: "w5-c1-t1", text: "Double down on reel formats that performed best in Month 1 — create 3 more of the winning format" },
          { id: "w5-c1-t2", text: "Stop posting content formats that got zero traction — cut them from calendar" },
          { id: "w5-c1-t3", text: "Create Carousel 1: '5 Signs Your Gut Health Needs Attention' — hook slide + 5 signs + product CTA" },
          { id: "w5-c1-t4", text: "Create Carousel 2: 'The Lifestyle Medicine Daily Checklist' — highly shareable format" },
          { id: "w5-c1-t5", text: "Create Carousel 3: '10 Foods That Fight Inflammation' — educational and shareable" }
        ]
      },
      {
        name: "Lead Magnet Campaign", color: "#58a6ff",
        tasks: [
          { id: "w5-c2-t1", text: "Launch Meta Lead Gen Ad — target Australian women 30 to 65 interested in health and natural medicine", note: "Budget: $10 to $15 AUD per day — target CPL: $2 to $5 AUD" },
          { id: "w5-c2-t2", text: "Create ad creative — short video reel previewing the lead magnet and its benefits" },
          { id: "w5-c2-t3", text: "Monitor CPL daily — if above $8 AUD pause and test new creative" }
        ]
      },
      {
        name: "Product Content", color: "#f0883e",
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
        name: "Email Nurture Sequence — Emails 4 to 10", color: "#3fb950",
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
        name: "Facebook Community", color: "#bc8cff",
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
        name: "Meta Retargeting Campaigns", color: "#f0883e",
        tasks: [
          { id: "w7-c1-t1", text: "Launch Retargeting Campaign 1 — Website Visitors: target last 30 days no purchase, 10% discount code ad — $10 AUD/day" },
          { id: "w7-c1-t2", text: "Launch Retargeting Campaign 2 — Video Viewers: target 50% video watches last 30 days, testimonial ad — $10 AUD/day" },
          { id: "w7-c1-t3", text: "Launch Retargeting Campaign 3 — Email List Custom Audience: upload subscriber list, product ads — $5 AUD/day" },
          { id: "w7-c1-t4", text: "Monitor retargeting CPL and ROAS daily — first 3 days learning phase, do not touch" }
        ]
      },
      {
        name: "Google SEO Push", color: "#3fb950",
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
        name: "Vendor Recruitment", color: "#3fb950",
        tasks: [
          { id: "w8-c1-t1", text: "Improve the existing 'Sell With Us' page — clear benefits, process, and CTA for vendors" },
          { id: "w8-c1-t2", text: "Write blog: 'Why Selling on Lifestyle Medicine Gateway Makes Sense for Australian Health Brands'" },
          { id: "w8-c1-t3", text: "Create 3 to 5 social posts targeting small health product businesses to become vendors" },
          { id: "w8-c1-t4", text: "Run small Meta Ad targeting small business owners in Australian health and wellness space — $5 to $10 AUD/day" }
        ]
      },
      {
        name: "Youngevity and Young Living Affiliate Push", color: "#bc8cff",
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
        name: "Meta Conversion Campaigns", color: "#f0883e",
        tasks: [
          { id: "w9-c1-t1", text: "Launch Campaign 1 — Cold Audience Conversion: Australian women 30–65, health interests, lookalike audience — $20 to $30 AUD/day", note: "Landing page: direct to best selling low price point product — castor oil or Celtic sea salt" },
          { id: "w9-c1-t2", text: "Launch Campaign 2 — Cart Abandonment Retargeting: added to cart no purchase last 14 days, 10% discount code — $10 AUD/day" },
          { id: "w9-c1-t3", text: "Launch Campaign 3 — Past Purchaser Upsell: custom audience of past buyers, 'You loved X — try these next' ad — $5 AUD/day" },
          { id: "w9-c1-t4", text: "Do not touch campaigns for first 3 days — let Meta learning phase complete" },
          { id: "w9-c1-t5", text: "After Day 7 review ROAS — if above 3x increase budget by 20%, if below 2x review creative and audience" }
        ]
      },
      {
        name: "Abandoned Cart Email Sequence", color: "#3fb950",
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
        name: "Product Page Round 2", color: "#f0883e",
        tasks: [
          { id: "w10-c1-t1", text: "Add customer reviews and ratings to every product page — number one conversion driver for health products" },
          { id: "w10-c1-t2", text: "Add FAQ section to each product page answering the most common customer objections" },
          { id: "w10-c1-t3", text: "Add urgency elements — 'Only 12 left in stock' or 'Order by Thursday for weekend delivery'" },
          { id: "w10-c1-t4", text: "Set up upsell and cross-sell product recommendations on all product pages" }
        ]
      },
      {
        name: "Checkout Optimization", color: "#58a6ff",
        tasks: [
          { id: "w10-c2-t1", text: "Reduce checkout to as few steps as possible — remove unnecessary fields" },
          { id: "w10-c2-t2", text: "Add trust badges to checkout page — secure payment, money back guarantee, Australian owned" },
          { id: "w10-c2-t3", text: "Add checkout progress bar showing how close the customer is to completing" },
          { id: "w10-c2-t4", text: "Add order bump at checkout — low cost complementary product for a few extra dollars" },
          { id: "w10-c2-t5", text: "Make return policy and shipping information visible at the checkout page" }
        ]
      },
      {
        name: "Data Analysis", color: "#3fb950",
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
        name: "Micro Influencer Campaign", color: "#bc8cff",
        tasks: [
          { id: "w11-c1-t1", text: "Identify 10 to 15 Australian health and wellness micro influencers on Instagram and TikTok — 5,000 to 50,000 followers" },
          { id: "w11-c1-t2", text: "Send outreach DM or email to top 10 influencers — offer free products in exchange for honest review reel" },
          { id: "w11-c1-t3", text: "Create unique discount code for each influencer to track actual sales driven" },
          { id: "w11-c1-t4", text: "Send product packages to confirmed influencers — include a personal note and clear brief" },
          { id: "w11-c1-t5", text: "Repost all influencer content to brand pages immediately when published" }
        ]
      },
      {
        name: "User Generated Content", color: "#f0883e",
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
        name: "Social Media Review", color: "#f0883e",
        tasks: [
          { id: "w12-c1-t1", text: "Report follower growth Month 1 vs Month 3 — target 3,000 to 6,000 total" },
          { id: "w12-c1-t2", text: "Identify top 3 performing content formats and topics — double down on these in Month 4" },
          { id: "w12-c1-t3", text: "Report reach, impressions, and engagement rate trends across all platforms" }
        ]
      },
      {
        name: "Email and SEO Review", color: "#3fb950",
        tasks: [
          { id: "w12-c2-t1", text: "Report total email subscribers — target 500 to 1,000" },
          { id: "w12-c2-t2", text: "Report email open rate — target 30 to 35% and click through rate — target 3 to 5%" },
          { id: "w12-c2-t3", text: "Report revenue attributed to email sequence — which email drove the most purchases" },
          { id: "w12-c2-t4", text: "Report organic traffic growth and top performing blog posts by visits" },
          { id: "w12-c2-t5", text: "Report keyword ranking improvements from Google Search Console" }
        ]
      },
      {
        name: "Paid Ads and E-Commerce Review", color: "#58a6ff",
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
