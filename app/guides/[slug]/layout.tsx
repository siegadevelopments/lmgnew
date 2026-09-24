import type { Metadata } from "next";
import { guideConfig } from "./page";
import { buildMetadata, notFoundMetadata } from "@/lib/seo-metadata";

// See app/products/[slug]/layout.tsx for why this exists. Guide content is a static config
// object (not database-backed), so metadata is built from it directly — no fetch needed.
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
    description: guide.intro?.slice(0, 160),
    path: `/guides/${slug}`,
  });
}

export default function GuideSlugLayout({ children }: { children: React.ReactNode }) {
  return children;
}
