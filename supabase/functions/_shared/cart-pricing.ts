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
}

export interface PricedItem {
  product_id: number;
  variant_id: number | null;
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

    let price = Number(product.price);
    let name = product.title;
    let stock = product.stock ?? 100;
    let variantId: number | null = null;

    if (raw.variant_id != null && raw.variant_id !== "") {
      const variants = Array.isArray(product.variants) ? (product.variants as any[]) : [];
      const variant = variants.find((v) => String(v?.id) === String(raw.variant_id));
      if (!variant) return { ok: false, error: `"${product.title}" option is no longer available.` };
      variantId = Number(variant.id);
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
