import type { Metadata } from "next";

const SITE_URL = "https://www.lifestylemedicinegateway.com";

// Strips HTML tags/entities down to plain text for use in a <meta description>, and trims
// to a search-snippet-friendly length.
export function toPlainDescription(html: string | null | undefined, maxLength = 160): string | undefined {
  if (!html) return undefined;
  const text = html
    .replace(/<[^>]*>/g, " ")
    .replace(/&nbsp;/g, " ")
    .replace(/&amp;/g, "&")
    .replace(/&#8211;|&#8212;/g, "-")
    .replace(/\s+/g, " ")
    .trim();
  if (!text) return undefined;
  return text.length > maxLength ? `${text.slice(0, maxLength - 1).trimEnd()}…` : text;
}

/**
 * Builds a per-page Metadata object with a real canonical URL, description, and Open Graph /
 * Twitter tags for the given content — used by every dynamic [slug] route (products, articles,
 * recipes, guides, categories, vendors, services). Without this, every one of those pages
 * previously shared the root layout's generic title/description and a canonical pointing at
 * the listing page, which told search engines and AI crawlers to ignore the actual content.
 */
export function buildMetadata(opts: {
  title: string;
  description?: string | null;
  path: string; // e.g. "/products/my-slug" — no domain, no trailing slash
  image?: string | null;
  type?: "website" | "article";
}): Metadata {
  const { title, description, path, image, type = "website" } = opts;
  const url = `${SITE_URL}${path}`;
  const desc = description || undefined;

  return {
    title,
    description: desc,
    alternates: { canonical: url },
    openGraph: {
      title,
      description: desc,
      url,
      type,
      images: image ? [{ url: image }] : undefined,
    },
    twitter: {
      card: "summary_large_image",
      title,
      description: desc,
      images: image ? [image] : undefined,
    },
  };
}

// For a slug that doesn't resolve to real content — keeps it out of search/AI indexes
// instead of silently inheriting the generic site-wide metadata as indexable content.
export function notFoundMetadata(title = "Page Not Found"): Metadata {
  return {
    title,
    robots: { index: false, follow: false },
  };
}
