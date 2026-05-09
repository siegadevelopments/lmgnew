'use client'

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

export default function IndexPage() {
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
