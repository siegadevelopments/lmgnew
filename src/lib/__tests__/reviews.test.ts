import { describe, it, expect } from "vitest";
import { readFileSync } from "fs";
import path from "path";
import {
  newReviewToken, isValidTokenShape, reviewLinkExpired, displayName, reviewerLabel,
  validateReviewInput, reviewRequestEmail, REVIEW_LINK_VALID_DAYS,
} from "@/lib/reviews";

describe("review tokens", () => {
  it("are 64 hex chars and validated by shape", () => {
    const t = newReviewToken();
    expect(isValidTokenShape(t)).toBe(true);
    expect(isValidTokenShape("abc")).toBe(false);
    expect(isValidTokenShape("../../etc")).toBe(false);
  });
  it("expire after the validity window", () => {
    const now = new Date("2026-12-01T00:00:00Z");
    expect(reviewLinkExpired(new Date(now.getTime() - (REVIEW_LINK_VALID_DAYS - 1) * 86400_000).toISOString(), now)).toBe(false);
    expect(reviewLinkExpired(new Date(now.getTime() - (REVIEW_LINK_VALID_DAYS + 1) * 86400_000).toISOString(), now)).toBe(true);
    expect(reviewLinkExpired(null, now)).toBe(true);
  });
});

describe("names", () => {
  it("shortens to first name and last initial", () => {
    expect(displayName("Ernest", "siega")).toBe("Ernest S.");
    expect(displayName("Ann", "")).toBe("Ann");
    expect(displayName("", "Smith")).toBe("");
  });
  it("labels reviews by account name, given name, or Customer", () => {
    expect(reviewerLabel({ user: { full_name: "Una B" }, reviewer_name: "x" })).toBe("Una B");
    expect(reviewerLabel({ user: null, reviewer_name: "Sam T." })).toBe("Sam T.");
    expect(reviewerLabel({})).toBe("Customer");
  });
});

describe("validateReviewInput", () => {
  it("accepts a rating with optional text", () => {
    expect(validateReviewInput({ rating: 5 })).toEqual({ ok: true, value: { rating: 5, title: "", content: "", name: "" } });
  });
  it.each([{ rating: 0 }, { rating: 6 }, { rating: 3.5 }, { rating: "x" }, { rating: 4, content: "a".repeat(2001) }, { rating: 4, title: "t".repeat(101) }])(
    "rejects %j",
    (b) => expect(validateReviewInput(b).ok).toBe(false),
  );
});

describe("reviewRequestEmail", () => {
  it("links to the order's review page and escapes text", () => {
    const { subject, html } = reviewRequestEmail({ firstName: "<b>Ann</b>", productNames: ["Kava <script>"], link: "https://www.lifestylemedicinegateway.com/review/abc" });
    expect(subject).toBe("How are you finding your order?");
    expect(html).toContain('href="https://www.lifestylemedicinegateway.com/review/abc"');
    expect(html).not.toMatch(/<script>|<b>Ann<\/b>/);
    expect(html).toContain("good or bad"); // asks for honest reviews, not only positive ones
  });
});

describe("wiring", () => {
  const root = path.resolve(import.meta.dirname, "../../..");
  const read = (f: string) => readFileSync(path.join(root, f), "utf8");

  it("the cron job is authenticated, checks the email key first, and claims before sending", () => {
    const src = read("app/api/cron/review-requests/route.ts");
    expect(src).toMatch(/authorization"\) !== `Bearer \$\{secret\}`/);
    expect(src.indexOf("RESEND_API_KEY")).toBeLessThan(src.indexOf(".update({ review_token"));
    expect(src.indexOf('.is("review_requested_at", null)\n      .select("id")')).toBeLessThan(src.indexOf("api.resend.com"));
    expect(JSON.parse(read("vercel.json")).crons.map((c: any) => c.path)).toContain("/api/cron/review-requests");
  });

  it("only the server can mark a review verified", () => {
    const sql = read("supabase/migrations/20261026_verified_reviews.sql");
    expect(sql).toMatch(/NEW\.verified_purchase := false;/);
    expect(sql).toMatch(/NEW\.verified_purchase := OLD\.verified_purchase;/);
  });

  it("the review page is never indexed", () => {
    expect(read("app/review/[token]/page.tsx")).toMatch(/robots: \{ index: false, follow: false \}/);
  });
});
