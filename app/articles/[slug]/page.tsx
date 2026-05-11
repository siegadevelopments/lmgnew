'use client'

import { useParams } from "next/navigation";
import { useSuspenseQuery } from "@tanstack/react-query";
import { articleBySlugQueryOptions } from "@/lib/queries";
import { decodeEntities } from "@/lib/utils";
import { useState, Suspense } from "react";
import { AlertCircle, Loader2 } from "lucide-react";
import Link from "next/link";

function ArticleContent() {
  const params = useParams();
  const slug = params?.slug as string;
  const { data: articles } = useSuspenseQuery(articleBySlugQueryOptions(slug));
  const [imageError, setImageError] = useState(false);
  const article = articles?.[0];

  if (!article) return <div className="p-20 text-center">Article not found</div>;

  const authorName = article.vendor_profiles?.representative_name || article.vendor_profiles?.store_name || "Georgia Erevnidis from E-training group";

  return (
    <article className="py-12 sm:py-16">
      <div className="mx-auto max-w-3xl px-4 sm:px-6">
        <Link href="/articles" className="text-sm font-medium text-primary hover:underline">
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
            className="wp-content prose prose-green mt-12 max-w-none text-foreground prose-headings:text-foreground prose-a:text-primary prose-img:rounded-xl leading-relaxed text-lg"
            dangerouslySetInnerHTML={{ 
              __html: (() => {
                let html = article.content;
                
                // If it's already HTML (contains <p> or <h tags), return as is
                if (html.includes('<p>') || html.includes('<h')) return html;
                
                // Otherwise, transform markdown-style plain text to HTML
                const lines = html.split('\n').filter((p: string) => p.trim());
                let result = '';
                let inList = false;
                let listType: 'ul' | 'ol' | null = null;

                const closeList = () => {
                  if (inList) {
                    result += listType === 'ul' ? '</ul>\n' : '</ol>\n';
                    inList = false;
                    listType = null;
                  }
                };

                lines.forEach((line: string) => {
                  let trimmed = line.trim();
                  
                  // Handle Headings (Explicit ## or ###)
                  if (trimmed.startsWith('## ')) {
                    closeList();
                    result += `<h2 class="text-2xl font-bold mt-10 mb-4">${trimmed.replace('## ', '')}</h2>\n`;
                    return;
                  }
                  if (trimmed.startsWith('### ')) {
                    closeList();
                    result += `<h3 class="text-xl font-bold mt-8 mb-3">${trimmed.replace('### ', '')}</h3>\n`;
                    return;
                  }

                  // Handle Numbered Headings (e.g. "1. Title")
                  if (/^\d+\.\s+[A-Z]/.test(trimmed) && trimmed.length < 100) {
                    closeList();
                    result += `<h2 class="text-2xl font-bold mt-10 mb-4">${trimmed}</h2>\n`;
                    return;
                  }

                  // Handle Sub-headings (e.g. "Ingredients:")
                  if (trimmed.endsWith(':') && trimmed.length < 40) {
                    closeList();
                    result += `<h3 class="text-lg font-bold mt-6 mb-3 text-slate-800">${trimmed}</h3>\n`;
                    return;
                  }

                  // Handle Bullet points (- or *)
                  if (trimmed.startsWith('- ') || trimmed.startsWith('* ')) {
                    if (!inList || listType !== 'ul') {
                      closeList();
                      result += '<ul class="my-6 space-y-2 list-disc ml-6">\n';
                      inList = true;
                      listType = 'ul';
                    }
                    const item = trimmed.replace(/^[-*]\s+/, '');
                    result += `<li class="text-slate-700">${item}</li>\n`;
                    return;
                  }

                  // Handle Numbered items (1. Item) - if not caught as heading
                  if (/^\d+\.\s+/.test(trimmed)) {
                    if (!inList || listType !== 'ol') {
                      closeList();
                      result += '<ol class="my-6 space-y-2 list-decimal ml-6">\n';
                      inList = true;
                      listType = 'ol';
                    }
                    const item = trimmed.replace(/^\d+\.\s+/, '');
                    result += `<li class="text-slate-700">${item}</li>\n`;
                    return;
                  }

                  // Auto-detect headings (Short lines without punctuation)
                  const looksLikeHeading = trimmed.length < 60 && 
                                          !trimmed.endsWith('.') && 
                                          !trimmed.endsWith(',') &&
                                          !trimmed.endsWith('?') &&
                                          trimmed.length > 3;
                  
                  if (looksLikeHeading) {
                    closeList();
                    result += `<h2 class="text-2xl font-bold mt-10 mb-4">${trimmed}</h2>\n`;
                    return;
                  }

                  // Regular Paragraph
                  closeList();
                  // Apply basic formatting to paragraph
                  let formatted = trimmed
                    .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
                    .replace(/\*(.*?)\*/g, '<em>$1</em>');
                  
                  result += `<p class="mb-6 leading-relaxed text-slate-700">${formatted}</p>\n`;
                });

                closeList();
                return result;
              })()
            }}
          />
        )}
      </div>
    </article>
  );
}

export default function ArticlePage() {
  return (
    <Suspense fallback={<div className="flex min-h-[60vh] items-center justify-center"><Loader2 className="h-8 w-8 animate-spin text-primary" /></div>}>
      <ArticleContent />
    </Suspense>
  );
}
