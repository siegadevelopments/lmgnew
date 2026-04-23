import { createFileRoute, Link, notFound } from "@tanstack/react-router";
import { useSuspenseQuery } from "@tanstack/react-query";
import { articleBySlugQueryOptions } from "@/lib/queries";

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
        { title: `${loaderData.title} — Lifestyle Medicine Gateway` },
        { name: "description", content: loaderData.excerpt ? String(loaderData.excerpt).replace(/<[^>]*>?/gm, "").trim() : "Wellness article" },
        ...(loaderData.image_url ? [{ property: "og:image", content: loaderData.image_url }] : []),
      ],
    };
  },
  component: ArticlePage,
});

function ArticlePage() {
  const { slug } = Route.useParams();
  const { data: articles } = useSuspenseQuery(articleBySlugQueryOptions(slug));
  const article = articles[0];

  return (
    <article className="py-12 sm:py-16">
      <div className="mx-auto max-w-3xl px-4 sm:px-6">
        <Link to="/articles" className="text-sm font-medium text-primary hover:underline">← Back to articles</Link>
        <h1 className="mt-6 text-3xl font-bold text-foreground sm:text-4xl lg:text-5xl leading-tight">{article.title}</h1>
        
        <div className="mt-6 flex items-center gap-4 text-sm text-muted-foreground font-medium">
          <span>{new Date(article.created_at).toLocaleDateString()}</span>
        </div>



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
