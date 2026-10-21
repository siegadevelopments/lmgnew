import { notFound } from "next/navigation";
import { jsonLd } from "@/lib/security";
import { ProductCard } from "@/components/ProductCard";
import { Breadcrumbs } from "@/components/Breadcrumbs";
import { FaqList } from "@/components/FaqList";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { guideConfig } from "@/lib/guide-config";
import { getGuideProducts } from "@/lib/server-data";

// Server component: recommendations, FAQ answers and JSON-LD are rendered into the HTML so
// crawlers see the full guide without running JavaScript. ISR keeps products fresh.
export const revalidate = 3600;

// Without this the route is fully dynamic: nothing is cached and `revalidate` has no effect.
// Prebuilding every known slug makes it ISR, so if a later refresh fails (the data helpers throw
// after retries) visitors and crawlers keep getting the last good page rather than an error.
// Unknown slugs still render on demand and get a real 404 below.
export function generateStaticParams() {
  return Object.keys(guideConfig).map((slug) => ({ slug }));
}

export default async function GuideDetailPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const config = guideConfig[slug];
  if (!config) notFound();

  const products = await getGuideProducts(config.categorySlug, config.keywords);

  return (
    <div className="bg-background min-h-screen">
      {/* Guide Header */}
      <div className="bg-surface border-b border-border py-10 sm:py-14">
        <div className="mx-auto max-w-3xl px-4 sm:px-6 lg:px-8">
          <Breadcrumbs
            items={[
              { label: "Buying Guides", href: "/guides" },
              { label: config.title },
            ]}
          />
          <div className="mt-4">
            <span className="text-4xl">{config.icon}</span>
            <h1 className="mt-3 text-3xl font-bold tracking-tight text-foreground sm:text-4xl">
              {config.title}
            </h1>
            <div className="mt-4 flex flex-wrap items-center gap-3 text-sm text-muted-foreground">
              <span>By {config.author}</span>
              <span>•</span>
              <span>{config.authorCredentials}</span>
              <span>•</span>
              <span>{config.readTime}</span>
              <span>•</span>
              <span>Updated {config.updated}</span>
            </div>
            <Link
              href={`/categories/${config.categorySlug}`}
              className="mt-3 inline-block text-xs font-medium text-primary bg-primary/5 px-3 py-1 rounded-full hover:bg-primary/10 transition-colors"
            >
              {config.category}
            </Link>
          </div>
        </div>
      </div>

      {/* Guide Content */}
      <div className="mx-auto max-w-3xl px-4 py-10 sm:px-6 lg:px-8">
        {/* Introduction */}
        <section>
          <h2 className="text-xl font-bold text-foreground">Why This Guide Matters</h2>
          <p className="mt-4 text-base text-muted-foreground leading-relaxed">
            {config.intro}
          </p>
        </section>

        {/* Quick Picks */}
        {products.length > 0 && (
          <section className="mt-12">
            <h2 className="text-xl font-bold text-foreground">Our Top Picks</h2>
            <p className="mt-2 text-sm text-muted-foreground">
              Our expert-reviewed recommendations from the Lifestyle Medicine Gateway marketplace
            </p>
            <div className="mt-6 grid grid-cols-2 sm:grid-cols-3 gap-3">
              {products.slice(0, 3).map((product: any) => (
                <ProductCard key={product.id} product={product} />
              ))}
            </div>
          </section>
        )}

        {/* How We Chose */}
        <section className="mt-12">
          <h2 className="text-xl font-bold text-foreground">How We Chose These Products</h2>
          <p className="mt-4 text-base text-muted-foreground leading-relaxed">
            {config.howWeChose}
          </p>
        </section>

        {/* All Recommended Products */}
        {products.length > 3 && (
          <section className="mt-12">
            <h2 className="text-xl font-bold text-foreground">All Recommended Products</h2>
            <div className="mt-6 grid grid-cols-2 sm:grid-cols-3 gap-3">
              {products.map((product: any) => (
                <ProductCard key={product.id} product={product} />
              ))}
            </div>
          </section>
        )}

        {/* FAQs */}
        {config.faqs.length > 0 && (
          <section className="mt-12">
            <h2 className="text-xl font-bold text-foreground">Frequently Asked Questions</h2>
            <div className="mt-6">
              <FaqList faqs={config.faqs} />
            </div>
            {/* FAQ Schema */}
            <script
              type="application/ld+json"
              dangerouslySetInnerHTML={{
                __html: jsonLd({
                  "@context": "https://schema.org",
                  "@type": "FAQPage",
                  mainEntity: config.faqs.map((faq) => ({
                    "@type": "Question",
                    name: faq.question,
                    acceptedAnswer: {
                      "@type": "Answer",
                      text: faq.answer,
                    },
                  })),
                }),
              }}
            />
          </section>
        )}

        {/* CTA */}
        <section className="mt-12 rounded-2xl bg-gradient-to-br from-primary/5 to-wellness/5 border border-primary/10 p-8 text-center">
          <h2 className="text-xl font-bold text-foreground">Ready to Shop?</h2>
          <p className="mt-2 text-sm text-muted-foreground">
            Browse our full range of {config.category.toLowerCase()} products from trusted brands.
          </p>
          <div className="mt-6 flex flex-wrap justify-center gap-3">
            <Link href={`/categories/${config.categorySlug}`}>
              <Button size="lg" className="font-bold">
                {config.ctaText}
              </Button>
            </Link>
            <Link href="/products">
              <Button variant="outline" size="lg" className="font-bold">
                Shop All Products
              </Button>
            </Link>
          </div>
        </section>
      </div>
    </div>
  );
}
