import dynamic from "next/dynamic";
import { HeroSection } from "@/components/HeroSection";
import { SchemaOrg } from "@/components/SchemaOrg";

const TrustBar = dynamic(() => import("@/components/TrustBar").then((mod) => mod.TrustBar));
const WellnessCategoryGrid = dynamic(() => import("@/components/WellnessCategoryGrid").then((mod) => mod.WellnessCategoryGrid));
const NewArrivalsSection = dynamic(() => import("@/components/NewArrivalsSection").then((mod) => mod.NewArrivalsSection));
const FeaturedVendorsSection = dynamic(() => import("@/components/FeaturedVendorsSection").then((mod) => mod.FeaturedVendorsSection));
const BuyingGuidesSection = dynamic(() => import("@/components/BuyingGuidesSection").then((mod) => mod.BuyingGuidesSection));
const TestimonialsSection = dynamic(() => import("@/components/TestimonialsSection").then((mod) => mod.TestimonialsSection));
const NewsletterSection = dynamic(() => import("@/components/NewsletterSection").then((mod) => mod.NewsletterSection));
const CTASection = dynamic(() => import("@/components/CTASection").then((mod) => mod.CTASection));

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

      <NewArrivalsSection />
      <FeaturedVendorsSection />
      <BuyingGuidesSection />
      <TestimonialsSection />
      <NewsletterSection />
      <CTASection />
    </>
  );
}
