import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { Breadcrumbs } from "@/components/Breadcrumbs";
import { ShopForThisGoal } from "@/components/ShopForThisGoal";
import { freeGuides } from "@/lib/free-guides";
import { guideForCategory } from "@/lib/goal-matching";
import { buildMetadata, notFoundMetadata } from "@/lib/seo-metadata";

// Free guides (the email sign-up offer). Public and indexable: they're useful content in their
// own right, and the welcome email links here.
export const revalidate = 3600;

export function generateStaticParams() {
  return Object.keys(freeGuides).map((slug) => ({ slug }));
}

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const { slug } = await params;
  const guide = freeGuides[slug];
  if (!guide) return notFoundMetadata("Guide Not Found");
  return buildMetadata({ title: guide.title, description: guide.summary, path: `/free-guides/${slug}`, type: "article" });
}

export default async function FreeGuidePage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const guide = freeGuides[slug];
  if (!guide) notFound();
  const buyingGuide = guideForCategory(guide.categorySlug);

  return (
    <div className="bg-background min-h-screen">
      <article className="mx-auto max-w-3xl px-4 py-12 sm:px-6 sm:py-16 lg:px-8">
        <Breadcrumbs items={[{ label: "Free guides" }, { label: guide.title }]} />
        <h1 className="mt-3 text-3xl font-bold tracking-tight text-foreground sm:text-4xl">{guide.title}</h1>
        <p className="mt-4 text-lg leading-relaxed text-muted-foreground">{guide.intro}</p>

        <ol className="mt-10 space-y-8">
          {guide.days.map((day, i) => (
            <li key={day.title} className="rounded-2xl border border-border p-6">
              <p className="text-xs font-bold uppercase tracking-widest text-primary">Day {i + 1}</p>
              <h2 className="mt-1 text-xl font-bold text-foreground">{day.title}</h2>
              <p className="mt-2 text-muted-foreground">{day.why}</p>
              <p className="mt-3 font-medium text-foreground">
                <span className="text-primary">Try this: </span>
                {day.action}
              </p>
            </li>
          ))}
        </ol>

        <h2 className="mt-12 text-xl font-bold text-foreground">After the week</h2>
        <p className="mt-2 text-muted-foreground">{guide.closing}</p>

        <p className="mt-8 rounded-xl bg-muted/50 p-4 text-sm text-muted-foreground">{guide.seeYourGp}</p>

        {buyingGuide && (
          <p className="mt-8">
            <Link href={`/guides/${buyingGuide.slug}`} className="font-medium text-primary hover:underline">
              Read our buying guide: {buyingGuide.title} →
            </Link>
          </p>
        )}
      </article>
      <ShopForThisGoal title={guide.title} body={`${guide.intro} ${guide.days.map((d) => d.title + " " + d.why).join(" ")}`} />
    </div>
  );
}
