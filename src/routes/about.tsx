import { createFileRoute, Link } from "@tanstack/react-router";
import { Button } from "@/components/ui/button";

const values = [
  {
    icon: (
      <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z" />
      </svg>
    ),
    title: "Evidence-Based",
    description: "Every product and vendor is vetted against lifestyle medicine standards for quality and efficacy.",
  },
  {
    icon: (
      <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
        <circle cx="9" cy="7" r="4" />
        <path d="M23 21v-2a4 4 0 0 0-3-3.87M16 3.13a4 4 0 0 1 0 7.75" />
      </svg>
    ),
    title: "Community First",
    description: "We bring together practitioners, vendors, and wellness seekers in a trusted collaborative ecosystem.",
  },
  {
    icon: (
      <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <circle cx="12" cy="12" r="10" />
        <path d="M12 16v-4M12 8h.01" />
      </svg>
    ),
    title: "Transparency",
    description: "Full ingredient lists, certifications, and honest reviews so you can make informed health decisions.",
  },
  {
    icon: (
      <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
      </svg>
    ),
    title: "Trust & Safety",
    description: "Secure transactions, verified vendors, and quality guarantees protect every purchase.",
  },
];

const stats = [
  { value: "500+", label: "Wellness Products" },
  { value: "120+", label: "Trusted Vendors" },
  { value: "10K+", label: "Happy Customers" },
  { value: "200+", label: "Expert Articles" },
];

export const Route = createFileRoute("/about")({
  head: () => ({
    meta: [
      { title: "About — Lifestyle Medicine Gateway" },
      { name: "description", content: "Learn about Lifestyle Medicine Gateway and our mission to connect people with wellness products and services." },
    ],
  }),
  component: AboutPage,
});

function AboutPage() {
  return (
    <div>
      {/* Hero */}
      <section className="relative overflow-hidden bg-gradient-to-br from-primary/5 via-wellness-muted to-background py-20 sm:py-28">
        <div className="absolute -right-40 -top-40 h-96 w-96 rounded-full bg-primary/5 blur-3xl" />
        <div className="absolute -bottom-40 -left-40 h-96 w-96 rounded-full bg-calm/5 blur-3xl" />
        <div className="relative mx-auto max-w-4xl px-4 text-center sm:px-6 lg:px-8">
          <span className="inline-block rounded-full bg-primary/10 px-4 py-1.5 text-xs font-semibold text-primary">
            Our Story
          </span>
          <h1 className="mt-5 text-4xl font-extrabold tracking-tight text-foreground sm:text-5xl">
            Making Wellness{" "}
            <span className="text-gradient-wellness">Accessible</span> to All
          </h1>
          <p className="mx-auto mt-5 max-w-2xl text-base leading-relaxed text-muted-foreground sm:text-lg">
            Lifestyle Medicine Gateway is your trusted marketplace for wellness
            products, services, and expert content. We connect health-conscious
            individuals with verified vendors offering quality supplements,
            fitness equipment, mental health resources, and lifestyle coaching.
          </p>
        </div>
      </section>

      {/* Stats */}
      <section className="border-b border-border bg-card py-12">
        <div className="mx-auto max-w-5xl px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-2 gap-6 sm:grid-cols-4">
            {stats.map((stat) => (
              <div key={stat.label} className="text-center">
                <p className="text-3xl font-extrabold text-primary sm:text-4xl">
                  {stat.value}
                </p>
                <p className="mt-1 text-sm text-muted-foreground">
                  {stat.label}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Mission */}
      <section className="py-16 sm:py-20">
        <div className="mx-auto max-w-5xl px-4 sm:px-6 lg:px-8">
          <div className="grid gap-12 lg:grid-cols-2 lg:items-center">
            <div>
              <h2 className="text-2xl font-bold tracking-tight text-foreground sm:text-3xl">
                Our Mission
              </h2>
              <p className="mt-4 text-muted-foreground leading-relaxed">
                We believe that access to quality lifestyle medicine should be
                straightforward. Our platform empowers people to discover
                trusted products and services that support their journey toward
                better health.
              </p>
              <p className="mt-4 text-muted-foreground leading-relaxed">
                Founded by a team of wellness practitioners and technologists,
                we're building the bridge between evidence-based lifestyle
                medicine and everyday wellness consumers.
              </p>
              <div className="mt-8 flex gap-3">
                <Button asChild>
                  <Link to="/products">Browse Products</Link>
                </Button>
                <Button variant="outline" asChild>
                  <Link to="/contact">Contact Us</Link>
                </Button>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="rounded-2xl bg-wellness-muted p-8 text-center">
                <span className="text-4xl">🌿</span>
                <p className="mt-3 text-sm font-semibold text-foreground">
                  Natural Products
                </p>
              </div>
              <div className="rounded-2xl bg-primary/5 p-8 text-center mt-6">
                <span className="text-4xl">🧠</span>
                <p className="mt-3 text-sm font-semibold text-foreground">
                  Mental Health
                </p>
              </div>
              <div className="rounded-2xl bg-calm/10 p-8 text-center">
                <span className="text-4xl">💪</span>
                <p className="mt-3 text-sm font-semibold text-foreground">
                  Fitness
                </p>
              </div>
              <div className="rounded-2xl bg-warm/10 p-8 text-center mt-6">
                <span className="text-4xl">🥗</span>
                <p className="mt-3 text-sm font-semibold text-foreground">
                  Nutrition
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Values */}
      <section className="bg-surface py-16 sm:py-20">
        <div className="mx-auto max-w-5xl px-4 sm:px-6 lg:px-8">
          <div className="text-center">
            <h2 className="text-2xl font-bold tracking-tight text-foreground sm:text-3xl">
              What We Stand For
            </h2>
            <p className="mt-2 text-sm text-muted-foreground">
              Our core values guide everything we do
            </p>
          </div>

          <div className="mt-12 grid gap-6 sm:grid-cols-2">
            {values.map((v) => (
              <div
                key={v.title}
                className="flex gap-4 rounded-xl border border-border bg-card p-6 shadow-soft transition-all duration-300 hover:shadow-card"
              >
                <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-primary/10 text-primary">
                  {v.icon}
                </div>
                <div>
                  <h3 className="text-base font-semibold text-foreground">
                    {v.title}
                  </h3>
                  <p className="mt-1 text-sm leading-relaxed text-muted-foreground">
                    {v.description}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-16 sm:py-20">
        <div className="mx-auto max-w-3xl px-4 text-center sm:px-6 lg:px-8">
          <h2 className="text-2xl font-bold tracking-tight text-foreground sm:text-3xl">
            Join Our Community
          </h2>
          <p className="mt-3 text-muted-foreground">
            Whether you're looking for supplements, seeking wellness services,
            or want to become a vendor, Lifestyle Medicine Gateway is here to
            support your health journey.
          </p>
          <div className="mt-8 flex flex-wrap justify-center gap-3">
            <Button size="lg" asChild>
              <Link to="/signup">Get Started</Link>
            </Button>
            <Button variant="outline" size="lg" asChild>
              <Link to="/vendors">Meet Our Vendors</Link>
            </Button>
          </div>
        </div>
      </section>
    </div>
  );
}