import { describe, it, expect } from "vitest";
import { readFileSync } from "fs";
import path from "path";
import { isTradeListing, retailOnly } from "@/lib/trade";

describe("isTradeListing", () => {
  it.each([
    "WHOLESALE Desert Lime Renewal Cleanser (Salon Only 250ml)",
    "Purslane Toner 500mL (Salon Only)",
    "MASK_WHOLESALE_PLUMP & GLOW (SALON ONLY 250ml)",
    "Dishwashing Liquid - Lemon & Lime 20kg",
    "Organic Peanut Butter - Smooth 5kg",
    "Room Spray – Lemon Myrtle 5kg (Natural Air Freshener | Bulk Va",
  ])("trade: %s", (t) => expect(isTradeListing(t)).toBe(true));

  it.each([
    "Organic Peanut Butter - Crunchy 1kg",
    "Organic Peanut Butter - Crunchy 2kg",
    "Pro-Aging Starter Kit",
    "Magnesium Oil Spray",
    "Celtic Sea Salt (Coarse)",
    "",
  ])("retail: %s", (t) => expect(isTradeListing(t)).toBe(false));

  it("retailOnly drops trade listings", () => {
    expect(retailOnly([{ title: "Magnesium Oil Spray" }, { title: "Toner 500mL (Salon Only)" }])).toEqual([{ title: "Magnesium Oil Spray" }]);
  });
});

describe("every retail product list excludes trade listings", () => {
  const root = path.resolve(import.meta.dirname, "../../..");
  const read = (f: string) => readFileSync(path.join(root, f), "utf8");
  it.each([
    ["src/lib/server-data.ts", /retailOnly\(\(data as any\[\]\) \|\| \[\]\)/],
    ["src/lib/server-data.ts", /fetchRetailListingProducts\(\)\)\]\.sort/],
    ["src/lib/queries.ts", /retailOnly\(\(data \|\| \[\]\) as any\[\]\)\.filter/],
    ["src/lib/queries.ts", /retailOnly\(\(data \|\| \[\]\) as any\[\]\)\.slice\(0, 4\)/],
    ["app/search/page.tsx", /retailOnly\(productsRes\.data/],
    ["src/components/BestSellersSection.tsx", /retailOnly\(\(data \|\| \[\]\)/],
    ["app/products/[slug]/page.tsx", /isTradeListing\(p\.title\) === isTradeListing\(product\.title\)/],
  ])("%s", (file, pattern) => expect(read(file)).toMatch(pattern));

  it("the trade page and footer link exist", () => {
    expect(read("app/trade/page.tsx")).toMatch(/getTradeProducts\(\)/);
    expect(read("src/components/Footer.tsx")).toContain('to: "/trade"');
  });
});
