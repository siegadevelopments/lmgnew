import { createFileRoute } from "@tanstack/react-router";
import { HeroSection } from "@/components/HeroSection";
import { MantraAndPositivitySection } from "@/components/MantraAndPositivitySection";
import { WhatIsLifestyleMedicine } from "@/components/WhatIsLifestyleMedicine";
import { JustForYouSection } from "@/components/JustForYouSection";
import { NewArrivalsSection } from "@/components/NewArrivalsSection";
import { FeaturedVendorsSection } from "@/components/FeaturedVendorsSection";
import { LatestArticlesSection } from "@/components/LatestArticlesSection";
import { NewsletterSection } from "@/components/NewsletterSection";
import { CTASection } from "@/components/CTASection";
import { FeaturesSection } from "@/components/FeaturesSection";
import { TestimonialsSection } from "@/components/TestimonialsSection";
import { SchemaOrg } from "@/components/SchemaOrg";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Lifestyle Medicine Gateway — Wellness Marketplace" },
      {
        name: "description",
        content:
          "Discover products, services, and expert content for a healthier life. Shop, book, and learn from trusted wellness vendors.",
      },
      { property: "og:title", content: "Lifestyle Medicine Gateway — Wellness Marketplace" },
      {
        property: "og:description",
        content: "Discover products, services, and expert content for a healthier life.",
      },
      { property: "og:image", content: "/logo.png" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: Index,
});

function Index() {
  return (
    <>
      <SchemaOrg 
        type="WebSite"
        name="Lifestyle Medicine Gateway"
        description="Wellness Marketplace & Lifestyle Medicine Resources"
        url="https://www.lifestylemedicinegateway.com"
      />
      <HeroSection />
      <MantraAndPositivitySection />
      <WhatIsLifestyleMedicine />
      <JustForYouSection />
      <FeaturesSection />
      <NewArrivalsSection />
      <FeaturedVendorsSection />
      <LatestArticlesSection />
      <TestimonialsSection />
      <NewsletterSection />
      <CTASection />
    </>
  );
}
