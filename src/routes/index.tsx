import { createFileRoute } from "@tanstack/react-router";
import { HeroSection } from "@/components/HeroSection";
import { MantraAndPositivitySection } from "@/components/MantraAndPositivitySection";
import { WhatIsLifestyleMedicine } from "@/components/WhatIsLifestyleMedicine";
import { JustForYouSection } from "@/components/JustForYouSection";
import { NewArrivalsSection } from "@/components/NewArrivalsSection";
import { YoungevityPromoSection } from "@/components/YoungevityPromoSection";
import { FeaturedVendorsSection } from "@/components/FeaturedVendorsSection";
import { LatestArticlesSection } from "@/components/LatestArticlesSection";
import { NewsletterSection } from "@/components/NewsletterSection";
import { CTASection } from "@/components/CTASection";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Lifestyle Medicine Gateway — Wellness Marketplace" },
      { name: "description", content: "Discover products, services, and expert content for a healthier life. Shop, book, and learn from trusted wellness vendors." },
      { property: "og:title", content: "Lifestyle Medicine Gateway — Wellness Marketplace" },
      { property: "og:description", content: "Discover products, services, and expert content for a healthier life." },
    ],
  }),
  component: Index,
});

function Index() {
  return (
    <>
      <HeroSection />
      <MantraAndPositivitySection />
      <WhatIsLifestyleMedicine />
      <JustForYouSection />
      <NewArrivalsSection />
      <YoungevityPromoSection />
      <FeaturedVendorsSection />
      <LatestArticlesSection />
      <NewsletterSection />
      <CTASection />
    </>
  );
}
