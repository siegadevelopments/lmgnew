import { Button } from "@/components/ui/button";

export function CTASection() {
  return (
    <section className="relative overflow-hidden bg-primary py-16 sm:py-20">
      {/* Decorative circles */}
      <div className="absolute -right-20 -top-20 h-64 w-64 rounded-full bg-wellness/20 blur-3xl" />
      <div className="absolute -bottom-20 -left-20 h-64 w-64 rounded-full bg-calm/20 blur-3xl" />

      <div className="relative z-10 mx-auto max-w-7xl px-4 text-center sm:px-6 lg:px-8">
        <h2 className="text-3xl font-bold tracking-tight text-primary-foreground sm:text-4xl">
          Check our shop for more products
        </h2>
        <p className="mx-auto mt-6 max-w-xl text-lg leading-8 text-primary-foreground/80">
          Getting equipped for a healthy lifestyle needs good products. Discover our full range of curated wellness items.
        </p>
        <div className="mt-8 flex flex-wrap items-center justify-center gap-4">
          <Button variant="hero" size="lg" className="bg-background text-foreground hover:bg-background/90">
            Become a Vendor
          </Button>
          <Button variant="hero-outline" size="lg">
            Learn More
          </Button>
        </div>
      </div>
    </section>
  );
}
