// Server-side cart pricing for checkout. The browser's cart is untrusted: it supplies only
// *which* products/variants/quantities/bookings, and everything else (price, name, vendor,
// image, slug) is taken from the products table. Pure logic, no imports, so it is unit-tested
// from src/lib/__tests__/cart-pricing.test.ts.

export interface ClientCartItem {
  product_id: number | string;
  variant_id?: number | string | null;
  quantity: number;
  booking?: { start_time: string; end_time: string } | null;
}

export interface DbProduct {
  id: number;
  title: string;
  slug: string;
  price: number;
  image_url: string | null;
  stock: number | null;
  status: string;
  vendor_id: string | null;
  variants: unknown;
  /** The selling store; products from unapproved or hidden (not live) stores can't be bought. */
  vendor_profiles?: { is_approved: boolean | null; is_live: boolean | null } | null;
}

export interface PricedItem {
  product_id: number;
  variant_id: number | null;
  /** The variant's id as stored in products.variants (often a UUID); used for stock. */
  variant_key: string | null;
  name: string;
  price: number; // AUD, GST-inclusive
  quantity: number;
  image: string;
  slug: string;
  vendor_id: string;
  booking: { start_time: string; end_time: string } | null;
}

export type PriceResult = { ok: true; items: PricedItem[] } | { ok: false; error: string };

export const MAX_QUANTITY = 99;
export const MAX_ITEMS = 50;

export function priceCart(clientItems: unknown, products: DbProduct[]): PriceResult {
  if (!Array.isArray(clientItems) || clientItems.length === 0) {
    return { ok: false, error: "Your cart is empty." };
  }
  if (clientItems.length > MAX_ITEMS) return { ok: false, error: "Too many items in cart." };

  const byId = new Map(products.map((p) => [Number(p.id), p]));
  const items: PricedItem[] = [];

  for (const raw of clientItems as ClientCartItem[]) {
    const qty = Number(raw?.quantity);
    if (!Number.isInteger(qty) || qty < 1 || qty > MAX_QUANTITY) {
      return { ok: false, error: "Invalid item quantity." };
    }
    const product = byId.get(Number(raw.product_id));
    if (!product || product.status !== "published") {
      return { ok: false, error: "An item in your cart is no longer available." };
    }
    // Same rule as the shop: only approved stores that are live. (A test order on 2026-10-21
    // bought a product from a store that was approved but hidden.)
    if (product.vendor_profiles && (!product.vendor_profiles.is_approved || product.vendor_profiles.is_live === false)) {
      return { ok: false, error: "An item in your cart is no longer available." };
    }

    let price = Number(product.price);
    let name = product.title;
    let stock = product.stock ?? 100;
    let variantId: number | null = null;
    let variantKey: string | null = null;

    if (raw.variant_id != null && raw.variant_id !== "") {
      const variants = Array.isArray(product.variants) ? (product.variants as any[]) : [];
      const variant = variants.find((v) => String(v?.id) === String(raw.variant_id));
      if (!variant) return { ok: false, error: `"${product.title}" option is no longer available.` };
      variantId = Number.isFinite(Number(variant.id)) ? Number(variant.id) : null;
      variantKey = String(variant.id);
      const vPrice = Number(variant.price);
      // Same rule the product page uses to pick a displayed price.
      if (vPrice > 0 && vPrice < 10000) price = vPrice;
      if (variant.title && variant.title !== "Default Title") name = `${product.title} - ${variant.title}`;
      if (variant.available === false) stock = 0;
      else if (variant.stock !== undefined && variant.stock !== null) stock = Number(variant.stock);
    }

    if (!Number.isFinite(price) || price <= 0) {
      return { ok: false, error: `"${product.title}" can't be purchased right now.` };
    }
    if (stock < qty) {
      return { ok: false, error: `"${product.title}" doesn't have enough stock.` };
    }

    const b = raw.booking;
    items.push({
      product_id: product.id,
      variant_id: variantId,
      variant_key: variantKey,
      name,
      price,
      quantity: qty,
      image: product.image_url || "",
      slug: product.slug,
      vendor_id: product.vendor_id || "",
      booking: b && b.start_time && b.end_time ? { start_time: b.start_time, end_time: b.end_time } : null,
    });
  }

  return { ok: true, items };
}

// ---------------------------------------------------------------------------------------------
// Redirects after Stripe Checkout
// ---------------------------------------------------------------------------------------------

export const SITE_URL = "https://www.lifestylemedicinegateway.com";
const ALLOWED_ORIGINS = [SITE_URL, "https://lifestylemedicinegateway.com", "http://localhost:3000"];

/**
 * success_url / cancel_url arrive from the browser. Only addresses on this site are used;
 * anything else falls back, so a crafted checkout link can't send a paying customer to another
 * site afterwards.
 */
export function safeRedirectUrl(candidate: unknown, fallbackPath: string): string {
  try {
    const url = new URL(String(candidate ?? ""));
    if (ALLOWED_ORIGINS.includes(url.origin)) return url.toString();
  } catch {
    // not a URL
  }
  return `${SITE_URL}${fallbackPath}`;
}
