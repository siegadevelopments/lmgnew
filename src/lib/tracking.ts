export const trackEvent = (eventName: string, params?: Record<string, any>) => {
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
