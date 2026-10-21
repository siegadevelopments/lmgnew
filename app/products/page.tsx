import { productsQueryOptions } from "@/lib/queries";
import { getProductListing } from "@/lib/server-data";
import { ServerHydrate } from "@/components/ServerHydrate";
import { ProductsBrowser } from "@/components/ProductsBrowser";

// The listing is fetched on the server and seeded into React Query, so product names, prices and
// links are in the HTML crawlers receive (the page used to ship "0 products" and a skeleton).
// If the fetch fails after retries it throws: the build fails (the previous deployment keeps
// serving) or, on an hourly refresh, ISR keeps the last good page.
export const revalidate = 3600;

export default async function ProductsPage() {
  const products = await getProductListing();
  return (
    <ServerHydrate entries={[[productsQueryOptions().queryKey, products]]}>
      <ProductsBrowser />
    </ServerHydrate>
  );
}
