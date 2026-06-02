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

export const trackAddToCart = (product: { id: string | number, title: string, price: number, category?: string }) => {
  trackEvent("add_to_cart", {
    currency: "AUD",
    value: product.price,
    items: [
      {
        item_id: product.id,
        item_name: product.title,
        item_category: product.category,
        price: product.price,
        quantity: 1
      }
    ]
  });
};

export const trackViewItem = (product: { id: string | number, title: string, price: number, category?: string }) => {
  trackEvent("view_item", {
    currency: "AUD",
    value: product.price,
    items: [
      {
        item_id: product.id,
        item_name: product.title,
        item_category: product.category,
        price: product.price
      }
    ]
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
