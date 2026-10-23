// GA4 and the Meta Pixel load deferred (src/components/ClientOnlyOverlays.tsx: first interaction or
// 3 seconds). An event fired before then used to be dropped silently, e.g. the purchase on the
// checkout success page when the customer doesn't scroll. Wait for them, up to 20 seconds.
const TRACKER_WAIT_MS = 20_000;
const trackersReady = () =>
  typeof window !== "undefined" && (!!(window as any).gtag || !!(window as any).fbq);

export const trackEvent = (eventName: string, params?: Record<string, any>, waited = 0) => {
  if (typeof window !== "undefined" && !trackersReady() && waited < TRACKER_WAIT_MS) {
    setTimeout(() => trackEvent(eventName, params, waited + 500), 500);
    return;
  }
  try {
    // 1. Google Analytics (GA4)
    if (typeof window !== "undefined" && (window as any).gtag) {
      (window as any).gtag("event", eventName, params);
    }

    // 2. Meta Pixel
    if (typeof window !== "undefined" && (window as any).fbq) {
      // Map standard GA4 ecommerce events to standard Meta Pixel events if possible
      let fbEventName = eventName;
      if (eventName === "add_to_cart") fbEventName = "AddToCart";
      if (eventName === "begin_checkout") fbEventName = "InitiateCheckout";
      if (eventName === "purchase") fbEventName = "Purchase";
      if (eventName === "view_item") fbEventName = "ViewContent";

      // Some events are standard, some are custom
      const standardEvents = ["AddToCart", "InitiateCheckout", "Purchase", "ViewContent", "Lead", "CompleteRegistration"];
      const isStandard = standardEvents.includes(fbEventName);

      if (isStandard) {
        (window as any).fbq("track", fbEventName, params);
      } else {
        (window as any).fbq("trackCustom", fbEventName, params);
      }
    }
  } catch (error) {
    console.error("Tracking event failed:", error);
  }
};

export const recordUserActivity = (category?: string, productId?: string | number) => {
  if (typeof window === "undefined") return;
  try {
    if (category) {
      const rawCats = localStorage.getItem("lmg_user_categories");
      const cats: string[] = rawCats ? JSON.parse(rawCats) : [];
      // Move to front if exists, keep max 10
      const filtered = cats.filter((c) => c !== category);
      filtered.unshift(category);
      localStorage.setItem("lmg_user_categories", JSON.stringify(filtered.slice(0, 10)));
    }
    if (productId) {
      const rawIds = localStorage.getItem("lmg_user_viewed_products");
      const ids: (string | number)[] = rawIds ? JSON.parse(rawIds) : [];
      const filtered = ids.filter((id) => id !== productId);
      filtered.unshift(productId);
      localStorage.setItem("lmg_user_viewed_products", JSON.stringify(filtered.slice(0, 20)));
    }
  } catch (e) {
    console.warn("Failed to save user activity:", e);
  }
};

export const getUserActivity = () => {
  if (typeof window === "undefined") return { preferredCategories: [], viewedProductIds: [] };
  try {
    const rawCats = localStorage.getItem("lmg_user_categories");
    const rawIds = localStorage.getItem("lmg_user_viewed_products");
    return {
      preferredCategories: (rawCats ? JSON.parse(rawCats) : []) as string[],
      viewedProductIds: (rawIds ? JSON.parse(rawIds) : []) as (string | number)[],
    };
  } catch {
    return { preferredCategories: [], viewedProductIds: [] };
  }
};

export const trackAddToCart = (product: { id: string | number; title: string; price: number; category?: string }) => {
  recordUserActivity(product.category, product.id);
  trackEvent("add_to_cart", {
    currency: "AUD",
    value: product.price,
    items: [
      {
        item_id: product.id,
        item_name: product.title,
        item_category: product.category,
        price: product.price,
        quantity: 1,
      },
    ],
  });
};

export const trackViewItem = (product: { id: string | number; title: string; price: number; category?: string }) => {
  recordUserActivity(product.category, product.id);
  trackEvent("view_item", {
    currency: "AUD",
    value: product.price,
    items: [
      {
        item_id: product.id,
        item_name: product.title,
        item_category: product.category,
        price: product.price,
      },
    ],
  });
};

export const trackPurchase = (transactionId: string, totalValue: number, items: any[]) => {
  trackEvent("purchase", {
    transaction_id: transactionId,
    value: totalValue,
    currency: "AUD",
    items: items.map(item => ({
      item_id: item.product_id,
      item_name: item.title,
      price: item.price,
      quantity: item.quantity
    }))
  });
};

export const trackBeginCheckout = (value: number, items: { product_id: string | number; name: string; price: number; quantity: number }[]) => {
  trackEvent("begin_checkout", {
    value,
    currency: "AUD",
    items: items.map((i) => ({ item_id: i.product_id, item_name: i.name, price: i.price, quantity: i.quantity })),
  });
};

// The order a visitor is about to pay for, kept until the success page reports it. Stripe sends
// the customer back to /checkout/success in the same tab after paying.
const PENDING_PURCHASE_KEY = "lmg_pending_purchase";
const PENDING_MAX_AGE_MS = 2 * 60 * 60 * 1000;

export interface PendingPurchase {
  transactionId: string;
  value: number;
  items: { product_id: string | number; name: string; price: number; quantity: number }[];
  savedAt: number;
}

export const savePendingPurchase = (p: Omit<PendingPurchase, "savedAt">) => {
  try {
    localStorage.setItem(PENDING_PURCHASE_KEY, JSON.stringify({ ...p, savedAt: Date.now() }));
  } catch {
    // storage blocked: the purchase just isn't tracked
  }
};

/** Reports the saved purchase once (refreshing the success page sends nothing). */
export const reportPendingPurchase = (now = Date.now()): PendingPurchase | null => {
  let pending: PendingPurchase | null = null;
  try {
    const raw = localStorage.getItem(PENDING_PURCHASE_KEY);
    localStorage.removeItem(PENDING_PURCHASE_KEY);
    pending = raw ? (JSON.parse(raw) as PendingPurchase) : null;
  } catch {
    return null;
  }
  if (!pending || !pending.transactionId || now - pending.savedAt > PENDING_MAX_AGE_MS) return null;
  trackPurchase(
    pending.transactionId,
    pending.value,
    pending.items.map((i) => ({ product_id: i.product_id, title: i.name, price: i.price, quantity: i.quantity })),
  );
  return pending;
};

/** Stripe Checkout URLs contain the session id (cs_live_… / cs_test_…), used as transaction_id. */
export const checkoutSessionId = (url: string): string | null => url.match(/cs_(?:live|test)_[A-Za-z0-9]+/)?.[0] ?? null;
