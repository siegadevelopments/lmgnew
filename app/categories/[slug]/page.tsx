import { notFound } from "next/navigation";
import { jsonLd } from "@/lib/security";
import { ProductCard } from "@/components/ProductCard";
import { Breadcrumbs } from "@/components/Breadcrumbs";
import { FaqList } from "@/components/FaqList";
import Link from "next/link";
import { categoryConfig } from "@/lib/category-config";
import { getCategoryProducts } from "@/lib/server-data";

// Server component: products, FAQs and JSON-LD are rendered into the HTML so crawlers (and
// users on slow devices) get the full page without running JavaScript. ISR keeps it fresh.
export const revalidate = 3600;

export default async function CategoryDetailPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const config = categoryConfig[slug];
  if (!config) notFound();

  const products = await getCategoryProducts(slug, config.keywords);

  const relatedCats = config.relatedCategories
    .map(s => ({ slug: s, ...categoryConfig[s] }))
    .filter(c => c.name);

  return (
    <div className="bg-background min-h-screen">
      {/* Category Hero */}
      <div className={`bg-gradient-to-br ${config.color} py-12 sm:py-16 border-b border-border`}>
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <Breadcrumbs
            items={[
              { label: "Categories", href: "/categories" },
              { label: config.name },
            ]}
          />
          <div className="mt-4 max-w-3xl">
            <span className="text-4xl" aria-hidden="true">{config.icon}</span>
            <h1 className="mt-3 text-3xl font-bold tracking-tight text-foreground sm:text-4xl lg:text-5xl">
              {config.name} Products
            </h1>
            <p className="mt-4 text-lg text-muted-foreground leading-relaxed">
              {config.heroDescription}
            </p>
            <p className="mt-3 text-sm font-medium text-primary">
              {products.length} product{products.length !== 1 ? "s" : ""} available
            </p>
          </div>
        </div>
      </div>

      {/* Product Grid */}
      <div className="mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8">
        {products.length > 0 ? (
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3 sm:gap-4">
            {products.map((product: any) => (
              <ProductCard key={product.id} product={product} />
            ))}
          </div>
        ) : (
          <div className="text-center py-20">
            <span className="text-5xl">{config.icon}</span>
            <h2 className="mt-4 text-xl font-semibold">Products coming soon</h2>
            <p className="mt-2 text-muted-foreground">
              We&apos;re adding new {config.name.toLowerCase()} products regularly. Check back soon!
            </p>
            <Link href="/products" className="mt-4 inline-block text-primary hover:underline font-medium">
              Browse all products →
            </Link>
          </div>
        )}
      </div>

      {/* FAQs */}
      {config.faqs.length > 0 && (
        <section className="border-t border-border bg-surface py-12 sm:py-16">
          <div className="mx-auto max-w-3xl px-4 sm:px-6 lg:px-8">
            <h2 className="text-2xl font-bold tracking-tight text-foreground text-center">
              Frequently Asked Questions
            </h2>
            <p className="mt-2 text-center text-sm text-muted-foreground">
              Common questions about {config.name.toLowerCase()} products
            </p>
            <div className="mt-8">
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
          </div>
        </section>
      )}

      {/* Related Categories */}
      {relatedCats.length > 0 && (
        <section className="py-12 sm:py-16 border-t border-border">
          <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
            <h2 className="text-xl font-bold text-foreground">Related Categories</h2>
            <div className="mt-6 grid gap-4 sm:grid-cols-3">
              {relatedCats.map((cat) => (
                <Link
                  key={cat.slug}
                  href={`/categories/${cat.slug}`}
                  className={`group flex items-center gap-3 rounded-xl border border-border bg-gradient-to-br ${cat.color} p-4 shadow-soft transition-all hover:shadow-card hover:-translate-y-0.5`}
                >
                  <span className="text-2xl">{cat.icon}</span>
                  <div>
                    <p className="font-semibold text-foreground group-hover:text-primary transition-colors">
                      {cat.name}
                    </p>
                    <p className="text-xs text-muted-foreground">{cat.description}</p>
                  </div>
                </Link>
              ))}
            </div>
          </div>
        </section>
      )}
    </div>
  );
}
