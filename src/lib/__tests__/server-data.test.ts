import { describe, it, expect, vi, beforeEach } from "vitest";
import { readFileSync } from "fs";
import path from "path";

// server-data imports the mock list from queries, which pulls in the browser Supabase client.
vi.mock("@/lib/queries", () => ({ globalMockProductsList: [] }));

const { withRetry, ServerDataError, clearSharedResults } = await import("@/lib/server-data");

beforeEach(() => {
  clearSharedResults();
  vi.spyOn(console, "error").mockImplementation(() => {});
  vi.spyOn(console, "warn").mockImplementation(() => {});
});

// Regression: a failed fetch was rendered as an empty page ("0 products", or "Not Found" with
// noindex) and could be cached. The helpers must retry, then throw — never return empty data.
describe("withRetry", () => {
  it("returns data on the first successful attempt", async () => {
    const run = vi.fn().mockResolvedValue({ data: [1, 2], error: null });
    await expect(withRetry("t", run, [0, 0])).resolves.toEqual([1, 2]);
    expect(run).toHaveBeenCalledTimes(1);
  });

  it("retries a Supabase { error } result and succeeds", async () => {
    const run = vi
      .fn()
      .mockResolvedValueOnce({ data: null, error: { message: "TypeError: fetch failed" } })
      .mockResolvedValueOnce({ data: ["ok"], error: null });
    await expect(withRetry("t", run, [0, 0])).resolves.toEqual(["ok"]);
    expect(run).toHaveBeenCalledTimes(2);
  });

  it("retries a thrown error (e.g. timeout abort) and succeeds", async () => {
    const run = vi
      .fn()
      .mockRejectedValueOnce(new DOMException("timed out", "TimeoutError"))
      .mockResolvedValueOnce({ data: ["ok"], error: null });
    await expect(withRetry("t", run, [0, 0])).resolves.toEqual(["ok"]);
  });

  it("throws ServerDataError after the last attempt instead of returning empty data", async () => {
    const run = vi.fn().mockResolvedValue({ data: null, error: { message: "down" } });
    await expect(withRetry("t", run, [0, 0])).rejects.toBeInstanceOf(ServerDataError);
    expect(run).toHaveBeenCalledTimes(3);
    expect(console.error).toHaveBeenCalledTimes(3);
  });

  it("treats a successful empty result as data, not failure", async () => {
    const run = vi.fn().mockResolvedValue({ data: [], error: null });
    await expect(withRetry("t", run, [0, 0])).resolves.toEqual([]);
  });
});

// The SEO routes must be ISR (so a failed refresh keeps the last good page) and must not swallow
// fetch errors into an empty/"not found" render.
describe("SEO routes", () => {
  const APP = path.resolve(import.meta.dirname, "../../../app");
  const read = (f: string) => readFileSync(path.join(APP, f), "utf8");

  it.each([
    "categories/[slug]/page.tsx",
    "guides/[slug]/page.tsx",
    "products/[slug]/layout.tsx",
    "vendors/[slug]/layout.tsx",
    "articles/[slug]/layout.tsx",
    "recipes/[slug]/layout.tsx",
  ])("%s opts into ISR", (f) => {
    const src = read(f);
    expect(src).toMatch(/export const revalidate = \d+/);
    expect(src).toMatch(/export function generateStaticParams/);
  });

  it.each([
    "categories/[slug]/page.tsx",
    "guides/[slug]/page.tsx",
    "products/[slug]/layout.tsx",
    "vendors/[slug]/layout.tsx",
    "vendors/page.tsx",
    "products/page.tsx",
  ])("%s does not catch data errors", (f) => {
    expect(read(f)).not.toMatch(/catch\s*\(/);
  });

  // Pages showing product data must refresh on the same five-minute interval as the data cache
  // (DATA_REVALIDATE_SECONDS); otherwise edits can take up to two hours to appear.
  it.each([
    "page.tsx",
    "categories/page.tsx",
    "categories/[slug]/page.tsx",
    "guides/[slug]/page.tsx",
    "products/page.tsx",
    "products/[slug]/layout.tsx",
    "vendors/page.tsx",
    "vendors/[slug]/layout.tsx",
    "articles/[slug]/layout.tsx",
    "recipes/[slug]/layout.tsx",
  ])("%s refreshes every hour", (f) => {
    expect(read(f)).toMatch(/export const revalidate = 3600;/);
  });

  it("root layout hides empty categories in the menus without ever failing the page", () => {
    const src = read("layout.tsx");
    expect(src).toMatch(/export const revalidate = 3600;/);
    expect(src).toMatch(/<Header visibleCategorySlugs=\{visibleCategorySlugs\} \/>/);
    expect(src).toMatch(/<Footer visibleCategorySlugs=\{visibleCategorySlugs\} \/>/);
    expect(src).toMatch(/catch \{\s*return undefined;/);
  });

  it("/products is a server component that seeds the listing", () => {
    const src = read("products/page.tsx");
    expect(src).not.toMatch(/['"]use client['"]/);
    expect(src).toMatch(/getProductListing\(\)/);
  });
});
