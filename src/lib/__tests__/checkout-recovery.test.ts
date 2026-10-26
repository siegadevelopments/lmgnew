import { describe, it, expect } from "vitest";
import { readFileSync } from "fs";
import path from "path";
import {
  checkoutExpiresAt,
  CHECKOUT_EXPIRY_HOURS,
  recoveryEmail,
  recoverySkipReason,
  sessionEmail,
  type RecoveryFacts,
} from "../../../supabase/functions/_shared/checkout-recovery";

const root = path.resolve(import.meta.dirname, "../../..");
const read = (p: string) => readFileSync(path.join(root, p), "utf8");

const send: RecoveryFacts = {
  paymentStatus: "unpaid",
  email: "shopper@example.com",
  recoveryUrl: "https://checkout.stripe.com/c/pay/cs_test_recover",
  optedIn: true,
  isSubscriber: false,
  purchasedSince: false,
  remindedRecently: false,
};

describe("recoverySkipReason", () => {
  it("sends when the shopper opted in, or is already a subscriber", () => {
    expect(recoverySkipReason(send)).toBeNull();
    expect(recoverySkipReason({ ...send, optedIn: false, isSubscriber: true })).toBeNull();
  });

  it.each<[Partial<RecoveryFacts>, string]>([
    [{ paymentStatus: "paid" }, "paid"],
    [{ email: "" }, "no email"],
    [{ recoveryUrl: null }, "no recovery link"],
    [{ optedIn: false, isSubscriber: false }, "no consent"],
    [{ purchasedSince: true }, "already purchased"],
    [{ remindedRecently: true }, "reminded recently"],
  ])("skips %o", (change, reason) => {
    expect(recoverySkipReason({ ...send, ...change })).toBe(reason);
  });
});

describe("sessionEmail", () => {
  it("prefers the email Stripe collected, lower-cased", () => {
    expect(sessionEmail({ customer_details: { email: " Shopper@Example.COM " }, customer_email: "other@example.com" })).toBe("shopper@example.com");
    expect(sessionEmail({ customer_email: "a@b.co" })).toBe("a@b.co");
    expect(sessionEmail({ metadata: { email: "m@example.com" } })).toBe("m@example.com");
  });
  it("returns empty for missing or invalid addresses", () => {
    expect(sessionEmail({})).toBe("");
    expect(sessionEmail({ customer_email: "not-an-email" })).toBe("");
  });
});

describe("checkoutExpiresAt", () => {
  it("is within Stripe's allowed 30 minutes to 24 hours", () => {
    const now = Date.UTC(2026, 10, 3, 9, 0, 0);
    const secs = checkoutExpiresAt(now) - now / 1000;
    expect(secs).toBe(CHECKOUT_EXPIRY_HOURS * 3600);
    expect(secs).toBeGreaterThanOrEqual(30 * 60);
    expect(secs).toBeLessThanOrEqual(24 * 3600);
  });
});

describe("recoveryEmail", () => {
  const email = recoveryEmail({
    firstName: "<b>Sam</b>",
    items: [{ name: 'Gift Set <script>alert(1)</script>', quantity: 1, amountCents: 12000 }],
    totalCents: 12000,
    recoveryUrl: "https://checkout.stripe.com/c/pay/cs_test_\"x",
  });

  it("escapes shopper and product text", () => {
    expect(email.html).not.toContain("<script>");
    expect(email.html).not.toContain("<b>Sam</b>");
    expect(email.html).toContain("&lt;b&gt;Sam&lt;/b&gt;");
    expect(email.html).not.toContain('cs_test_"x');
  });

  it("shows the items, total, link and how to unsubscribe", () => {
    expect(email.html).toContain("$120.00");
    expect(email.html).toContain("Return to your cart");
    expect(email.html).toMatch(/unsubscribe/i);
    expect(email.subject).not.toMatch(/[\r\n]/);
  });
});

describe("wiring", () => {
  it("checkout sessions expire with a recovery link and record consent only when ticked", () => {
    const fn = read("supabase/functions/create-checkout-session/index.ts");
    expect(fn).toMatch(/after_expiration: \{ recovery: \{ enabled: true \} \}/);
    expect(fn).toMatch(/expires_at: checkoutExpiresAt\(Date\.now\(\)\)/);
    expect(fn).toMatch(/const optedIn = marketing_consent === true;/);
  });

  it("the checkout opt-in box starts unticked", () => {
    expect(read("app/checkout/page.tsx")).toMatch(/useState\(false\);\n[\s\S]{0,10}/);
    expect(read("app/checkout/page.tsx")).toMatch(/const \[marketingConsent, setMarketingConsent\] = useState\(false\)/);
  });

  it("the webhook handles expired sessions before order fulfilment", () => {
    const wh = read("supabase/functions/stripe-webhook/index.ts");
    const expired = wh.indexOf('event.type === "checkout.session.expired"');
    const fulfil = wh.indexOf("shouldFulfil(event.type");
    expect(expired).toBeGreaterThan(0);
    expect(expired).toBeLessThan(fulfil);
  });

  it("checkout_recoveries is admin-read-only", () => {
    const sql = read("supabase/migrations/20261027_checkout_recoveries.sql");
    expect(sql).toMatch(/ENABLE ROW LEVEL SECURITY/);
    expect(sql).toMatch(/REVOKE ALL ON public\.checkout_recoveries FROM anon/);
    expect(sql).toMatch(/FOR SELECT TO authenticated USING \(public\.is_admin\(\)\)/);
    expect(sql).not.toMatch(/FOR (INSERT|UPDATE|DELETE|ALL)/);
  });
});
