import { productsQueryOptions } from "@/lib/queries";
import { getProductListing } from "@/lib/server-data";
import { ServerHydrate } from "@/components/ServerHydrate";
import { ProductsBrowser } from "@/components/ProductsBrowser";

// The listing is fetched on the server and seeded into React Query, so product names, prices and
// links are in the HTML crawlers receive (the page used to ship "0 products" and a skeleton).
// If the fetch fails after retries it throws: the build fails (the previous deployment keeps
// serving) or, on a scheduled refresh, ISR keeps the last good page.
// Five minutes, matching DATA_REVALIDATE_SECONDS in src/lib/server-data.ts (must be a literal).
export const revalidate = 300;

export default async function ProductsPage() {
  const products = await getProductListing();
  return (
    <ServerHydrate entries={[[productsQueryOptions().queryKey, products]]}>
      <ProductsBrowser />
    </ServerHydrate>
  );
}
