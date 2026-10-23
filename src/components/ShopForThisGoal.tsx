import Link from "next/link";
import { ProductCard } from "@/components/ProductCard";
import { categoryConfig } from "@/lib/category-config";
import { guideForCategory, matchGoal, pickGoalProducts } from "@/lib/goal-matching";
import { getCategoryProducts, getNonEmptyCategorySlugs } from "@/lib/server-data";

// Server-rendered "shop for this goal" block under articles and recipes: matches the page to a
// wellness goal and shows a few relevant products, the buying guide and the category. This is
// the content → product discovery step of the growth loop; the links are in the HTML, so search
// engines follow them too. Renders nothing when there's no clear match or anything fails: it must
// never break the content page.

const MAX_PRODUCTS = 4;

export async function ShopForThisGoal({ title, body }: { title: string; body: string }) {
  let slug: string | null = null;
  let products: any[] = [];
  try {
    slug = matchGoal(title, body, await getNonEmptyCategorySlugs());
    if (!slug) return null;
    products = pickGoalProducts(await getCategoryProducts(slug, categoryConfig[slug].keywords), MAX_PRODUCTS);
  } catch (err) {
    console.error("ShopForThisGoal: skipped", err);
    return null;
  }
  if (products.length === 0) return null;

  const config = categoryConfig[slug];
  const guide = guideForCategory(slug);

  return (
    <section aria-labelledby="shop-for-goal" className="border-t border-border bg-surface py-12">
      <div className="mx-auto max-w-5xl px-4 sm:px-6 lg:px-8">
        <h2 id="shop-for-goal" className="text-2xl font-bold tracking-tight text-foreground">
          <span aria-hidden="true" className="mr-2">{config.icon}</span>
          Explore {config.name.toLowerCase()}
        </h2>
        <p className="mt-2 text-sm text-muted-foreground">
          Products from our wellness brands that may help with {config.name.toLowerCase()} as part of a healthy lifestyle.
        </p>

        <div className="mt-6 grid grid-cols-2 gap-3 sm:grid-cols-4">
          {products.map((product) => (
            <ProductCard key={product.id} product={product} />
          ))}
        </div>

        <div className="mt-6 flex flex-wrap gap-x-6 gap-y-2 text-sm font-medium">
          {guide && (
            <Link href={`/guides/${guide.slug}`} className="text-primary hover:underline">
              Read our guide: {guide.title} →
            </Link>
          )}
          <Link href={`/categories/${slug}`} className="text-primary hover:underline">
            See all {config.name.toLowerCase()} products →
          </Link>
        </div>

        <p className="mt-4 text-xs text-muted-foreground">
          General information only, not medical advice. Check with your healthcare professional before starting a new
          supplement, especially if you take medication.
        </p>
      </div>
    </section>
  );
}
