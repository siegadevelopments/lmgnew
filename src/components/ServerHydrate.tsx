import { QueryClient, dehydrate, HydrationBoundary } from "@tanstack/react-query";

type Entry = readonly [queryKey: readonly unknown[], data: unknown];

// Seeds the browser's React Query cache with data fetched on the server. Client components that
// call useQuery/useSuspenseQuery with the same key then render real content during SSR (so it is
// in the HTML crawlers receive) with no markup or design change, and still refetch as before.
export function ServerHydrate({ entries, children }: { entries: Entry[]; children: React.ReactNode }) {
  const client = new QueryClient();
  for (const [key, data] of entries) {
    if (data !== undefined) client.setQueryData(key, data);
  }
  return <HydrationBoundary state={dehydrate(client)}>{children}</HydrationBoundary>;
}
