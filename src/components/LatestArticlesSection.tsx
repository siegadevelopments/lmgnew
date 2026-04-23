import { Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { articlesQueryOptions } from "@/lib/queries";
import { Skeleton } from "@/components/ui/skeleton";

export function LatestArticlesSection() {
  const { data, isLoading } = useQuery({
    ...articlesQueryOptions(),
    select: (data) => data.slice(0, 4), // Get latest 4
  });

  return (
    <section className="py-16 sm:py-20">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="flex items-end justify-between">
          <div>
            <h2 className="text-2xl font-bold tracking-tight text-foreground sm:text-3xl">Latest Blogs</h2>
            <p className="mt-2 text-sm text-muted-foreground">Stay informed with our latest health and wellness insights</p>
          </div>
          <Link to="/articles" className="hidden text-sm font-medium text-primary hover:underline sm:block">
            View all articles →
          </Link>
        </div>

        <div className="mt-10 grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
          {isLoading
            ? Array.from({ length: 4 }).map((_, i) => (
                <div key={i} className="rounded-xl border border-border bg-card shadow-soft">
                  <Skeleton className="aspect-video w-full rounded-t-xl" />
                  <div className="p-5 space-y-2">
                    <Skeleton className="h-4 w-3/4" />
                    <Skeleton className="h-3 w-full" />
                    <Skeleton className="h-3 w-1/2" />
                  </div>
                </div>
              ))
            : data?.map((post) => (
                <Link
                  key={post.id}
                  to="/articles/$slug"
                  params={{ slug: post.slug }}
                  className="group overflow-hidden rounded-xl border border-border bg-card shadow-soft transition-all duration-300 hover:-translate-y-1 hover:shadow-card"
                >
                  <div className="aspect-video overflow-hidden bg-muted">
                    {post.image_url ? (
                      <img src={post.image_url} alt={post.title} className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-105" loading="lazy" />
                    ) : null}
                  </div>
                  <div className="p-4">
                    <h3 className="text-sm font-semibold text-card-foreground group-hover:text-primary transition-colors line-clamp-2">
                      {post.title}
                    </h3>
                    <time className="mt-1.5 block text-xs text-muted-foreground">
                      {new Date(post.created_at).toLocaleDateString()}
                    </time>
                  </div>
                </Link>
              ))}
        </div>

        <div className="mt-6 text-center sm:hidden">
          <Link to="/articles" className="text-sm font-medium text-primary hover:underline">View all articles →</Link>
        </div>
      </div>
    </section>
  );
}
