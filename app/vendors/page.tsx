import { brandsQueryOptions } from "@/lib/queries";
import { getApprovedVendors } from "@/lib/server-data";
import { ServerHydrate } from "@/components/ServerHydrate";
import { VendorsDirectory } from "@/components/VendorsDirectory";

// Vendor names/links are fetched on the server and seeded into the React Query cache, so the
// vendor list is in the HTML crawlers receive. If the fetch fails after retries it throws: the
// build fails (the previous deployment keeps serving) or, on a scheduled refresh, ISR keeps the last
// good page. An empty directory is never cached in place of real data.
// Five minutes, matching DATA_REVALIDATE_SECONDS in src/lib/server-data.ts (must be a literal).
export const revalidate = 300;

export default async function VendorsPage() {
  const vendors = await getApprovedVendors();
  return (
    <ServerHydrate entries={[[brandsQueryOptions().queryKey, vendors]]}>
      <VendorsDirectory />
    </ServerHydrate>
  );
}
