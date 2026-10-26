import { describe, it, expect } from "vitest";
import { readFileSync } from "fs";
import path from "path";
import { freeGuides, freeGuidePath, welcomeEmail } from "@/lib/free-guides";
import { categoryConfig } from "@/lib/category-config";

const all = Object.values(freeGuides);
const text = (g: (typeof all)[number]) => [g.title, g.summary, g.intro, g.closing, g.seeYourGp, ...g.days.flatMap((d) => [d.title, d.why, d.action])].join(" ");

describe("free guides follow the health-content rules", () => {
  it.each(all.map((g) => [g.slug, g] as const))("%s", (_slug, g) => {
    const t = text(g);
    // No treatment/cure claims, guarantees or hype (marketing/social/brand-voice.md).
    expect(t).not.toMatch(/\b(cure|cures|treat|treats|treatment|guarantee|guaranteed|miracle|instantly|overnight)\b/i);
    expect(t).not.toMatch(/!/);
    expect(g.seeYourGp).toMatch(/not medical advice/i);
    expect(g.seeYourGp).toMatch(/GP/);
    expect(g.categorySlug in categoryConfig).toBe(true);
    expect(g.days).toHaveLength(7);
  });

  it("uses Australian spelling", () => {
    for (const g of all) expect(text(g)).not.toMatch(/\b(color|behavior|organize|realize|favorite|center)\b/i);
  });
});

describe("welcomeEmail", () => {
  it("links the requested guide", () => {
    const { subject, link } = welcomeEmail("7-day-sleep-reset");
    expect(subject).toBe("Your free guide: Your 7-day sleep reset");
    expect(link).toBe(`https://www.lifestylemedicinegateway.com${freeGuidePath("7-day-sleep-reset")}`);
  });
  it("falls back to a plain welcome for unknown guides", () => {
    expect(welcomeEmail("nope").subject).toBe("Welcome to Lifestyle Medicine Gateway");
    expect(welcomeEmail(null).html).toContain("unsubscribe");
  });
});

describe("sign-up wiring", () => {
  const root = path.resolve(import.meta.dirname, "../../..");
  const read = (f: string) => readFileSync(path.join(root, f), "utf8");
  it("the popup signs up through the server, with a honeypot", () => {
    const popup = read("src/components/GlobalPopup.tsx");
    expect(popup).toMatch(/fetch\("\/api\/subscribe"/);
    expect(popup).not.toMatch(/from\("newsletter_subscribers"\)/);
    expect(popup).toMatch(/name="website"/);
  });
  it("the endpoint validates email, throttles and treats the honeypot as a bot", () => {
    const api = read("app/api/subscribe/route.ts");
    expect(api).toMatch(/EMAIL_RE\.test\(email\)/);
    expect(api).toMatch(/if \(body\?\.website\)/);
    expect(api).toMatch(/status: 429/);
    expect(api).not.toMatch(/^export (function|const) (?!POST)/m); // route files may only export handlers
  });
});
