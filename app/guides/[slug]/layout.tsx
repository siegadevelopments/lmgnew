import type { Metadata } from "next";
import { guideConfig } from "@/lib/guide-config";
import { buildMetadata, notFoundMetadata, toPlainDescription } from "@/lib/seo-metadata";

// See app/products/[slug]/layout.tsx for why this exists. Guide content is a static config
// object (not database-backed), so metadata is built from it directly — no fetch needed.
// The config MUST come from a plain module (src/lib/guide-config.ts), not the 'use client'
// page.tsx — importing from a client module yields an opaque reference on the server.
export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const guide = guideConfig[slug];

  if (!guide) return notFoundMetadata("Guide Not Found");

  return buildMetadata({
    title: guide.title,
    description: toPlainDescription(guide.intro),
    path: `/guides/${slug}`,
  });
}

export default function GuideSlugLayout({ children }: { children: React.ReactNode }) {
  return children;
}
