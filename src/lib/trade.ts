// Trade listings: products meant for salons, clinics and businesses rather than retail shoppers
// (wholesale, salon-only, bulk 5 kg+ packs). They're listed on /trade and left out of retail
// browsing (shop, categories, guides, search, homepage, recommendations). Their own product pages
// still work, so links and orders keep working. Title-based, because vendors label them that way.

const TRADE_PATTERN = /wholesale|salon only|\bMASK_|\b(?:[5-9]|[1-9]\d+)\s?kg\b/i;

export function isTradeListing(title: string | null | undefined): boolean {
  return TRADE_PATTERN.test(title ?? "");
}

/** Retail browsing: everything except trade listings. */
export function retailOnly<T extends { title?: string | null }>(products: T[]): T[] {
  return products.filter((p) => !isTradeListing(p.title));
}
