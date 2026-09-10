'use client'

import { useState } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Users,
  TrendingUp,
  Award,
  ShieldCheck,
  Zap,
  Target,
  BarChart3,
  CheckCircle2,
  FileText,
  Mail,
  ArrowRight,
  ExternalLink,
  Globe,
  Sparkles,
  Heart,
  BookOpen,
  Leaf,
  Layers,
  Search,
  MessageSquare,
  Building2,
  Package,
  Calendar,
  Check,
  ChevronRight,
  Share2,
  Download,
  Stethoscope,
  ShoppingBag,
  Flame,
  CheckSquare
} from "lucide-react";
import { cn } from "@/lib/utils";

// Category Data
const categories = [
  { name: "Practitioner Supplements", icon: Stethoscope, count: "180+ Products", desc: "Clinical grade formulations and high-potency targeted nutrients." },
  { name: "Herbal Products & Tinctures", icon: Leaf, count: "220+ Products", desc: "Traditional botanical extracts, liquid tinctures, and medicinal teas." },
  { name: "Functional Foods & Superfoods", icon: Flame, count: "140+ Products", desc: "Ceremonial cacao, adaptogenic mushrooms, and organic elixirs." },
  { name: "Natural Skincare & Bodycare", icon: Heart, count: "160+ Products", desc: "Toxin-free, botanical skincare nourishing the skin barrier." },
  { name: "Non-Toxic Cleaning Products", icon: ShieldCheck, count: "95+ Products", desc: "Eco-friendly, chemical-free home cleaning solutions." },
  { name: "Water Filtration Systems", icon: Sparkles, count: "45+ Products", desc: "Advanced reverse osmosis, alkalizing, and countertop filters." },
  { name: "Healthy Home & Air Care", icon: Building2, count: "70+ Products", desc: "HEPA air purifiers, organic bedding, and EMF protection." },
  { name: "Pure Essential Oils", icon: Zap, count: "110+ Products", desc: "100% pure steam-distilled single oils and therapeutic blends." },
  { name: "Organic Food Products", icon: ShoppingBag, count: "210+ Products", desc: "Pantry staples, cold-pressed oils, and biodynamic snacks." },
  { name: "Natural Pet Care", icon: Package, count: "65+ Products", desc: "Raw food supplements, herbal flea remedies, and clean grooming." },
  { name: "Outdoor & Wellness Gear", icon: Globe, count: "50+ Products", desc: "Grounding mats, non-toxic outdoor gear, and sun protection." },
  { name: "Educational Programs", icon: BookOpen, count: "30+ Courses", desc: "Practitioner-led video workshops, courses, and wellness plans." },
  { name: "Health Books & Resources", icon: FileText, count: "85+ Books", desc: "Evidence-based lifestyle medicine books and health journals." },
];

// Audience Breakdown
const audienceGroups = [
  {
    title: "Health-Conscious Consumers",
    share: "45%",
    desc: "Active buyers looking for clean, non-toxic ingredients, proven efficacy, and premium health remedies.",
    tags: ["High Purchasing Intent", "Subscription Mindset", "Quality Focused"]
  },
  {
    title: "Practitioners & Naturopaths",
    share: "20%",
    desc: "Integrative doctors, naturopaths, nutritionists, and health coaches seeking verified brands for client recommendations.",
    tags: ["Clinical Efficacy", "Bulk Orders", "Professional Trust"]
  },
  {
    title: "Families & Household Decision Makers",
    share: "20%",
    desc: "Parents prioritizing chemical-free living, organic food staples, non-toxic home products, and natural remedies.",
    tags: ["Repeat Buyers", "Multi-Category Purchases", "Long-Term Loyalty"]
  },
  {
    title: "Seniors & Active Ageing",
    share: "15%",
    desc: "Mature adults proactively managing joint health, memory, menopause, gut integrity, and cardiovascular longevity.",
    tags: ["High Basket Value", "Dedicated Buyers", "Health Prevention"]
  }
];

// Marketing Channels
const marketingActivities = [
  { title: "Search Engine Optimisation (SEO)", icon: Search, desc: "High-ranking educational articles and product category hubs bringing organic Google traffic daily." },
  { title: "Educational Content Engine", icon: BookOpen, desc: "Deep-dive health research, evidence breakdowns, and recipes that contextualize vendor products." },
  { title: "Targeted Email Broadcasts", icon: Mail, desc: "Weekly newsletter features sent to 18,200+ active subscribers with high open & click rates." },
  { title: "Social Media Campaigns", icon: Share2, desc: "Engaging short-form videos, reels, and product highlights across Instagram, Facebook & YouTube." },
  { title: "Practitioner Referral Network", icon: Stethoscope, desc: "Direct product recommendations from affiliated health practitioners and lifestyle medicine coaches." },
  { title: "Industry Partnerships & Events", icon: Calendar, desc: "Co-branded campaigns, wellness summits, podcast features, and interactive product spotlights." }
];

export default function MediaPackagePage() {
  const [activeTab, setActiveTab] = useState<"overview" | "audience" | "opportunities" | "roadmap">("overview");

  return (
    <div className="min-h-screen bg-background text-foreground">
      {/* Hero Header */}
      <section className="relative overflow-hidden bg-[#1B3022] py-24 sm:py-32 text-white">
        <div className="absolute inset-0 bg-[url('https://images.unsplash.com/photo-1542744173-8e7e53415bb0?q=80&w=2070')] bg-cover bg-center opacity-15 mix-blend-overlay" />
        <div className="absolute inset-0 bg-gradient-to-b from-black/50 via-transparent to-[#1B3022]" />
        
        <div className="absolute -right-20 -top-20 h-96 w-96 rounded-full bg-wellness/15 blur-[120px] animate-pulse" />
        <div className="absolute -bottom-20 -left-20 h-96 w-96 rounded-full bg-wellness-light/10 blur-[120px] animate-pulse" />

        <div className="relative z-10 mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 text-center">
          <div className="inline-flex items-center gap-2 rounded-full bg-wellness/20 border border-wellness/40 px-4 py-1.5 text-xs font-bold text-wellness-light backdrop-blur-md mb-8">
            <Award className="h-4 w-4" />
            Official Vendor Media Package & Partner Kit
          </div>

          <h1 className="text-4xl font-extrabold tracking-tight sm:text-6xl lg:text-7xl max-w-5xl mx-auto leading-[1.15]">
            Why Partner With <br />
            <span className="bg-gradient-to-r from-wellness-light via-emerald-300 to-emerald-100 bg-clip-text text-transparent">
              Lifestyle Medicine Gateway?
            </span>
          </h1>

          <p className="mx-auto mt-6 max-w-3xl text-lg sm:text-xl text-white/80 leading-relaxed font-normal">
            Discover our mission, audience demographics, traffic trajectory, marketing ecosystem, and exclusive vendor promotional opportunities.
          </p>

          <div className="mt-10 flex flex-wrap items-center justify-center gap-4">
            <Link href="/signup?type=vendor&redirect=/vendor">
              <Button size="lg" className="bg-wellness text-wellness-dark hover:bg-wellness-light h-14 px-8 text-base font-bold shadow-xl transition-all hover:scale-105">
                Apply as a Vendor
                <ArrowRight className="ml-2 h-5 w-5" />
              </Button>
            </Link>
            <a href="#quick-nav">
              <Button size="lg" variant="outline" className="border-white/30 text-white bg-white/10 hover:bg-white/20 h-14 px-8 text-base font-semibold backdrop-blur-md">
                Explore Media Kit
              </Button>
            </a>
          </div>

          {/* Key Quick Stats */}
          <div className="mt-16 grid grid-cols-2 gap-4 sm:grid-cols-4 max-w-5xl mx-auto">
            <div className="rounded-2xl border border-white/10 bg-white/5 p-6 backdrop-blur-md">
              <div className="text-3xl font-black text-wellness-light sm:text-4xl">12.5k+</div>
              <div className="mt-1 text-xs font-semibold text-white/70 uppercase tracking-wider">Registered Members</div>
            </div>
            <div className="rounded-2xl border border-white/10 bg-white/5 p-6 backdrop-blur-md">
              <div className="text-3xl font-black text-wellness-light sm:text-4xl">85k+</div>
              <div className="mt-1 text-xs font-semibold text-white/70 uppercase tracking-wider">Monthly Page Views</div>
            </div>
            <div className="rounded-2xl border border-white/10 bg-white/5 p-6 backdrop-blur-md">
              <div className="text-3xl font-black text-wellness-light sm:text-4xl">18.2k+</div>
              <div className="mt-1 text-xs font-semibold text-white/70 uppercase tracking-wider">Newsletter Readers</div>
            </div>
            <div className="rounded-2xl border border-white/10 bg-white/5 p-6 backdrop-blur-md">
              <div className="text-3xl font-black text-wellness-light sm:text-4xl">50+</div>
              <div className="mt-1 text-xs font-semibold text-white/70 uppercase tracking-wider">Verified Brands</div>
            </div>
          </div>
        </div>
      </section>

      {/* Quick Navigation Sticky Bar */}
      <div id="quick-nav" className="sticky top-16 z-40 border-b border-border bg-background/95 backdrop-blur-md">
        <div className="mx-auto flex max-w-7xl items-center justify-between overflow-x-auto px-4 py-3 sm:px-6 lg:px-8 text-sm no-scrollbar">
          <div className="flex gap-2 min-w-max">
            <a href="#about" className="rounded-lg px-3 py-1.5 font-medium text-muted-foreground hover:bg-accent hover:text-foreground transition-colors">1. About Us</a>
            <a href="#audience" className="rounded-lg px-3 py-1.5 font-medium text-muted-foreground hover:bg-accent hover:text-foreground transition-colors">2. Audience</a>
            <a href="#growth" className="rounded-lg px-3 py-1.5 font-medium text-muted-foreground hover:bg-accent hover:text-foreground transition-colors">3. Growth</a>
            <a href="#categories" className="rounded-lg px-3 py-1.5 font-medium text-muted-foreground hover:bg-accent hover:text-foreground transition-colors">4. Categories</a>
            <a href="#why-join" className="rounded-lg px-3 py-1.5 font-medium text-muted-foreground hover:bg-accent hover:text-foreground transition-colors">5. Vendor Benefits</a>
            <a href="#opportunities" className="rounded-lg px-3 py-1.5 font-medium text-muted-foreground hover:bg-accent hover:text-foreground transition-colors">6. Tier Options</a>
            <a href="#marketing" className="rounded-lg px-3 py-1.5 font-medium text-muted-foreground hover:bg-accent hover:text-foreground transition-colors">7. Marketing Engine</a>
            <a href="#roadmap" className="rounded-lg px-3 py-1.5 font-medium text-muted-foreground hover:bg-accent hover:text-foreground transition-colors">8. Roadmap</a>
            <a href="#requirements" className="rounded-lg px-3 py-1.5 font-medium text-muted-foreground hover:bg-accent hover:text-foreground transition-colors">9. Standards</a>
          </div>
          <Link href="/signup?type=vendor&redirect=/vendor" className="hidden sm:inline-flex">
            <Button size="sm" variant="wellness">Apply Now</Button>
          </Link>
        </div>
      </div>

      <div className="mx-auto max-w-7xl px-4 py-16 sm:px-6 lg:px-8 space-y-24">
        {/* Section 1: About Lifestyle Medicine Gateway */}
        <section id="about" className="scroll-mt-32">
          <div className="flex flex-col lg:flex-row gap-12 items-center">
            <div className="lg:w-1/2 space-y-6">
              <Badge className="bg-primary/10 text-primary border-primary/20 px-3 py-1 text-xs uppercase font-bold tracking-wider">
                1. About The Marketplace
              </Badge>
              <h2 className="text-3xl font-extrabold sm:text-4xl tracking-tight text-foreground">
                Bridging Science & Natural Health for Australia
              </h2>
              <p className="text-base text-muted-foreground leading-relaxed">
                Lifestyle Medicine Gateway was founded on a singular conviction: lasting health isn't built on synthetic band-aids, but on evidence-based lifestyle changes, natural health, clean nutrition, and preventive education.
              </p>
              
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2">
                <div className="p-4 rounded-xl border border-border bg-card">
                  <div className="font-bold text-foreground text-sm flex items-center gap-2">
                    <Target className="h-4 w-4 text-wellness" /> Mission & Vision
                  </div>
                  <p className="mt-1 text-xs text-muted-foreground">
                    To make clean, evidence-backed lifestyle medicine products and expert health guidance accessible to every Australian household.
                  </p>
                </div>

                <div className="p-4 rounded-xl border border-border bg-card">
                  <div className="font-bold text-foreground text-sm flex items-center gap-2">
                    <ShieldCheck className="h-4 w-4 text-wellness" /> What Makes Us Different
                  </div>
                  <p className="mt-1 text-xs text-muted-foreground">
                    Zero upfront listing fees, strict non-toxic ingredient standards, and direct educational integration into buying journeys.
                  </p>
                </div>
              </div>

              <div className="rounded-2xl bg-muted/60 p-6 border border-border">
                <h4 className="font-bold text-sm text-foreground flex items-center gap-2">
                  <Heart className="h-4 w-4 text-destructive" /> Founder Story & Customer Trust
                </h4>
                <p className="mt-2 text-xs text-muted-foreground leading-relaxed">
                  Founded by passionate health practitioners and wellness advocates, our platform earned customer trust by strictly vetting ingredients, rejecting greenwashing, and offering transparent health articles alongside products.
                </p>
              </div>
            </div>

            <div className="lg:w-1/2 w-full">
              <div className="grid grid-cols-2 gap-4">
                <Card className="border-border bg-card shadow-sm hover:shadow-md transition-all">
                  <CardContent className="p-6 text-center">
                    <Leaf className="h-8 w-8 text-wellness mx-auto mb-3" />
                    <h3 className="font-bold text-foreground text-sm">Natural Health</h3>
                    <p className="text-xs text-muted-foreground mt-1">Pure botanicals & clean formulations free from toxic chemicals.</p>
                  </CardContent>
                </Card>

                <Card className="border-border bg-card shadow-sm hover:shadow-md transition-all">
                  <CardContent className="p-6 text-center">
                    <Stethoscope className="h-8 w-8 text-primary mx-auto mb-3" />
                    <h3 className="font-bold text-foreground text-sm">Lifestyle Medicine</h3>
                    <p className="text-xs text-muted-foreground mt-1">Focused on root-cause health, sleep, nutrition & gut restoration.</p>
                  </CardContent>
                </Card>

                <Card className="border-border bg-card shadow-sm hover:shadow-md transition-all">
                  <CardContent className="p-6 text-center">
                    <BookOpen className="h-8 w-8 text-amber-600 mx-auto mb-3" />
                    <h3 className="font-bold text-foreground text-sm">Education First</h3>
                    <p className="text-xs text-muted-foreground mt-1">Integrating clinical studies & guides into every product listing.</p>
                  </CardContent>
                </Card>

                <Card className="border-border bg-card shadow-sm hover:shadow-md transition-all">
                  <CardContent className="p-6 text-center">
                    <Globe className="h-8 w-8 text-sky-600 mx-auto mb-3" />
                    <h3 className="font-bold text-foreground text-sm">Environmental Health</h3>
                    <p className="text-xs text-muted-foreground mt-1">Promoting sustainable packaging, clean air, water & home solutions.</p>
                  </CardContent>
                </Card>
              </div>
            </div>
          </div>
        </section>

        {/* Section 2: Our Audience */}
        <section id="audience" className="scroll-mt-32">
          <div className="text-center max-w-3xl mx-auto mb-12">
            <Badge className="bg-wellness/10 text-wellness border-wellness/20 px-3 py-1 text-xs uppercase font-bold tracking-wider mb-3">
              2. Audience Demographics
            </Badge>
            <h2 className="text-3xl font-extrabold sm:text-4xl tracking-tight text-foreground">
              Who Visits Lifestyle Medicine Gateway?
            </h2>
            <p className="mt-3 text-muted-foreground text-sm sm:text-base">
              Even in early growth stages, vendors gain access to a highly qualified, high-intent audience actively investing in natural health solutions.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {audienceGroups.map((group, i) => (
              <Card key={i} className="border-border bg-card relative overflow-hidden flex flex-col justify-between hover:border-wellness/40 transition-all">
                <CardContent className="p-6 space-y-4">
                  <div className="flex justify-between items-start">
                    <span className="text-2xl font-black text-primary">{group.share}</span>
                    <Badge variant="outline" className="text-[10px] font-bold">Target Cohort</Badge>
                  </div>
                  <div>
                    <h3 className="font-bold text-foreground text-base">{group.title}</h3>
                    <p className="text-xs text-muted-foreground mt-2 leading-relaxed">{group.desc}</p>
                  </div>
                  <div className="pt-3 border-t border-border/50 flex flex-wrap gap-1">
                    {group.tags.map((tag, idx) => (
                      <span key={idx} className="text-[10px] bg-muted px-2 py-0.5 rounded-full font-medium text-muted-foreground">
                        {tag}
                      </span>
                    ))}
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>

          <div className="mt-8 rounded-2xl bg-primary/5 p-6 border border-primary/20 flex flex-col sm:flex-row items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <Globe className="h-6 w-6 text-primary shrink-0" />
              <div>
                <h4 className="font-bold text-sm text-foreground">Geographic Footprint: 100% Australian & ANZ Focus</h4>
                <p className="text-xs text-muted-foreground">Primary visitors originate from Sydney, Melbourne, Brisbane, Perth, Adelaide, and regional wellness hubs.</p>
              </div>
            </div>
            <Badge className="bg-primary text-primary-foreground text-xs px-3 py-1 font-bold shrink-0">Launching ANZ Nationwide</Badge>
          </div>
        </section>

        {/* Section 3: Website Growth Snapshot */}
        <section id="growth" className="scroll-mt-32">
          <div className="rounded-3xl bg-card border border-border p-8 sm:p-12 shadow-sm">
            <div className="flex flex-col lg:flex-row gap-12 items-center">
              <div className="lg:w-5/12 space-y-6">
                <Badge className="bg-emerald-500/10 text-emerald-600 border-emerald-500/20 px-3 py-1 text-xs uppercase font-bold tracking-wider">
                  3. Growth Snapshot
                </Badge>
                <h2 className="text-3xl font-extrabold tracking-tight text-foreground">
                  Consistent, Compounding Traffic Growth
                </h2>
                <p className="text-sm text-muted-foreground leading-relaxed">
                  Vendors value steady month-on-month trajectory over static metrics. Our organic search authority, recipe features, and health article ecosystem drive continuous audience growth.
                </p>

                <div className="space-y-3 pt-2">
                  <div className="flex justify-between items-center text-xs font-semibold py-2 border-b border-border">
                    <span className="text-muted-foreground">Monthly Account Growth</span>
                    <span className="text-emerald-600 font-bold flex items-center gap-1"><TrendingUp className="h-3.5 w-3.5" /> +28% MoM</span>
                  </div>
                  <div className="flex justify-between items-center text-xs font-semibold py-2 border-b border-border">
                    <span className="text-muted-foreground">Returning Visitors</span>
                    <span className="text-foreground font-bold">64.2% Repeat Rate</span>
                  </div>
                  <div className="flex justify-between items-center text-xs font-semibold py-2 border-b border-border">
                    <span className="text-muted-foreground">Average Session Duration</span>
                    <span className="text-foreground font-bold">3 mins 45 secs</span>
                  </div>
                  <div className="flex justify-between items-center text-xs font-semibold py-2">
                    <span className="text-muted-foreground">Newsletter Open Rate</span>
                    <span className="text-foreground font-bold">38.4% (Industry Avg: 21%)</span>
                  </div>
                </div>
              </div>

              {/* Interactive SVG Chart Visual */}
              <div className="lg:w-7/12 w-full rounded-2xl bg-muted/40 p-6 border border-border">
                <div className="flex justify-between items-center mb-6">
                  <div>
                    <h4 className="font-bold text-sm text-foreground">Monthly Page Views Trajectory</h4>
                    <p className="text-xs text-muted-foreground">Organic search + direct marketplace traffic</p>
                  </div>
                  <Badge variant="outline" className="text-xs font-semibold text-emerald-600 border-emerald-500/30 bg-emerald-500/10">
                    Upward Trend
                  </Badge>
                </div>

                <div className="h-56 w-full relative flex items-end justify-between gap-2 pt-8 px-4">
                  {/* SVG Line Background */}
                  <svg className="absolute inset-0 h-full w-full overflow-visible" preserveAspectRatio="none" viewBox="0 0 500 200">
                    <path
                      d="M 10 170 Q 100 150, 180 120 T 350 60 T 490 20"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="3"
                      className="text-wellness"
                    />
                    <path
                      d="M 10 170 Q 100 150, 180 120 T 350 60 T 490 20 L 490 200 L 10 200 Z"
                      fill="currentColor"
                      className="text-wellness/10"
                    />
                  </svg>

                  {/* Bars */}
                  {[
                    { month: "Q1 2025", value: "22k" },
                    { month: "Q2 2025", value: "38k" },
                    { month: "Q3 2025", value: "54k" },
                    { month: "Q4 2025", value: "68k" },
                    { month: "Q1 2026", value: "85k+" },
                  ].map((bar, idx) => (
                    <div key={idx} className="flex flex-col items-center gap-2 z-10 flex-1">
                      <span className="text-[11px] font-bold text-foreground">{bar.value}</span>
                      <div className="w-full max-w-[40px] bg-wellness/80 rounded-t-md transition-all hover:bg-wellness" style={{ height: `${(idx + 1) * 35}px` }}></div>
                      <span className="text-[10px] text-muted-foreground font-medium">{bar.month}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Section 4: Product Categories */}
        <section id="categories" className="scroll-mt-32">
          <div className="text-center max-w-3xl mx-auto mb-12">
            <Badge className="bg-primary/10 text-primary border-primary/20 px-3 py-1 text-xs uppercase font-bold tracking-wider mb-3">
              4. Marketplace Breadth
            </Badge>
            <h2 className="text-3xl font-extrabold sm:text-4xl tracking-tight text-foreground">
              13 Core Product Categories
            </h2>
            <p className="mt-3 text-muted-foreground text-sm sm:text-base">
              Our marketplace spans every dimension of natural health, lifestyle medicine, and sustainable living.
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
            {categories.map((cat, i) => {
              const IconComp = cat.icon;
              return (
                <Card key={i} className="border-border bg-card hover:border-wellness/40 hover:shadow-md transition-all">
                  <CardContent className="p-5 flex items-start gap-4">
                    <div className="p-3 rounded-xl bg-wellness/10 text-wellness shrink-0">
                      <IconComp className="h-5 w-5" />
                    </div>
                    <div>
                      <h3 className="font-bold text-foreground text-sm">{cat.name}</h3>
                      <p className="text-[11px] text-muted-foreground mt-1 leading-snug">{cat.desc}</p>
                      <span className="inline-block mt-2 text-[10px] font-bold text-primary bg-primary/10 px-2 py-0.5 rounded-md">
                        {cat.count}
                      </span>
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        </section>

        {/* Section 5: Why Vendors Join */}
        <section id="why-join" className="scroll-mt-32">
          <div className="rounded-3xl bg-[#1B3022] text-white p-8 sm:p-12 shadow-xl relative overflow-hidden">
            <div className="absolute right-0 top-0 h-96 w-96 rounded-full bg-wellness/10 blur-[100px]" />
            
            <div className="relative z-10 max-w-3xl mb-12">
              <Badge className="bg-wellness/20 text-wellness-light border-wellness/30 px-3 py-1 text-xs uppercase font-bold tracking-wider mb-3">
                5. Vendor Value Proposition
              </Badge>
              <h2 className="text-3xl font-extrabold sm:text-5xl tracking-tight text-white">
                Why Vendors Choose Lifestyle Medicine Gateway
              </h2>
              <p className="mt-4 text-white/80 text-base leading-relaxed">
                We don't just host your products — we actively position your brand in front of high-intent buyers through content, search, and practitioner networks.
              </p>
            </div>

            <div className="relative z-10 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              {[
                { title: "Targeted Audience", desc: "No general shoppers. 100% focused on natural health, remedies, and clean living.", icon: Target },
                { title: "Evergreen Product Exposure", desc: "Your products are featured inside high-ranking health guides and recipes permanently.", icon: Zap },
                { title: "Zero Upfront Fees", desc: "Pay only when you sell. Standard listings are free with seamless payment processing.", icon: CheckCircle2 },
                { title: "Content & Article Spotlight", desc: "Educate buyers with dedicated articles, vendor interviews, and deep dives.", icon: FileText },
                { title: "Email Newsletter Features", desc: "Direct placement in weekly emails reaching 18,200+ health subscribers.", icon: Mail },
                { title: "Social Media Highlights", desc: "Video showcases on YouTube, reels, and Instagram posts created by our team.", icon: Share2 },
                { title: "Practitioner Network", icon: Stethoscope, desc: "Future referral routing connecting your products with naturopaths and coaches." },
                { title: "SEO Backlink & Ranking Boost", desc: "Gain high-authority backlinks and organic traffic to your store pages.", icon: Search }
              ].map((benefit, i) => {
                const Icon = benefit.icon;
                return (
                  <div key={i} className="rounded-2xl border border-white/10 bg-white/5 p-6 backdrop-blur-md hover:bg-white/10 transition-all">
                    <Icon className="h-6 w-6 text-wellness-light mb-3" />
                    <h3 className="font-bold text-white text-sm">{benefit.title}</h3>
                    <p className="text-xs text-white/70 mt-2 leading-relaxed">{benefit.desc}</p>
                  </div>
                );
              })}
            </div>
          </div>
        </section>

        {/* Section 6: Vendor Success Tier Opportunities */}
        <section id="opportunities" className="scroll-mt-32">
          <div className="text-center max-w-3xl mx-auto mb-12">
            <Badge className="bg-wellness/10 text-wellness border-wellness/20 px-3 py-1 text-xs uppercase font-bold tracking-wider mb-3">
              6. Promotional Packages
            </Badge>
            <h2 className="text-3xl font-extrabold sm:text-4xl tracking-tight text-foreground">
              Vendor Success Opportunities
            </h2>
            <p className="mt-3 text-muted-foreground text-sm sm:text-base">
              Choose the level of visibility and partnership that aligns with your brand's growth targets.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {/* Standard Listing */}
            <Card className="border-border bg-card flex flex-col justify-between hover:shadow-lg transition-all">
              <CardContent className="p-8 space-y-6">
                <div className="space-y-2">
                  <Badge variant="outline" className="text-xs font-bold">Standard</Badge>
                  <h3 className="text-2xl font-bold text-foreground">Standard Listing</h3>
                  <p className="text-xs text-muted-foreground">Ideal for new brands starting out with zero risk.</p>
                </div>
                <div className="text-3xl font-black text-foreground">Free <span className="text-xs font-medium text-muted-foreground">/ no listing fee</span></div>

                <ul className="space-y-3 text-xs text-muted-foreground pt-4 border-t border-border">
                  <li className="flex items-center gap-2"><Check className="h-4 w-4 text-emerald-600 shrink-0" /> Full Vendor Store Profile</li>
                  <li className="flex items-center gap-2"><Check className="h-4 w-4 text-emerald-600 shrink-0" /> Unlimited Product Catalog Listings</li>
                  <li className="flex items-center gap-2"><Check className="h-4 w-4 text-emerald-600 shrink-0" /> Direct Website & Brand Link</li>
                  <li className="flex items-center gap-2"><Check className="h-4 w-4 text-emerald-600 shrink-0" /> Automated Stripe Payouts</li>
                </ul>

                <Link href="/signup?type=vendor&redirect=/vendor" className="block pt-4">
                  <Button className="w-full" variant="outline">Get Started Free</Button>
                </Link>
              </CardContent>
            </Card>

            {/* Featured Vendor */}
            <Card className="border-wellness bg-card relative shadow-xl flex flex-col justify-between">
              <div className="absolute -top-3.5 left-1/2 -translate-x-1/2 bg-wellness text-wellness-dark text-[11px] font-black uppercase tracking-wider px-4 py-1 rounded-full shadow-md">
                Most Popular
              </div>
              <CardContent className="p-8 space-y-6">
                <div className="space-y-2">
                  <Badge className="bg-wellness text-wellness-dark text-xs font-bold">Featured</Badge>
                  <h3 className="text-2xl font-bold text-foreground">Featured Vendor</h3>
                  <p className="text-xs text-muted-foreground">Maximum homepage visibility and marketing push.</p>
                </div>
                <div className="text-3xl font-black text-foreground">Spotlight <span className="text-xs font-medium text-muted-foreground">/ promotional tier</span></div>

                <ul className="space-y-3 text-xs text-muted-foreground pt-4 border-t border-border">
                  <li className="flex items-center gap-2"><Check className="h-4 w-4 text-wellness shrink-0 font-bold" /> Prime Homepage Hero Placement</li>
                  <li className="flex items-center gap-2"><Check className="h-4 w-4 text-wellness shrink-0 font-bold" /> Dedicated Email Newsletter Banner</li>
                  <li className="flex items-center gap-2"><Check className="h-4 w-4 text-wellness shrink-0 font-bold" /> Social Media Reel Feature (IG/YT)</li>
                  <li className="flex items-center gap-2"><Check className="h-4 w-4 text-wellness shrink-0 font-bold" /> Top Category Banner Listing</li>
                </ul>

                <Link href="/signup?type=vendor&redirect=/vendor" className="block pt-4">
                  <Button className="w-full" variant="wellness">Apply For Featured Tier</Button>
                </Link>
              </CardContent>
            </Card>

            {/* Educational Partner */}
            <Card className="border-border bg-card flex flex-col justify-between hover:shadow-lg transition-all">
              <CardContent className="p-8 space-y-6">
                <div className="space-y-2">
                  <Badge variant="outline" className="text-xs font-bold">Thought Leadership</Badge>
                  <h3 className="text-2xl font-bold text-foreground">Educational Partner</h3>
                  <p className="text-xs text-muted-foreground">Deep content integration and clinical storytelling.</p>
                </div>
                <div className="text-3xl font-black text-foreground">Partner <span className="text-xs font-medium text-muted-foreground">/ custom co-branding</span></div>

                <ul className="space-y-3 text-xs text-muted-foreground pt-4 border-t border-border">
                  <li className="flex items-center gap-2"><Check className="h-4 w-4 text-emerald-600 shrink-0" /> Co-Authored Health Research Articles</li>
                  <li className="flex items-center gap-2"><Check className="h-4 w-4 text-emerald-600 shrink-0" /> Product Recipe Spotlights</li>
                  <li className="flex items-center gap-2"><Check className="h-4 w-4 text-emerald-600 shrink-0" /> Founder Video & Podcast Interview</li>
                  <li className="flex items-center gap-2"><Check className="h-4 w-4 text-emerald-600 shrink-0" /> Practitioner Co-Webinar Opportunities</li>
                </ul>

                <Link href="/contact" className="block pt-4">
                  <Button className="w-full" variant="outline">Contact Partner Team</Button>
                </Link>
              </CardContent>
            </Card>
          </div>
        </section>

        {/* Section 7: Marketplace Statistics */}
        <section className="scroll-mt-32">
          <div className="rounded-3xl bg-muted/50 p-8 sm:p-12 border border-border">
            <div className="text-center max-w-2xl mx-auto mb-10">
              <Badge className="bg-primary/10 text-primary border-primary/20 px-3 py-1 text-xs uppercase font-bold tracking-wider mb-2">
                7. Marketplace Metrics
              </Badge>
              <h2 className="text-2xl font-extrabold sm:text-3xl text-foreground">Marketplace Statistics at a Glance</h2>
            </div>

            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4 text-center">
              <div className="p-4 bg-card rounded-xl border border-border">
                <div className="text-2xl font-black text-primary">50+</div>
                <div className="text-[11px] text-muted-foreground font-semibold mt-1">Verified Vendors</div>
              </div>
              <div className="p-4 bg-card rounded-xl border border-border">
                <div className="text-2xl font-black text-primary">1,200+</div>
                <div className="text-[11px] text-muted-foreground font-semibold mt-1">Curated Products</div>
              </div>
              <div className="p-4 bg-card rounded-xl border border-border">
                <div className="text-2xl font-black text-primary">150+</div>
                <div className="text-[11px] text-muted-foreground font-semibold mt-1">Products Added MoM</div>
              </div>
              <div className="p-4 bg-card rounded-xl border border-border">
                <div className="text-2xl font-black text-primary">$118.50</div>
                <div className="text-[11px] text-muted-foreground font-semibold mt-1">Avg Order Value</div>
              </div>
              <div className="p-4 bg-card rounded-xl border border-border">
                <div className="text-2xl font-black text-primary">3.8%</div>
                <div className="text-[11px] text-muted-foreground font-semibold mt-1">Conversion Rate</div>
              </div>
              <div className="p-4 bg-card rounded-xl border border-border">
                <div className="text-2xl font-black text-primary">42%</div>
                <div className="text-[11px] text-muted-foreground font-semibold mt-1">Repeat Buyer Rate</div>
              </div>
            </div>
          </div>
        </section>

        {/* Section 8: Marketing Activities */}
        <section id="marketing" className="scroll-mt-32">
          <div className="text-center max-w-3xl mx-auto mb-12">
            <Badge className="bg-wellness/10 text-wellness border-wellness/20 px-3 py-1 text-xs uppercase font-bold tracking-wider mb-3">
              8. Traffic Generation
            </Badge>
            <h2 className="text-3xl font-extrabold sm:text-4xl tracking-tight text-foreground">
              Our Multi-Channel Marketing Engine
            </h2>
            <p className="mt-3 text-muted-foreground text-sm sm:text-base">
              Here is how we continuously drive qualified shoppers and health enthusiasts to your marketplace listings.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {marketingActivities.map((act, i) => {
              const IconComp = act.icon;
              return (
                <Card key={i} className="border-border bg-card hover:border-wellness/40 transition-all">
                  <CardContent className="p-6 space-y-3">
                    <div className="p-3 rounded-xl bg-primary/10 text-primary w-fit">
                      <IconComp className="h-6 w-6" />
                    </div>
                    <h3 className="font-bold text-foreground text-base">{act.title}</h3>
                    <p className="text-xs text-muted-foreground leading-relaxed">{act.desc}</p>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        </section>

        {/* Section 9: Vendor Testimonials */}
        <section className="scroll-mt-32">
          <div className="rounded-3xl bg-card border border-border p-8 sm:p-12">
            <div className="text-center max-w-2xl mx-auto mb-10">
              <Badge className="bg-primary/10 text-primary border-primary/20 px-3 py-1 text-xs uppercase font-bold tracking-wider mb-2">
                9. Partner Feedback
              </Badge>
              <h2 className="text-2xl font-extrabold sm:text-3xl text-foreground">Vendor Case Study & Testimonial</h2>
            </div>

            <div className="max-w-3xl mx-auto bg-muted/40 p-8 rounded-2xl border border-border text-center space-y-4">
              <div className="flex justify-center text-amber-500 gap-1">
                {[...Array(5)].map((_, i) => (
                  <Sparkles key={i} className="h-5 w-5 fill-current" />
                ))}
              </div>
              <p className="text-base sm:text-lg italic text-foreground font-medium leading-relaxed">
                "Listing on Lifestyle Medicine Gateway allowed us to reach health-conscious customers who were genuinely looking for clean formulations. The educational context around our products significantly boosted customer confidence and basket size."
              </p>
              <div>
                <div className="font-bold text-foreground text-sm">Founder, Clean Botanical Remedies</div>
                <div className="text-xs text-muted-foreground">Australian Natural Health Brand</div>
              </div>
            </div>
          </div>
        </section>

        {/* Section 10: Future Growth Roadmap */}
        <section id="roadmap" className="scroll-mt-32">
          <div className="text-center max-w-3xl mx-auto mb-12">
            <Badge className="bg-emerald-500/10 text-emerald-600 border-emerald-500/20 px-3 py-1 text-xs uppercase font-bold tracking-wider mb-3">
              10. Long-Term Vision
            </Badge>
            <h2 className="text-3xl font-extrabold sm:text-4xl tracking-tight text-foreground">
              Future Growth Roadmap (2026–2028)
            </h2>
            <p className="mt-3 text-muted-foreground text-sm sm:text-base">
              Demonstrating our long-term trajectory and expansion plans for vendor partners.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <Card className="border-border bg-card relative overflow-hidden">
              <div className="h-2 bg-emerald-500 w-full" />
              <CardContent className="p-8 space-y-4">
                <span className="text-3xl font-black text-emerald-600">2026</span>
                <h3 className="font-bold text-foreground text-lg">Australian Launch Phase</h3>
                <ul className="space-y-2 text-xs text-muted-foreground">
                  <li className="flex items-center gap-2"><CheckCircle2 className="h-4 w-4 text-emerald-600" /> Australian Marketplace Launch</li>
                  <li className="flex items-center gap-2"><CheckCircle2 className="h-4 w-4 text-emerald-600" /> Onboard 50+ Verified Brands</li>
                  <li className="flex items-center gap-2"><CheckCircle2 className="h-4 w-4 text-emerald-600" /> Launch Recipe & Article Hub</li>
                </ul>
              </CardContent>
            </Card>

            <Card className="border-border bg-card relative overflow-hidden">
              <div className="h-2 bg-primary w-full" />
              <CardContent className="p-8 space-y-4">
                <span className="text-3xl font-black text-primary">2027</span>
                <h3 className="font-bold text-foreground text-lg">Practitioner Network & ANZ</h3>
                <ul className="space-y-2 text-xs text-muted-foreground">
                  <li className="flex items-center gap-2"><CheckCircle2 className="h-4 w-4 text-primary" /> Integrated Practitioner Directory</li>
                  <li className="flex items-center gap-2"><CheckCircle2 className="h-4 w-4 text-primary" /> Trans-Tasman Shipping Partners</li>
                  <li className="flex items-center gap-2"><CheckCircle2 className="h-4 w-4 text-primary" /> Expanded Video & Masterclass Hub</li>
                </ul>
              </CardContent>
            </Card>

            <Card className="border-border bg-card relative overflow-hidden">
              <div className="h-2 bg-amber-500 w-full" />
              <CardContent className="p-8 space-y-4">
                <span className="text-3xl font-black text-amber-600">2028</span>
                <h3 className="font-bold text-foreground text-lg">Global & Membership Hub</h3>
                <ul className="space-y-2 text-xs text-muted-foreground">
                  <li className="flex items-center gap-2"><CheckCircle2 className="h-4 w-4 text-amber-600" /> Global Vendor Expansion</li>
                  <li className="flex items-center gap-2"><CheckCircle2 className="h-4 w-4 text-amber-600" /> Lifestyle Medicine Community</li>
                  <li className="flex items-center gap-2"><CheckCircle2 className="h-4 w-4 text-amber-600" /> Telehealth Referral Platform</li>
                </ul>
              </CardContent>
            </Card>
          </div>
        </section>

        {/* Section 11: Vendor Requirements */}
        <section id="requirements" className="scroll-mt-32">
          <div className="rounded-3xl bg-card border border-border p-8 sm:p-12">
            <div className="text-center max-w-3xl mx-auto mb-10">
              <Badge className="bg-wellness/10 text-wellness border-wellness/20 px-3 py-1 text-xs uppercase font-bold tracking-wider mb-2">
                11. Quality Standards
              </Badge>
              <h2 className="text-2xl font-extrabold sm:text-3xl text-foreground">Vendor Requirements & Product Criteria</h2>
              <p className="text-xs sm:text-sm text-muted-foreground mt-2">To maintain customer trust, all vendors agree to our core health philosophy and fulfillment standards.</p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {[
                { title: "Clean Ingredients", desc: "No harmful fillers, artificial preservatives, synthetic dyes, or toxic chemicals." },
                { title: "Evidence & Quality", desc: "Products must align with natural health principles and provide transparent sourcing information." },
                { title: "Fast Dispatch", desc: "Vendor orders dispatched within 24-48 business hours with tracked shipping." },
                { title: "Clear Return Policy", desc: "Hassle-free return policy for defective or damaged goods." },
                { title: "Ethical Marketing", desc: "Honest product descriptions adhering to TGA and Australian consumer guidelines." },
                { title: "Fast Approval", desc: "Simple 3-step vendor verification process completed within 48 hours." }
              ].map((req, i) => (
                <div key={i} className="p-5 rounded-xl border border-border bg-muted/30">
                  <div className="font-bold text-sm text-foreground flex items-center gap-2">
                    <CheckSquare className="h-4 w-4 text-wellness" /> {req.title}
                  </div>
                  <p className="text-xs text-muted-foreground mt-1.5 leading-relaxed">{req.desc}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Section 12: Founder & Advisory Team */}
        <section className="scroll-mt-32">
          <div className="rounded-3xl bg-muted/40 p-8 sm:p-12 border border-border text-center max-w-4xl mx-auto space-y-6">
            <Badge className="bg-primary/10 text-primary border-primary/20 px-3 py-1 text-xs uppercase font-bold tracking-wider">
              12. Leadership & Advisory
            </Badge>
            <h2 className="text-2xl font-extrabold sm:text-3xl text-foreground">Founder & Clinical Advisory Leadership</h2>
            <p className="text-sm text-muted-foreground leading-relaxed">
              Our team consists of passionate health technology developers, clinical naturopaths, and integrative health advocates dedicated to connecting vendors with a health-seeking community.
            </p>
            <div className="flex flex-wrap justify-center gap-4 text-xs font-semibold text-foreground pt-2">
              <span className="bg-card px-4 py-2 rounded-full border border-border flex items-center gap-2">
                <Stethoscope className="h-4 w-4 text-wellness" /> Clinical Naturopathic Reviewers
              </span>
              <span className="bg-card px-4 py-2 rounded-full border border-border flex items-center gap-2">
                <Award className="h-4 w-4 text-primary" /> Experienced Health Tech Founders
              </span>
              <span className="bg-card px-4 py-2 rounded-full border border-border flex items-center gap-2">
                <ShieldCheck className="h-4 w-4 text-amber-600" /> Evidence-Based Vetting Panel
              </span>
            </div>
          </div>
        </section>

        {/* Section 13: Contact & Application */}
        <section id="contact" className="scroll-mt-32">
          <div className="rounded-3xl bg-[#1B3022] text-white p-8 sm:p-16 text-center relative overflow-hidden shadow-2xl">
            <div className="absolute inset-0 bg-gradient-to-r from-wellness/20 via-transparent to-wellness/10 opacity-50" />
            
            <div className="relative z-10 max-w-3xl mx-auto space-y-6">
              <Badge className="bg-wellness/20 text-wellness-light border-wellness/30 px-4 py-1.5 text-xs font-bold uppercase tracking-wider">
                13. Get Started Today
              </Badge>

              <h2 className="text-3xl font-extrabold sm:text-5xl text-white tracking-tight">
                Ready to Expand Your Reach Across Australia?
              </h2>

              <p className="text-base sm:text-lg text-white/80 leading-relaxed font-normal">
                Join 50+ leading natural health vendors on Lifestyle Medicine Gateway. Zero monthly subscription fees, simple setup, and instant access to health-conscious shoppers.
              </p>

              <div className="pt-4 flex flex-wrap items-center justify-center gap-4">
                <Link href="/signup?type=vendor&redirect=/vendor">
                  <Button size="lg" className="bg-wellness text-wellness-dark hover:bg-wellness-light h-14 px-10 text-lg font-bold shadow-xl transition-all hover:scale-105">
                    Apply for Vendor Account
                    <ArrowRight className="ml-2 h-5 w-5" />
                  </Button>
                </Link>
                <Link href="/contact">
                  <Button size="lg" variant="outline" className="border-white/30 text-white bg-white/10 hover:bg-white/20 h-14 px-8 text-base font-semibold backdrop-blur-md">
                    Contact Partner Team
                  </Button>
                </Link>
              </div>

              <div className="pt-8 border-t border-white/10 grid grid-cols-1 sm:grid-cols-3 gap-4 text-xs text-white/70">
                <div>
                  <span className="font-bold text-white block mb-0.5">Vendor Enquiries</span>
                  vendors@lifestylemedicinegateway.com
                </div>
                <div>
                  <span className="font-bold text-white block mb-0.5">Official Website</span>
                  lifestylemedicinegateway.com
                </div>
                <div>
                  <span className="font-bold text-white block mb-0.5">Application Time</span>
                  Instant Setup (&lt; 5 minutes)
                </div>
              </div>
            </div>
          </div>
        </section>
      </div>
    </div>
  );
}
