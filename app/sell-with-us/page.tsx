import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import {
  Zap,
  ShieldCheck,
  DollarSign,
  BarChart3,
  Users,
  Rocket,
  Heart,
  ArrowRight,
} from "lucide-react";
import { cn } from "@/lib/utils";

export const metadata = {
  title: "Sell With Us — Hassle-Free & Profitable | LMG",
  description: "Sell your wellness products on Lifestyle Medicine Gateway with zero monthly fees and free advertising.",
};

function ShoppingBag(props: any) {
  return (
    <svg
      {...props}
      xmlns="http://www.w3.org/2000/svg"
      width="24"
      height="24"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M6 2 3 6v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6l-3-4Z" />
      <path d="M3 6h18" />
      <path d="M16 10a4 4 0 0 1-8 0" />
    </svg>
  );
}

export default function SellWithUsPage() {
  return (
    <div className="min-h-screen bg-background">
      <main>
        {/* Hero Section */}
        <section className="relative overflow-hidden bg-[#1B3022] py-28 sm:py-36">
          {/* Animated Background Elements */}
          <div className="absolute inset-0 bg-[url('https://images.unsplash.com/photo-1542744173-8e7e53415bb0?q=80&w=2070')] bg-cover bg-center opacity-15 mix-blend-overlay" />
          <div className="absolute inset-0 bg-gradient-to-b from-black/40 via-transparent to-[#1B3022]" />
          
          <div className="absolute -right-20 -top-20 h-96 w-96 rounded-full bg-wellness/10 blur-[120px] animate-pulse" />
          <div className="absolute -bottom-20 -left-20 h-96 w-96 rounded-full bg-wellness-light/5 blur-[120px] animate-pulse" />

          <div className="relative z-10 mx-auto max-w-7xl px-4 text-center sm:px-6 lg:px-8">
            <div className="inline-flex items-center gap-2 rounded-full bg-wellness/20 border border-wellness/30 px-4 py-1.5 text-xs font-bold text-wellness-light backdrop-blur-md mb-8 animate-fade-in">
              <span className="relative flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-wellness opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2 w-2 bg-wellness"></span>
              </span>
              Now Accepting New Vendors
            </div>
            
            <h1 className="text-5xl font-black tracking-tight text-white sm:text-7xl lg:text-8xl text-balance">
              Sell With Us — <br />
              <span className="bg-gradient-to-r from-wellness-light via-emerald-300 to-wellness-light bg-clip-text text-transparent">Hassle-Free</span> and Profitable
            </h1>
            
            <p className="mx-auto mt-8 max-w-2xl text-lg sm:text-xl leading-relaxed text-white/80 text-balance">
              Reach a passionate audience interested in natural, holistic, and sustainable wellness
              solutions — <span className="text-white font-semibold">all without paying any upfront fees.</span>
            </p>
            
            <div className="mt-12 flex flex-wrap justify-center gap-4 sm:gap-6">
              <Link href="/signup">
                <Button
                  size="lg"
                  className="bg-wellness text-wellness-dark hover:bg-wellness-light h-14 px-10 text-lg font-bold shadow-[0_20px_50px_rgba(107,142,35,0.3)] transition-all hover:scale-105 active:scale-95"
                >
                  Start Selling for Free
                  <ArrowRight className="ml-2 h-5 w-5" />
                </Button>
              </Link>
              <Button
                variant="outline"
                size="lg"
                className="h-14 px-10 text-lg border-white/20 bg-white/5 text-white backdrop-blur-sm hover:bg-white/10 hover:border-white/40 transition-all"
              >
                View FAQ
              </Button>
            </div>

            {/* Quick Trust Signals */}
            <div className="mt-16 flex items-center justify-center gap-8 text-white/40 grayscale opacity-50">
              <div className="text-sm font-bold tracking-widest uppercase">Trusted By 100+ Wellness Brands</div>
            </div>
          </div>
        </section>

        {/* Value Proposition Grid */}
        <section className="py-32 bg-[#F8FAF8] relative overflow-hidden">
          <div className="absolute left-0 top-0 h-full w-full opacity-30 pointer-events-none">
            <div className="absolute top-10 left-10 w-64 h-64 bg-wellness/5 rounded-full blur-3xl" />
            <div className="absolute bottom-10 right-10 w-96 h-96 bg-primary/5 rounded-full blur-3xl" />
          </div>

          <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 relative">
            <div className="text-center mb-20">
              <h2 className="text-4xl font-black tracking-tight text-foreground sm:text-5xl text-balance">
                Why Partner With LMG?
              </h2>
              <p className="mt-6 text-lg text-muted-foreground max-w-2xl mx-auto">
                We've built the ultimate marketplace for wellness professionals who want to grow without the technical headache.
              </p>
              <div className="mt-8 mx-auto h-1 w-20 rounded-full bg-wellness" />
            </div>

            <div className="grid gap-10 sm:grid-cols-2 lg:grid-cols-3">
              <Card className="border-none shadow-[0_10px_40px_rgba(0,0,0,0.04)] bg-white transition-all hover:shadow-[0_20px_60px_rgba(0,0,0,0.08)] hover:-translate-y-2 group">
                <CardContent className="pt-10 pb-10 px-8 text-center space-y-6">
                  <div className="mx-auto h-20 w-20 rounded-3xl bg-wellness/10 flex items-center justify-center text-wellness-dark group-hover:bg-wellness group-hover:text-white transition-all duration-500">
                    <Zap className="h-10 w-10" />
                  </div>
                  <h3 className="text-2xl font-bold">Free Advertising</h3>
                  <p className="text-muted-foreground leading-relaxed">
                    We promote your products through our newsletter, social channels, and blog. We
                    handle the marketing, you handle the sales.
                  </p>
                </CardContent>
              </Card>

              <Card className="border-none shadow-[0_10px_40px_rgba(0,0,0,0.04)] bg-white transition-all hover:shadow-[0_20px_60px_rgba(0,0,0,0.08)] hover:-translate-y-2 group">
                <CardContent className="pt-10 pb-10 px-8 text-center space-y-6">
                  <div className="mx-auto h-20 w-20 rounded-3xl bg-emerald-50 flex items-center justify-center text-emerald-600 group-hover:bg-emerald-500 group-hover:text-white transition-all duration-500">
                    <DollarSign className="h-10 w-10" />
                  </div>
                  <h3 className="text-2xl font-bold">No Monthly Fees</h3>
                  <p className="text-muted-foreground leading-relaxed">
                    Zero subscriptions or hidden charges. You only pay a small commission when you
                    make a sale. No risk, all reward.
                  </p>
                </CardContent>
              </Card>

              <Card className="border-none shadow-[0_10px_40px_rgba(0,0,0,0.04)] bg-white transition-all hover:shadow-[0_20px_60px_rgba(0,0,0,0.08)] hover:-translate-y-2 group">
                <CardContent className="pt-10 pb-10 px-8 text-center space-y-6">
                  <div className="mx-auto h-20 w-20 rounded-3xl bg-[#1B3022]/5 flex items-center justify-center text-[#1B3022] group-hover:bg-[#1B3022] group-hover:text-white transition-all duration-500">
                    <ShieldCheck className="h-10 w-10" />
                  </div>
                  <h3 className="text-2xl font-bold">We Handle the Tech</h3>
                  <p className="text-muted-foreground leading-relaxed">
                    From payment processing to SEO and performance — we take care of the tech so you
                    can focus on your craft.
                  </p>
                </CardContent>
              </Card>
            </div>
          </div>
        </section>

        {/* How it Works */}
        <section className="py-32 bg-white relative overflow-hidden">
          <div className="absolute right-0 top-0 h-full w-1/3 bg-[#F0F4F0] -skew-x-12 translate-x-1/2" />

          <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 relative z-10">
            <div className="grid lg:grid-cols-2 gap-24 items-center">
              <div className="space-y-12">
                <div className="space-y-4">
                  <h2 className="text-5xl font-black tracking-tight text-foreground text-balance leading-tight">
                    Fast, Simple, and Effective <br />
                    <span className="text-wellness">How It Works</span>
                  </h2>
                  <p className="text-lg text-muted-foreground leading-relaxed">
                    We've streamlined the onboarding process so you can start selling in days, not weeks.
                  </p>
                </div>

                <div className="space-y-10">
                  {[
                    {
                      step: "01",
                      title: "Sign Up as a Vendor",
                      desc: "Create your free vendor account in minutes. No credit card required.",
                    },
                    {
                      step: "02",
                      title: "Upload Your Offerings",
                      desc: "List your products, services, or even digital content like videos and articles.",
                    },
                    {
                      step: "03",
                      title: "We Publish & Promote",
                      desc: "Our team reviews and optimizes your listings for maximum visibility.",
                    },
                    {
                      step: "04",
                      title: "You Get Paid Directly",
                      desc: "Automated payouts directly to your account. Fast and secure.",
                    },
                  ].map((item) => (
                    <div key={item.step} className="flex gap-8 group">
                      <div className="text-6xl font-black text-wellness/5 transition-all duration-500 group-hover:text-wellness/10 group-hover:scale-110 shrink-0 select-none">
                        {item.step}
                      </div>
                      <div className="pt-2">
                        <h4 className="text-2xl font-bold mb-3 group-hover:text-wellness transition-colors">
                          {item.title}
                        </h4>
                        <p className="text-muted-foreground leading-relaxed">{item.desc}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
              
              <div className="relative">
                <div className="aspect-[4/5] rounded-[2rem] overflow-hidden shadow-2xl border-[12px] border-[#F8FAF8] rotate-2 transition-transform hover:rotate-0 duration-700">
                  <img
                    src="https://images.unsplash.com/photo-1441986300917-64674bd600d8?q=80&w=2070"
                    alt="Store"
                    className="h-full w-full object-cover"
                  />
                </div>
                
                {/* Floating Card */}
                <div className="absolute -bottom-12 -left-12 bg-white/95 backdrop-blur-md p-10 rounded-3xl shadow-[0_30px_60px_rgba(0,0,0,0.12)] border border-white/50 max-w-sm animate-float">
                  <div className="flex items-center gap-4 mb-6">
                    <div className="h-14 w-14 rounded-2xl bg-wellness/10 flex items-center justify-center text-wellness">
                      <BarChart3 className="h-8 w-8" />
                    </div>
                    <div>
                      <p className="font-black text-lg">98% Success</p>
                      <p className="text-xs text-muted-foreground uppercase tracking-widest font-bold">Vendor Satisfaction</p>
                    </div>
                  </div>
                  <p className="text-sm text-muted-foreground leading-relaxed">
                    Our platform provides powerful tools to track growth and manage your wellness brand with ease.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Who Should Join? */}
        <section className="py-32 bg-[#F8FAF8] relative overflow-hidden">
          <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
            <div className="text-center mb-20">
              <h2 className="text-4xl font-black tracking-tight text-foreground sm:text-5xl text-balance">
                Who Should Join Our Community?
              </h2>
              <p className="mt-6 text-muted-foreground text-lg max-w-2xl mx-auto leading-relaxed">
                We are building a holistic ecosystem of creators, practitioners, and brands who care about authentic wellness.
              </p>
            </div>

            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-6">
              {[
                { label: "Wellness Brands", icon: ShoppingBag, color: "bg-wellness/10 text-wellness" },
                { label: "Health Coaches", icon: Users, color: "bg-blue-50 text-blue-600" },
                { label: "Supplement Sellers", icon: Zap, color: "bg-amber-50 text-amber-600" },
                { label: "Yoga Creators", icon: Heart, color: "bg-rose-50 text-rose-600" },
                { label: "Natural Advocates", icon: ShieldCheck, color: "bg-emerald-50 text-emerald-600" },
              ].map((cat) => (
                <div
                  key={cat.label}
                  className="bg-white p-10 rounded-[2rem] text-center shadow-[0_10px_30px_rgba(0,0,0,0.03)] border border-border/50 hover:border-wellness hover:shadow-xl transition-all group"
                >
                  <div className={cn("h-16 w-16 mx-auto mb-6 rounded-2xl flex items-center justify-center transition-transform group-hover:scale-110", cat.color)}>
                    <cat.icon className="h-8 w-8" />
                  </div>
                  <p className="text-sm font-black uppercase tracking-wider">{cat.label}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Grow Your Brand */}
        <section className="py-32 bg-[#1B3022] text-white relative overflow-hidden">
          <div className="absolute inset-0 opacity-20 bg-[radial-gradient(circle_at_center,_var(--tw-gradient-stops))] from-wellness via-transparent to-transparent" />
          <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 text-center relative z-10">
            <div className="inline-flex items-center gap-2 rounded-full bg-white/10 border border-white/20 px-6 py-2 text-sm font-bold backdrop-blur-md mb-10">
              <Rocket className="h-5 w-5 text-wellness-light" />
              Scale Your Wellness Business
            </div>
            <h2 className="text-5xl font-black tracking-tight sm:text-7xl mb-10 text-balance leading-[1.1]">
              We Don't Just List Products. <br />
              <span className="bg-gradient-to-r from-wellness-light to-emerald-300 bg-clip-text text-transparent">We Tell Your Story.</span>
            </h2>
            <p className="mx-auto max-w-2xl text-xl text-white/70 mb-16 leading-relaxed">
              Our marketing team works with you to create blog features, social highlights, and
              exclusive spotlights to ensure your brand gets the attention it deserves.
            </p>
            <Link href="/signup">
              <Button
                size="lg"
                className="bg-wellness text-wellness-dark hover:bg-wellness-light h-16 px-16 text-2xl font-black shadow-[0_20px_50px_rgba(107,142,35,0.4)] transition-all hover:scale-105 active:scale-95"
              >
                Apply to Become a Vendor
              </Button>
            </Link>
            <p className="mt-8 text-sm font-bold text-white/30 uppercase tracking-[0.3em]">
              No fees. No stress. Just real growth.
            </p>
          </div>
        </section>
      </main>
    </div>
  );
}
