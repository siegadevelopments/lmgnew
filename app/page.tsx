'use client'

import { HeroSection } from "@/components/HeroSection";
import { TrustBar } from "@/components/TrustBar";
import { WellnessCategoryGrid } from "@/components/WellnessCategoryGrid";
import { BestSellersSection } from "@/components/BestSellersSection";
import { NewArrivalsSection } from "@/components/NewArrivalsSection";
import { FeaturedVendorsSection } from "@/components/FeaturedVendorsSection";
import { BuyingGuidesSection } from "@/components/BuyingGuidesSection";
import { TestimonialsSection } from "@/components/TestimonialsSection";
import { NewsletterSection } from "@/components/NewsletterSection";
import { CTASection } from "@/components/CTASection";
import { SchemaOrg } from "@/components/SchemaOrg";

export default function IndexPage() {
  return (
    <>
      <SchemaOrg 
        type="WebSite"
        name="Lifestyle Medicine Gateway"
        description="Australia's trusted wellness marketplace. Shop evidence-based wellness products for healthy ageing, menopause support, gut health, and more."
        url="https://www.lifestylemedicinegateway.com"
      />
      <HeroSection />
      <TrustBar />
      <div id="wellness-categories">
        <WellnessCategoryGrid />
      </div>
      <BestSellersSection />
      <NewArrivalsSection />
      <FeaturedVendorsSection />
      <BuyingGuidesSection />
      <TestimonialsSection />
      <NewsletterSection />
      <CTASection />
    </>
  );
}
