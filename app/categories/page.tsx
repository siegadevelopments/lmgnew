import { getNonEmptyCategorySlugs } from "@/lib/server-data";
import { CategoriesDirectory } from "@/components/CategoriesDirectory";

// Lists only categories that currently have products. If the count can't be fetched it throws:
// the build fails (previous deployment keeps serving) or ISR keeps the last good page.
// Five minutes, matching DATA_REVALIDATE_SECONDS in src/lib/server-data.ts (must be a literal).
export const revalidate = 300;

export default async function CategoriesPage() {
  return <CategoriesDirectory visibleSlugs={await getNonEmptyCategorySlugs()} />;
}
