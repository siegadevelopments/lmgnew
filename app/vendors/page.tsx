import { brandsQueryOptions } from "@/lib/queries";
import { getApprovedVendors } from "@/lib/server-data";
import { ServerHydrate } from "@/components/ServerHydrate";
import { VendorsDirectory } from "@/components/VendorsDirectory";

// Vendor names/links are fetched on the server and seeded into the React Query cache, so the
// vendor list is in the HTML crawlers receive. If the server fetch fails we render without seed
// data and the client fetches exactly as it did before.
export const revalidate = 3600;

async function loadVendors() {
  try {
    return await getApprovedVendors();
  } catch (err) {
    console.error("vendors page: server fetch failed, falling back to client fetch", err);
    return undefined;
  }
}

export default async function VendorsPage() {
  const vendors = await loadVendors();
  return (
    <ServerHydrate entries={[[brandsQueryOptions().queryKey, vendors]]}>
      <VendorsDirectory />
    </ServerHydrate>
  );
}
