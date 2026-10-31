import dynamic from "next/dynamic";
import { HeroSection } from "@/components/HeroSection";
import { SchemaOrg } from "@/components/SchemaOrg";
import { ServerHydrate } from "@/components/ServerHydrate";
import { brandsQueryOptions, newArrivalsQueryOptions, trustStatsQueryOptions } from "@/lib/queries";
import { getApprovedVendors, getNewArrivals, getNonEmptyCategorySlugs, getTrustStats } from "@/lib/server-data";

// Counters, new arrivals and featured vendors are fetched on the server and seeded into the
// React Query cache, so they are in the HTML crawlers receive (previously "—" and no vendors until
// JavaScript ran). Each fetch is independent: a failure just leaves that section to the client.
// Five minutes, matching DATA_REVALIDATE_SECONDS in src/lib/server-data.ts (must be a literal).
export const revalidate = 3600;

const TrustBar = dynamic(() => import("@/components/TrustBar").then((mod) => mod.TrustBar));
const WellnessCategoryGrid = dynamic(() => import("@/components/WellnessCategoryGrid").then((mod) => mod.WellnessCategoryGrid));
const NewArrivalsSection = dynamic(() => import("@/components/NewArrivalsSection").then((mod) => mod.NewArrivalsSection));
const FeaturedVendorsSection = dynamic(() => import("@/components/FeaturedVendorsSection").then((mod) => mod.FeaturedVendorsSection));
const BuyingGuidesSection = dynamic(() => import("@/components/BuyingGuidesSection").then((mod) => mod.BuyingGuidesSection));
const TestimonialsSection = dynamic(() => import("@/components/TestimonialsSection").then((mod) => mod.TestimonialsSection));
const NewsletterSection = dynamic(() => import("@/components/NewsletterSection").then((mod) => mod.NewsletterSection));
const CTASection = dynamic(() => import("@/components/CTASection").then((mod) => mod.CTASection));

function settled<T>(r: PromiseSettledResult<T>): T | undefined {
  if (r.status === "fulfilled") return r.value;
  console.error("homepage: server fetch failed, section falls back to client fetch", r.reason);
  return undefined;
}

export default async function IndexPage() {
  const [stats, arrivals, vendors, categorySlugs] = await Promise.allSettled([
    getTrustStats(),
    getNewArrivals(5),
    getApprovedVendors(),
    getNonEmptyCategorySlugs(),
  ]);

  return (
    <ServerHydrate
      entries={[
        [trustStatsQueryOptions().queryKey, settled(stats)],
        [newArrivalsQueryOptions().queryKey, settled(arrivals)],
        [brandsQueryOptions().queryKey, settled(vendors)],
      ]}
    >
      <SchemaOrg 
        type="WebSite"
        name="Lifestyle Medicine Gateway"
        description="Australia's trusted wellness marketplace. Shop evidence-based wellness products for healthy ageing, menopause support, gut health, and more."
        url="https://www.lifestylemedicinegateway.com"
      />
      <HeroSection />
      <TrustBar />
      <div id="wellness-categories">
        {/* Empty categories are hidden; if the count fails, every category shows as before. */}
        <WellnessCategoryGrid visibleSlugs={settled(categorySlugs)} />
      </div>

      <NewArrivalsSection />
      <FeaturedVendorsSection />
      <BuyingGuidesSection />
      <TestimonialsSection />
      <NewsletterSection />
      <CTASection />
    </ServerHydrate>
  );
}
