import { describe, expect, it } from "vitest";
import { cartSignature, metaParams, trackBeginCheckoutOnce } from "../tracking";

describe("metaParams", () => {
  it("converts GA4 items to the fields the Meta Pixel reads", () => {
    const out = metaParams({
      transaction_id: "cs_live_x",
      value: 120,
      currency: "AUD",
      items: [{ item_id: "p1", item_name: "Gift Set", price: 120, quantity: 2 }],
    })!;
    expect(out.value).toBe(120);
    expect(out.currency).toBe("AUD");
    expect(out.content_type).toBe("product");
    expect(out.content_ids).toEqual(["p1"]);
    expect(out.contents).toEqual([{ id: "p1", quantity: 2, item_price: 120 }]);
    expect(out.num_items).toBe(2);
    expect(out.items).toBeUndefined();
  });
  it("passes params without items through unchanged", () => {
    const p = { value: 5, currency: "AUD" };
    expect(metaParams(p)).toBe(p);
    expect(metaParams(undefined)).toBeUndefined();
  });
});

describe("trackersReady", () => {
  it("waits for the Pixel when it is configured, even if GA is already loaded", async () => {
    process.env.NEXT_PUBLIC_GA_ID = "G-TEST";
    process.env.NEXT_PUBLIC_META_PIXEL_ID = "123";
    const { trackersReady } = await import("../tracking");
    expect(trackersReady({ gtag: () => {} })).toBe(false);
    expect(trackersReady({ gtag: () => {}, fbq: () => {} })).toBe(true);
  });
});

describe("trackBeginCheckoutOnce", () => {
  const store = () => {
    const m = new Map<string, string>();
    return { getItem: (k: string) => m.get(k) ?? null, setItem: (k: string, v: string) => void m.set(k, v) };
  };
  const item = (id: number, quantity = 1) => ({ product_id: id, name: "Gift Set", price: 120, quantity });

  it("reports an open checkout once, and again only when the cart changes", () => {
    const s = store();
    expect(trackBeginCheckoutOnce(120, [item(1)], s)).toBe(true);
    expect(trackBeginCheckoutOnce(120, [item(1)], s)).toBe(false); // refresh, same cart
    expect(trackBeginCheckoutOnce(240, [item(1, 2)], s)).toBe(true); // quantity changed
  });
  it("reports nothing for an empty cart", () => {
    expect(trackBeginCheckoutOnce(0, [], store())).toBe(false);
  });
  it("still reports when storage is blocked", () => {
    const blocked = { getItem: () => { throw new Error("blocked"); }, setItem: () => { throw new Error("blocked"); } };
    expect(trackBeginCheckoutOnce(120, [item(1)], blocked)).toBe(true);
  });
  it("gives the same signature whatever the item order", () => {
    expect(cartSignature([item(1), item(2)])).toBe(cartSignature([item(2), item(1)]));
  });
});
