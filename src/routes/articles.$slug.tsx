import { createFileRoute, Link, notFound } from "@tanstack/react-router";
import { useSuspenseQuery } from "@tanstack/react-query";
import { articleBySlugQueryOptions } from "@/lib/queries";
import { decodeEntities } from "@/lib/utils";
import { useState } from "react";
import { AlertCircle } from "lucide-react";

export const Route = createFileRoute("/articles/$slug")({
  loader: async ({ context: { queryClient }, params: { slug } }) => {
    const articles = await queryClient.ensureQueryData(articleBySlugQueryOptions(slug));
    if (!articles || articles.length === 0) throw notFound();
    return articles[0];
  },
  head: ({ loaderData }) => {
    if (!loaderData) return {};
    return {
      meta: [
        { title: `${decodeEntities(loaderData.title || "")} — Lifestyle Medicine Gateway` },
        {
          name: "description",
          content: loaderData.excerpt
            ? String(loaderData.excerpt)
                .replace(/<[^>]*>?/gm, "")
                .trim()
            : "Wellness article",
        },
        ...(loaderData.image_url ? [{ property: "og:image", content: loaderData.image_url }] : []),
      ],
    };
  },
  component: ArticlePage,
});

function ArticlePage() {
  const { slug } = Route.useParams();
  const { data: articles } = useSuspenseQuery(articleBySlugQueryOptions(slug));
  const [imageError, setImageError] = useState(false);
  const article = articles[0];
  const authorName = article.author?.representative_name || article.author?.store_name || "Georgia Erevnidis from E-training group";

  return (
    <article className="py-12 sm:py-16">
      <div className="mx-auto max-w-3xl px-4 sm:px-6">
        <Link to="/articles" className="text-sm font-medium text-primary hover:underline">
          ← Back to articles
        </Link>
        <h1 className="mt-6 text-3xl font-bold text-foreground sm:text-4xl lg:text-5xl leading-tight">
          {decodeEntities(article.title || "")}
        </h1>

        <div className="mt-6 flex items-center gap-4 text-sm text-muted-foreground font-medium uppercase tracking-wider">
          <span>{new Date(article.created_at).toLocaleDateString()}</span>
          <span className="opacity-30">•</span>
          <span className="text-primary font-bold">By {authorName}</span>
        </div>

        {article.image_url && (
          <div className="mt-8 overflow-hidden rounded-2xl border border-border shadow-sm bg-muted relative min-h-[200px] flex items-center justify-center">
            {imageError ? (
              <div className="flex flex-col items-center gap-3 p-8 text-center">
                <AlertCircle className="h-8 w-8 text-amber-500" />
                <div>
                  <p className="font-bold text-foreground">Image blocked by external host</p>
                  <p className="text-xs text-muted-foreground mt-1 max-w-xs">
                    This image is hosted on an external site that prevents it from being displayed
                    here. Please re-upload it to Supabase.
                  </p>
                </div>
              </div>
            ) : (
              <img
                src={article.image_url}
                alt={decodeEntities(article.title || "")}
                className="w-full object-cover aspect-[16/9]"
                onError={() => setImageError(true)}
              />
            )}
          </div>
        )}

        {article.content && (
          <div
            className="wp-content prose prose-green mt-12 max-w-none text-foreground prose-headings:text-foreground prose-a:text-primary prose-img:rounded-xl"
            dangerouslySetInnerHTML={{ __html: article.content }}
          />
        )}
      </div>
    </article>
  );
}
