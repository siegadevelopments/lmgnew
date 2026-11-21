// Product listing helpers shared by the server (server-data.ts) and the client query
// (queries.ts), so both ship the same slim shape.
//
// Why: the full `variants` JSON (sku, options, stock, source_ref ...) was ~100 KB of a ~570 KB
// listing that every visitor downloaded. A listing card only needs the first variant's
// id/title/price (Quick Add) and whether there is more than one variant (button label).

/** Columns a product card / listing needs. `excerpt` is not shown on cards, so it is left out. */
export const LISTING_COLUMNS = `id, vendor_id, title, slug, price, image_url, stock, status, created_at, category, product_type, variants,
       vendor_profiles (store_name, store_logo_url, is_approved, is_live)`;

type AnyProduct = Record<string, any>;

/**
 * Replaces `variants` with just the first variant (id, title, price) and records the real count
 * in `variant_count`. Other fields are untouched.
 */
export function slimListingProduct<T extends AnyProduct>(product: T): T & { variant_count: number } {
  const variants = Array.isArray(product.variants) ? product.variants : [];
  const first = variants[0];
  return {
    ...product,
    variants: first ? [{ id: first.id, title: first.title, price: first.price }] : [],
    variant_count: variants.length,
  };
}

export const slimListingProducts = <T extends AnyProduct>(products: T[]) => products.map(slimListingProduct);

/** Number of variants for a card, whether or not the product was slimmed. */
export function variantCount(product: { variants?: unknown[] | null; variant_count?: number | null }): number {
  return product.variant_count ?? product.variants?.length ?? 0;
}
