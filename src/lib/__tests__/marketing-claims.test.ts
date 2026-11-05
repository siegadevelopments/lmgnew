import { describe, it, expect } from "vitest";
import { readFileSync } from "fs";
import { resolve } from "path";

const read = (p: string) => readFileSync(resolve(__dirname, "../../..", p), "utf8");

describe("no invented marketing figures", () => {
  it("trust stats never fall back to a made-up rating", () => {
    for (const f of ["src/lib/server-data.ts", "src/lib/queries.ts"]) expect(read(f)).not.toMatch(/:\s*"5\.0"/);
  });

  it("the rating tile only renders when real reviews exist", () => {
    expect(read("src/components/TrustBar.tsx")).toMatch(/reviewCount > 0/);
  });

  it("hardcoded audience, satisfaction and brand-count claims stay out", () => {
    expect(read("src/components/NewsletterSection.tsx")).not.toMatch(/10,000\+/);
    expect(read("app/sell-with-us/page.tsx")).not.toMatch(/100\+ Wellness Brands|98% Success|Vendor Satisfaction/);
    expect(read("app/about/page.tsx")).not.toMatch(/"(500|120|200)\+"|"10K\+"/);
  });

  it("the media kit counts published products only", () => {
    expect(read("app/media-package/page.tsx")).toMatch(/from\("products"\)\.select\("id, price", \{ count: "exact" \}\)\.eq\("status", "published"\)/);
  });
});
