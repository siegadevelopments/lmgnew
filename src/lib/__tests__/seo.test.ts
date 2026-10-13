import { describe, it, expect } from "vitest";
import { readdirSync, readFileSync, statSync } from "fs";
import path from "path";
import { buildMetadata, notFoundMetadata } from "@/lib/seo-metadata";
import { categoryConfig } from "@/lib/category-config";
import { guideConfig } from "@/lib/guide-config";

const APP_DIR = path.resolve(import.meta.dirname, "../../../app");

function walk(dir: string): string[] {
  return readdirSync(dir).flatMap((name) => {
    const full = path.join(dir, name);
    return statSync(full).isDirectory() ? walk(full) : [full];
  });
}

// Regression: category and guide pages all rendered "Not Found" / noindex / homepage-canonical
// because their *server* layouts imported config from a 'use client' page.tsx. Server code gets an
// opaque client reference for non-component exports from a client module, so every lookup was
// undefined. Server layouts must never import from a sibling page.
describe("server layouts do not import from a sibling page", () => {
  const layouts = walk(APP_DIR).filter((f) => /[\\/]layout\.tsx$/.test(f));

  it("finds layouts to check", () => {
    expect(layouts.length).toBeGreaterThan(3);
  });

  it.each(layouts)("%s", (file) => {
    const src = readFileSync(file, "utf8");
    expect(src).not.toMatch(/from\s+["']\.\/page["']/);
  });
});

describe("category and guide content modules", () => {
  it("are plain data (resolvable on the server) with the fields the metadata needs", () => {
    expect(Object.keys(categoryConfig)).toContain("menopause-support");
    expect(Object.keys(guideConfig)).toContain("best-menopause-products-australia");
    for (const c of Object.values(categoryConfig)) {
      expect(c.name && c.heroDescription && c.keywords.length).toBeTruthy();
    }
    for (const g of Object.values(guideConfig)) {
      expect(g.title && g.intro && g.categorySlug in categoryConfig).toBeTruthy();
    }
  });
});

describe("page metadata", () => {
  it("is indexable with a self-referencing canonical", () => {
    const m = buildMetadata({ title: "T", description: "D", path: "/categories/menopause-support" });
    expect(m.robots).toEqual({ index: true, follow: true });
    expect(m.alternates?.canonical).toBe("https://www.lifestylemedicinegateway.com/categories/menopause-support");
  });

  it("marks genuinely missing pages noindex", () => {
    expect(notFoundMetadata("X").robots).toEqual({ index: false, follow: false });
  });
});
