import { createFileRoute, Link } from "@tanstack/react-router";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { 
  CheckCircle2, 
  Zap, 
  ShieldCheck, 
  DollarSign, 
  BarChart3, 
  Users, 
  Rocket, 
  Heart,
  ArrowRight
} from "lucide-react";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/sell-with-us")({
  component: SellWithUsPage,
  head: () => ({
    meta: [
      { title: "Sell With Us — Hassle-Free & Profitable | LMG" },
      { name: "description", content: "Sell your wellness products on Lifestyle Medicine Gateway with zero monthly fees and free advertising." },
    ],
  }),
});

function SellWithUsPage() {
  return (
    <div className="min-h-screen bg-background">
      <main>
        {/* Hero Section */}
        <section className="relative overflow-hidden bg-primary py-24 sm:py-32">
          <div className="absolute inset-0 bg-[url('https://images.unsplash.com/photo-1542744173-8e7e53415bb0?q=80&w=2070')] bg-cover bg-center opacity-10" />
          <div className="absolute -right-20 -top-20 h-96 w-96 rounded-full bg-wellness/20 blur-3xl animate-pulse" />
          <div className="absolute -bottom-20 -left-20 h-96 w-96 rounded-full bg-calm/20 blur-3xl animate-pulse" />
          
          <div className="relative z-10 mx-auto max-w-7xl px-4 text-center sm:px-6 lg:px-8">
            <Badge className="mb-6 bg-wellness-light text-wellness-dark border-none px-4 py-1.5 text-sm font-bold animate-bounce">
              Now Accepting New Vendors
            </Badge>
            <h1 className="text-4xl font-extrabold tracking-tight text-primary-foreground sm:text-6xl lg:text-7xl">
              Sell With Us — <span className="text-wellness-light">Hassle-Free</span> and Profitable
            </h1>
            <p className="mx-auto mt-8 max-w-2xl text-xl leading-relaxed text-primary-foreground/90">
              Reach a passionate audience interested in natural, holistic, and sustainable wellness solutions — all without paying any upfront fees.
            </p>
            <div className="mt-12 flex flex-wrap justify-center gap-6">
              <Link to="/signup">
                <Button size="lg" className="bg-wellness text-wellness-dark hover:bg-wellness-light h-14 px-10 text-lg shadow-2xl shadow-wellness/20">
                  Start Selling for Free
                  <ArrowRight className="ml-2 h-5 w-5" />
                </Button>
              </Link>
              <Button variant="outline" size="lg" className="h-14 px-10 text-lg border-primary-foreground/30 text-primary-foreground hover:bg-primary-foreground/10">
                View FAQ
              </Button>
            </div>
          </div>
        </section>

        {/* Value Proposition Grid */}
        <section className="py-24 bg-surface">
          <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
            <div className="text-center mb-16">
              <h2 className="text-3xl font-bold tracking-tight text-foreground sm:text-4xl">
                Why Partner With LMG?
              </h2>
              <div className="mt-4 mx-auto h-1.5 w-24 rounded-full bg-primary" />
            </div>

            <div className="grid gap-8 sm:grid-cols-2 lg:grid-cols-3">
              <Card className="border-none shadow-soft bg-white/50 backdrop-blur-sm transition-transform hover:-translate-y-2">
                <CardContent className="pt-8 text-center space-y-4">
                  <div className="mx-auto h-16 w-16 rounded-2xl bg-wellness/10 flex items-center justify-center text-wellness-dark">
                    <Zap className="h-8 w-8" />
                  </div>
                  <h3 className="text-xl font-bold">Free Advertising</h3>
                  <p className="text-muted-foreground leading-relaxed">
                    We promote your products through our newsletter, social channels, and blog. We handle the marketing, you handle the sales.
                  </p>
                </CardContent>
              </Card>

              <Card className="border-none shadow-soft bg-white/50 backdrop-blur-sm transition-transform hover:-translate-y-2">
                <CardContent className="pt-8 text-center space-y-4">
                  <div className="mx-auto h-16 w-16 rounded-2xl bg-calm/10 flex items-center justify-center text-calm-dark">
                    <DollarSign className="h-8 w-8" />
                  </div>
                  <h3 className="text-xl font-bold">No Monthly Fees</h3>
                  <p className="text-muted-foreground leading-relaxed">
                    Zero subscriptions or hidden charges. You only pay a small commission when you make a sale. No risk, all reward.
                  </p>
                </CardContent>
              </Card>

              <Card className="border-none shadow-soft bg-white/50 backdrop-blur-sm transition-transform hover:-translate-y-2">
                <CardContent className="pt-8 text-center space-y-4">
                  <div className="mx-auto h-16 w-16 rounded-2xl bg-primary/10 flex items-center justify-center text-primary">
                    <ShieldCheck className="h-8 w-8" />
                  </div>
                  <h3 className="text-xl font-bold">We Handle the Tech</h3>
                  <p className="text-muted-foreground leading-relaxed">
                    From payment processing to SEO and performance — we take care of the tech so you can focus on your craft.
                  </p>
                </CardContent>
              </Card>
            </div>
          </div>
        </section>

        {/* How it Works */}
        <section className="py-24 bg-white relative overflow-hidden">
          <div className="absolute right-0 top-0 h-full w-1/3 bg-primary/5 -skew-x-12 translate-x-1/2" />
          
          <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 relative z-10">
            <div className="grid lg:grid-cols-2 gap-16 items-center">
              <div>
                <h2 className="text-4xl font-bold tracking-tight text-foreground mb-8">
                  Fast, Simple, and Effective <br/>
                  <span className="text-primary">How It Works</span>
                </h2>
                <div className="space-y-8">
                  {[
                    { step: "01", title: "Sign Up as a Vendor", desc: "Create your free vendor account in minutes. No credit card required." },
                    { step: "02", title: "Upload Your Offerings", desc: "List your products, services, or even digital content like videos and articles." },
                    { step: "03", title: "We Publish & Promote", desc: "Our team reviews and optimizes your listings for maximum visibility." },
                    { step: "04", title: "You Get Paid Directly", desc: "Automated payouts directly to your account. Fast and secure." },
                  ].map((item) => (
                    <div key={item.step} className="flex gap-6 group">
                      <div className="text-5xl font-black text-primary/10 transition-colors group-hover:text-primary/20 shrink-0">
                        {item.step}
                      </div>
                      <div>
                        <h4 className="text-xl font-bold mb-2 group-hover:text-primary transition-colors">{item.title}</h4>
                        <p className="text-muted-foreground">{item.desc}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
              <div className="relative">
                <div className="aspect-square rounded-3xl overflow-hidden shadow-2xl border-8 border-white">
                  <img 
                    src="https://images.unsplash.com/photo-1441986300917-64674bd600d8?q=80&w=2070" 
                    alt="Store" 
                    className="h-full w-full object-cover"
                  />
                </div>
                <div className="absolute -bottom-10 -left-10 bg-white p-8 rounded-2xl shadow-xl border border-border/50 max-w-xs">
                  <div className="flex items-center gap-3 mb-4">
                    <div className="h-10 w-10 rounded-full bg-emerald-500/10 flex items-center justify-center text-emerald-600">
                      <BarChart3 className="h-6 w-6" />
                    </div>
                    <p className="font-bold text-sm">Real-time Analytics</p>
                  </div>
                  <p className="text-xs text-muted-foreground leading-relaxed">
                    Track your sales, visitor growth, and customer engagement directly from your vendor dashboard.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Who Should Join? */}
        <section className="py-24 bg-surface relative">
          <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
            <div className="text-center mb-16">
              <h2 className="text-3xl font-bold tracking-tight text-foreground sm:text-4xl">
                Who Should Join Our Community?
              </h2>
              <p className="mt-4 text-muted-foreground text-lg max-w-2xl mx-auto">
                We are building a holistic ecosystem. If you care about wellness, we want you.
              </p>
            </div>

            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4">
              {[
                { label: "Wellness Brands", icon: ShoppingBag },
                { label: "Health Coaches", icon: Users },
                { label: "Supplement Sellers", icon: Zap },
                { label: "Yoga Creators", icon: Heart },
                { label: "Natural Advocates", icon: ShieldCheck },
              ].map((cat) => (
                <div key={cat.label} className="bg-white p-6 rounded-2xl text-center shadow-sm border border-border/50 hover:border-primary transition-all group">
                  <cat.icon className="h-8 w-8 mx-auto mb-4 text-muted-foreground group-hover:text-primary transition-colors" />
                  <p className="text-sm font-bold">{cat.label}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Grow Your Brand */}
        <section className="py-24 bg-primary text-primary-foreground relative overflow-hidden">
          <div className="absolute inset-0 opacity-10 bg-[radial-gradient(circle_at_center,_var(--tw-gradient-stops))] from-white via-transparent to-transparent" />
          <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 text-center relative z-10">
            <div className="inline-flex items-center gap-2 rounded-full bg-white/10 px-4 py-1.5 text-xs font-semibold backdrop-blur-sm mb-8">
              <Rocket className="h-4 w-4" />
              Scale Your Wellness Business
            </div>
            <h2 className="text-4xl font-bold tracking-tight sm:text-5xl mb-8">
              We Don't Just List Your Products. <br/>
              <span className="text-wellness-light">We Tell Your Story.</span>
            </h2>
            <p className="mx-auto max-w-2xl text-lg text-primary-foreground/80 mb-12">
              Our marketing team works with you to create blog features, social highlights, and exclusive spotlights to ensure your brand gets the attention it deserves.
            </p>
            <Link to="/signup">
              <Button size="lg" className="bg-white text-primary hover:bg-white/90 h-14 px-12 text-xl font-black">
                Apply to Become a Vendor
              </Button>
            </Link>
            <p className="mt-6 text-sm text-primary-foreground/50">
              No fees. No stress. Just real growth.
            </p>
          </div>
        </section>
      </main>
    </div>
  );
}

function Badge({ children, className }: { children: React.ReactNode; className?: string }) {
  return (
    <div className={cn("inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-semibold transition-colors focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2", className)}>
      {children}
    </div>
  );
}

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
