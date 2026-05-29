'use client'

import { useParams } from "next/navigation";
import { useSuspenseQuery } from "@tanstack/react-query";
import { articleBySlugQueryOptions } from "@/lib/queries";
import { decodeEntities } from "@/lib/utils";
import { useState, Suspense } from "react";
import { AlertCircle, Loader2 } from "lucide-react";
import { sanitizeHtml } from "@/lib/security";
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
      <div className="mx-auto max-w-4xl px-4 sm:px-6 lg:px-8">
        <Link href="/articles" className="inline-flex items-center text-sm font-medium text-primary hover:underline transition-colors">
          ← Back to articles
        </Link>
        <h1 className="mt-6 text-3xl font-bold text-foreground sm:text-4xl lg:text-5xl leading-tight tracking-tight">
          {decodeEntities(article.title || "")}
        </h1>

        <div className="mt-6 flex flex-wrap items-center gap-y-2 gap-x-4 text-xs sm:text-sm text-muted-foreground font-medium uppercase tracking-wider">
          <span className="whitespace-nowrap">{new Date(article.created_at).toLocaleDateString()}</span>
          <span className="opacity-30 hidden sm:inline">•</span>
          <span className="text-primary font-bold">By {authorName}</span>
        </div>

        {article.image_url && (
          <div className="mt-8 w-full overflow-hidden rounded-2xl border border-border shadow-sm bg-muted">
            {imageError ? (
              <div className="flex flex-col items-center gap-3 p-8 text-center min-h-[200px] justify-center">
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
                className="w-full h-auto block"
                onError={() => setImageError(true)}
              />
            )}
          </div>
        )}

        {article.content && (
          <div
            className="wp-content rich-content prose prose-green mt-12 max-w-none text-foreground prose-headings:text-foreground prose-a:text-primary prose-img:rounded-xl leading-relaxed text-lg"
            dangerouslySetInnerHTML={{ 
              __html: sanitizeHtml((() => {
                let html = article.content || '';
                
                // Replace non-breaking spaces with regular spaces to allow wrapping
                html = html.replace(/&nbsp;/g, ' ');

                // Remove duplicate header image if it is embedded at the very beginning of the content
                if (article.image_url) {
                  const featMatch = article.image_url.split('/').pop()?.split(/[?#]/)[0];
                  if (featMatch) {
                    const featBase = featMatch.replace(/-\d+x\d+/, '').replace(/-scaled/, '').split('.')[0].toLowerCase();
                    if (featBase) {
                      const imgRegex = /<img[^>]+src=["']([^"']+)["'][^>]*>/i;
                      const match = html.match(imgRegex);
                      if (match) {
                        const firstImgSrc = match[0].match(/src=["']([^"']+)["']/i)?.[1] || "";
                        const firstImgMatch = firstImgSrc.split('/').pop()?.split(/[?#]/)[0];
                        if (firstImgMatch) {
                          const inlineBase = firstImgMatch.replace(/-\d+x\d+/, '').replace(/-scaled/, '').split('.')[0].toLowerCase();
                          if (featBase === inlineBase) {
                            const imgIndex = html.indexOf(match[0]);
                            if (imgIndex !== -1 && imgIndex < 500) {
                              const leadingPart = html.substring(0, imgIndex);
                              const cleanLeading = leadingPart.replace(/<div[^>]*>/gi, '').replace(/<figure[^>]*>/gi, '').replace(/<p[^>]*>/gi, '').trim();
                              if (cleanLeading === '') {
                                const wrapperRegex = /^\s*(?:<div[^>]*>\s*(?:<figure[^>]*>\s*)?|<figure[^>]*>\s*|<p[^>]*>\s*)?<img[^>]+?\/?>\s*(?:<\/figure>)?\s*(?:<\/div>)?\s*(?:<\/p>)?/i;
                                html = html.replace(wrapperRegex, '');
                              }
                            }
                          }
                        }
                      }
                    }
                  }
                }

                // Determine base domain and main image filename/path from the article's main image_url
                let baseDomain = "https://usrtaxvjwidfxajbjlpj.supabase.co/storage/v1/object/public/media";
                let mainImageFileName = "";
                if (article.image_url) {
                  if (article.image_url.includes("media.lifestylemedicinegateway.com")) {
                    baseDomain = "https://media.lifestylemedicinegateway.com";
                  } else if (article.image_url.includes("supabase.co")) {
                    baseDomain = "https://usrtaxvjwidfxajbjlpj.supabase.co/storage/v1/object/public/media";
                  }
                  
                  // Extract filename from the main image URL
                  const parts = article.image_url.split('/');
                  mainImageFileName = parts[parts.length - 1] || "";
                }

                // Map legacy WordPress uploads to the appropriate storage domain URLs
                html = html.replace(
                  /(?:https?:\/\/(?:www\.)?lifestylemedicinegateway\.com)?\/wp-content\/uploads\/([^\s"'<>]+)/g,
                  (match, path) => {
                    // Strip widthxheight suffixes (like -1024x559 or -150x150)
                    let cleanPath = path.replace(/-\d+x\d+(\.[a-zA-Z0-9]+)$/, '$1');
                    
                    // If we have a main image filename and the clean path ends with a similar name,
                    // we check if we need to use the main image filename (e.g. to handle "-scaled" suffix)
                    if (mainImageFileName) {
                      const cleanFileName = cleanPath.split('/').pop() || "";
                      const cleanNameNoExt = cleanFileName.replace(/\.[a-zA-Z0-9]+$/, "");
                      const mainNameNoExt = mainImageFileName.replace(/\.[a-zA-Z0-9]+$/, "");
                      
                      // If main image ends with "-scaled" and matches our clean name prefix, use it
                      if (mainNameNoExt.endsWith("-scaled") && mainNameNoExt.startsWith(cleanNameNoExt)) {
                        const pathParts = cleanPath.split('/');
                        pathParts[pathParts.length - 1] = mainImageFileName;
                        cleanPath = pathParts.join('/');
                      }
                    }

                    // Build full URL and replace spaces with %20 for browser compatibility in src/srcset
                    const fullUrl = `${baseDomain}/ (1).uploads/${cleanPath}`;
                    return fullUrl.replace(/ /g, "%20");
                  }
                );
                
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
                    result += `<h2>${trimmed.replace('## ', '')}</h2>\n`;
                    return;
                  }
                  if (trimmed.startsWith('### ')) {
                    closeList();
                    result += `<h3>${trimmed.replace('### ', '')}</h3>\n`;
                    return;
                  }

                  // Handle Numbered Headings (e.g. "1. Title")
                  if (/^\d+\.\s+[A-Z]/.test(trimmed) && trimmed.length < 100) {
                    closeList();
                    result += `<h2>${trimmed}</h2>\n`;
                    return;
                  }

                  // Handle Sub-headings (e.g. "Ingredients:")
                  if (trimmed.endsWith(':') && trimmed.length < 40) {
                    closeList();
                    result += `<h3>${trimmed}</h3>\n`;
                    return;
                  }

                  // Handle Bullet points (- or *)
                  if (trimmed.startsWith('- ') || trimmed.startsWith('* ')) {
                    if (!inList || listType !== 'ul') {
                      closeList();
                      result += '<ul>\n';
                      inList = true;
                      listType = 'ul';
                    }
                    const item = trimmed.replace(/^[-*]\s+/, '');
                    result += `<li>${item}</li>\n`;
                    return;
                  }

                  // Handle Numbered items (1. Item) - if not caught as heading
                  if (/^\d+\.\s+/.test(trimmed)) {
                    if (!inList || listType !== 'ol') {
                      closeList();
                      result += '<ol>\n';
                      inList = true;
                      listType = 'ol';
                    }
                    const item = trimmed.replace(/^\d+\.\s+/, '');
                    result += `<li>${item}</li>\n`;
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
                    result += `<h2>${trimmed}</h2>\n`;
                    return;
                  }

                  // Regular Paragraph
                  closeList();
                  // Apply basic formatting to paragraph
                  let formatted = trimmed
                    .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
                    .replace(/\*(.*?)\*/g, '<em>$1</em>');
                  
                  result += `<p>${formatted}</p>\n`;
                });

                closeList();
                return result;
              })())
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
