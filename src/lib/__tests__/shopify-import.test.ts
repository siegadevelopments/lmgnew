import { describe, expect, it } from "vitest";
import sanitizeHtmlLib from "sanitize-html";
import {
  collectImageUrls,
  feedUrl,
  isAllowedImageUrl,
  isSameSiteRedirect,
  mapProduct,
  mergeAvailability,
  parseStoreUrl,
  planImport,
  rewriteImages,
  SANITIZE_OPTIONS,
  slugFor,
  type ShopifyProduct,
} from "../../../supabase/functions/_shared/shopify-import";

// The exact options the Edge Function sanitises with, so these tests prove the real rules.
const sanitize = (html: string) => sanitizeHtmlLib(html, SANITIZE_OPTIONS);

const cdn = "https://cdn.shopify.com/s/files/1/0001/products";

function product(over: Partial<ShopifyProduct> = {}): ShopifyProduct {
  return {
    id: 7001,
    title: "Magnesium Glycinate",
    handle: "magnesium-glycinate",
    body_html: "<p>Gentle <strong>magnesium</strong>.</p>",
    vendor: "Calm Co",
    product_type: "Supplements",
    tags: "sleep, calm",
    variants: [
      { id: 91, title: "60 capsules", price: "29.95", available: true },
      { id: 92, title: "120 capsules", price: "49.95", available: false },
    ],
    images: [
      { id: 1, src: `${cdn}/front.jpg`, variant_ids: [] },
      { id: 2, src: `${cdn}/back.jpg`, variant_ids: [92] },
    ],
    ...over,
  };
}

describe("parseStoreUrl", () => {
  it.each(["https://shop.example.com", "shop.example.com", "https://shop.example.com/", "  Shop.Example.com  "])(
    "normalises %j to one store address",
    (input) => {
      const r = parseStoreUrl(input);
      expect(r).toEqual({ ok: true, origin: "https://shop.example.com" });
    },
  );

  it.each([
    "http://shop.example.com",
    "https://127.0.0.1",
    "https://localhost",
    "https://10.0.0.5",
    "https://[::1]",
    "https://user:pass@shop.example.com",
    "https://shop.example.com/admin/secrets",
    "https://shop.example.com:8443",
    "https://intranet.local",
    "https://metadata.internal",
    "https://singlelabel",
    "",
  ])("rejects %j", (input) => {
    const r = parseStoreUrl(input);
    expect(r.ok).toBe(false);
    if (!r.ok) expect(r.reason.length).toBeGreaterThan(0);
  });

  it("only ever asks for the product feed", () => {
    expect(feedUrl("https://shop.example.com", 3)).toBe("https://shop.example.com/products.json?limit=250&page=3");
  });
});

describe("isAllowedImageUrl", () => {
  it("accepts Shopify's CDN over https only", () => {
    expect(isAllowedImageUrl(`${cdn}/a.jpg`)).toBe(true);
    expect(isAllowedImageUrl("http://cdn.shopify.com/a.jpg")).toBe(false);
    expect(isAllowedImageUrl("https://evil.example.com/a.jpg")).toBe(false);
    expect(isAllowedImageUrl("https://cdn.shopify.com.evil.example/a.jpg")).toBe(false);
    expect(isAllowedImageUrl("data:image/png;base64,AAAA")).toBe(false);
    expect(isAllowedImageUrl("not a url")).toBe(false);
  });
});

describe("mapProduct", () => {
  it("turns a two-variant product into one draft with both variants and the store's availability", () => {
    const r = mapProduct(product(), { startingQuantity: 25, sanitize });
    expect(r.ok).toBe(true);
    if (!r.ok) return;
    expect(r.draft.title).toBe("Magnesium Glycinate");
    expect(r.draft.source_platform).toBe("shopify");
    expect(r.draft.source_ref).toBe("7001");
    expect(r.draft.price).toBe(29.95);
    expect(r.draft.brand).toBe("Calm Co");
    expect(r.draft.tags).toEqual(["sleep", "calm"]);
    expect(r.draft.variants).toEqual([
      { id: "91", source_ref: "91", title: "60 capsules", price: 29.95, stock: 25, available: true },
      { id: "92", source_ref: "92", title: "120 capsules", price: 49.95, stock: 25, available: false },
    ]);
    expect(r.draft.stock).toBe(25);
  });

  it("keeps a lone 'Default Title' variant so the sync has something to flip", () => {
    const r = mapProduct(product({ variants: [{ id: 5, title: "Default Title", price: "10.00", available: false }] }), {
      startingQuantity: 10,
      sanitize,
    });
    expect(r.ok).toBe(true);
    if (!r.ok) return;
    expect(r.draft.variants).toHaveLength(1);
    expect(r.draft.variants[0]).toMatchObject({ title: "Default Title", available: false });
    expect(r.draft.stock).toBe(0);
  });

  it("skips, with the product's name and a reason, when title or price is unusable", () => {
    const noTitle = mapProduct(product({ title: "  " }), { startingQuantity: 1, sanitize });
    const noPrice = mapProduct(product({ title: "Free thing", variants: [{ id: 1, title: "x", price: "0.00", available: true }] }), {
      startingQuantity: 1,
      sanitize,
    });
    const noVariants = mapProduct(product({ title: "Empty", variants: [] }), { startingQuantity: 1, sanitize });
    for (const r of [noTitle, noPrice, noVariants]) {
      expect(r.ok).toBe(false);
      if (!r.ok) expect(r.reason).toMatch(/title|price|variant/i);
    }
    expect(noPrice.ok === false && noPrice.name).toBe("Free thing");
  });

  it("keeps the vendor's wording but strips scripts and event handlers", () => {
    const r = mapProduct(
      product({ body_html: '<p>Calming blend.</p><script>alert(1)</script><img src="x" onerror="steal()"><p>Take daily.</p>' }),
      { startingQuantity: 1, sanitize },
    );
    expect(r.ok).toBe(true);
    if (!r.ok) return;
    expect(r.draft.content).toContain("Calming blend.");
    expect(r.draft.content).toContain("Take daily.");
    expect(r.draft.content).not.toMatch(/script|onerror|alert/);
  });

  it("removes javascript: links and iframes as well as scripts", () => {
    const r = mapProduct(
      product({ body_html: '<p>Hi</p><a href="javascript:alert(1)">click</a><iframe src="https://evil.example"></iframe><a href="https://ok.example">fine</a>' }),
      { startingQuantity: 1, sanitize },
    );
    expect(r.ok).toBe(true);
    if (!r.ok) return;
    expect(r.draft.content).not.toMatch(/javascript:|iframe/i);
    expect(r.draft.content).toContain("https://ok.example");
    expect(r.draft.content).toContain("click");
  });

  it("drops a variant with no usable price and keeps the rest", () => {
    const r = mapProduct(
      product({ variants: [{ id: 1, title: "Good", price: "5.00", available: true }, { id: 2, title: "Bad", price: "", available: true }] }),
      { startingQuantity: 3, sanitize },
    );
    expect(r.ok).toBe(true);
    if (!r.ok) return;
    expect(r.draft.variants.map((v) => v.id)).toEqual(["1"]);
  });

  it("skips a product whose id isn't a plain identifier, since the id ends up in storage paths", () => {
    const r = mapProduct(product({ id: "../../etc" as any }), { startingQuantity: 1, sanitize });
    expect(r.ok).toBe(false);
  });

  it("slugs are readable and tied to the source id", () => {
    expect(slugFor("Magnesium Glycinate (60s)!", "7001")).toBe("magnesium-glycinate-60s-7001");
  });
});

describe("images", () => {
  it("flags relative and protocol-relative description images instead of letting them through", () => {
    const urls = collectImageUrls(product({ body_html: '<img src="//cdn.shopify.com/a.jpg"><img src="/local.jpg">' }));
    expect(urls.filter((u) => !isAllowedImageUrl(u))).toEqual(["//cdn.shopify.com/a.jpg", "/local.jpg"]);
  });

  it("collects product, variant and description images once each", () => {
    const urls = collectImageUrls(
      product({ body_html: `<p>See</p><img src="${cdn}/inline.jpg"><img src="${cdn}/front.jpg">` }),
    );
    expect(urls).toEqual([`${cdn}/front.jpg`, `${cdn}/back.jpg`, `${cdn}/inline.jpg`]);
  });

  it("rewrites every copied image in a description and leaves uncopied ones for the caller to flag", () => {
    const html = `<p>x</p><img src="${cdn}/inline.jpg" alt="a"><img src='${cdn}/other.jpg'>`;
    const out = rewriteImages(html, { [`${cdn}/inline.jpg`]: "https://media.example.com/p/inline.jpg" });
    expect(out).toContain('src="https://media.example.com/p/inline.jpg"');
    expect(out).toContain(`${cdn}/other.jpg`);
  });
});

describe("planImport (re-importing)", () => {
  it("inserts a new product as a draft", () => {
    expect(planImport(null)).toEqual({ action: "insert", status: "draft" });
  });
  it("leaves an existing product alone so edits survive", () => {
    expect(planImport({ import_issue: null })).toEqual({ action: "skip", status: "draft" });
    expect(planImport({})).toEqual({ action: "skip", status: "draft" });
  });
  it("retries a flagged product", () => {
    expect(planImport({ import_issue: "1 image could not be copied" }).action).toBe("retry");
  });
});

describe("isSameSiteRedirect", () => {
  const base = "https://shop.example.com/products.json?limit=250&page=1";
  it("allows the bare domain <-> www hop over https", () => {
    expect(isSameSiteRedirect("shop.example.com", "https://www.shop.example.com/products.json", base)).toBe(true);
    expect(isSameSiteRedirect("www.shop.example.com", "https://shop.example.com/products.json", base)).toBe(true);
    expect(isSameSiteRedirect("shop.example.com", "/products.json?page=1", base)).toBe(true);
  });
  it("refuses another host, http, a port, or a login", () => {
    expect(isSameSiteRedirect("shop.example.com", "https://evil.example.com/x", base)).toBe(false);
    expect(isSameSiteRedirect("shop.example.com", "https://shop.myshopify.com/x", base)).toBe(false);
    expect(isSameSiteRedirect("shop.example.com", "http://shop.example.com/x", base)).toBe(false);
    expect(isSameSiteRedirect("shop.example.com", "https://shop.example.com:8443/x", base)).toBe(false);
    expect(isSameSiteRedirect("shop.example.com", "https://u:p@shop.example.com/x", base)).toBe(false);
  });
});

describe("mergeAvailability (the daily sync)", () => {
  const lmg = () => [
    { id: "91", source_ref: "91", title: "60", price: 29.95, stock: 7, available: true },
    { id: "92", source_ref: "92", title: "120", price: 49.95, stock: 3, available: false },
    { id: "u-1", title: "Hand added", price: 5, stock: 2 },
  ];

  it("turns a sold-out variant unavailable and a back-in-stock one available, touching nothing else", () => {
    const feed = product({
      variants: [
        { id: 91, title: "60 capsules RENAMED", price: "99.00", available: false },
        { id: 92, title: "120", price: "1.00", available: true },
      ],
    });
    const { variants, changed } = mergeAvailability(lmg(), feed);
    expect(changed).toBe(true);
    expect(variants[0]).toEqual({ id: "91", source_ref: "91", title: "60", price: 29.95, stock: 7, available: false });
    expect(variants[1]).toEqual({ id: "92", source_ref: "92", title: "120", price: 49.95, stock: 3, available: true });
  });

  it("never changes a variant that did not come from Shopify", () => {
    const { variants } = mergeAvailability(lmg(), product({ variants: [] }));
    expect(variants[2]).toEqual({ id: "u-1", title: "Hand added", price: 5, stock: 2 });
  });

  it("marks every imported variant unavailable when the product has left the store", () => {
    const { variants, changed } = mergeAvailability(lmg(), undefined);
    expect(changed).toBe(true);
    expect(variants.filter((v) => v.source_ref).every((v) => v.available === false)).toBe(true);
    expect(variants).toHaveLength(3);
  });

  it("reports no change when the store already matches", () => {
    const feed = product();
    expect(mergeAvailability(lmg(), feed).changed).toBe(false);
  });

  it("marks a variant missing from the feed unavailable", () => {
    const feed = product({ variants: [{ id: 91, title: "60", price: "29.95", available: true }] });
    const { variants } = mergeAvailability(lmg(), feed);
    expect(variants[1].available).toBe(false);
    expect(variants[0].available).toBe(true);
  });
});

// The function itself can't run under Vitest (it is Deno code that talks to Shopify and R2), so
// these guard the rules that keep it safe: who may call it, and that it never follows redirects.
import { readFileSync } from "fs";
import path from "path";
const fn = readFileSync(
  path.resolve(import.meta.dirname, "../../../supabase/functions/import-shopify-catalogue/index.ts"),
  "utf8",
);

describe("import-shopify-catalogue function", () => {
  it("authorises before doing any work: admins, or the schedule's secret for sync only", () => {
    expect(fn).toMatch(/requireAuth\(req, \["admin"\], corsHeaders\)/);
    expect(fn).toMatch(/op === "sync" && req\.headers\.has\("x-webhook-secret"\)/);
    expect(fn).toMatch(/requireWebhookSecret\(req, "SHOPIFY_SYNC_SECRET", corsHeaders\)/);
    expect(fn.indexOf("if (denied) return denied;")).toBeLessThan(fn.indexOf("createClient("));
  });

  it("never follows a redirect off the address it was given", () => {
    const calls = fn.match(/\bfetch\(/g) ?? [];
    expect(calls.length).toBeGreaterThan(0);
    expect((fn.match(/redirect: "manual"/g) ?? []).length).toBe(calls.length);
  });

  it("only fetches addresses that passed the shared safety checks", () => {
    expect(fn).toMatch(/parseStoreUrl\(/);
    expect(fn).toMatch(/if \(!isAllowedImageUrl\(url\)\) return null;/);
  });
});
