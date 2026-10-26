// Verified-purchase reviews: the review-request email, the review link token and input checks.
// Pure (no database or network), so it is unit-tested. See
// supabase/migrations/20261026_verified_reviews.sql.

export const SITE_URL = "https://www.lifestylemedicinegateway.com";
/** Ask for a review this many days after the order (time to arrive and try it). */
export const REVIEW_REQUEST_AFTER_DAYS = 10;
/** Only ask for orders up to this old, so a first run doesn't email very old customers. */
export const REVIEW_REQUEST_MAX_AGE_DAYS = 30;
/** How long a review link works after the email is sent. */
export const REVIEW_LINK_VALID_DAYS = 120;

export function newReviewToken(): string {
  const bytes = new Uint8Array(32);
  crypto.getRandomValues(bytes);
  return Array.from(bytes, (b) => b.toString(16).padStart(2, "0")).join("");
}

export const isValidTokenShape = (t: unknown): t is string => typeof t === "string" && /^[0-9a-f]{64}$/.test(t);

export function reviewLinkExpired(requestedAt: string | null, now = new Date()): boolean {
  if (!requestedAt) return true;
  return now.getTime() - new Date(requestedAt).getTime() > REVIEW_LINK_VALID_DAYS * 86400_000;
}

/** "Ernest S." from first and last name; "" when there's no first name. */
export function displayName(first?: string | null, last?: string | null): string {
  const f = (first ?? "").trim();
  if (!f) return "";
  const l = (last ?? "").trim();
  return l ? `${f} ${l[0].toUpperCase()}.` : f;
}

/** Name shown on a review: the account's name, else the name given, else "Customer". */
export function reviewerLabel(r: { reviewer_name?: string | null; user?: { full_name?: string | null } | null; profile?: { full_name?: string | null } | null }): string {
  return r.user?.full_name || r.profile?.full_name || r.reviewer_name || "Customer";
}

export type ReviewInput = { rating: number; title: string; content: string; name: string };

export function validateReviewInput(body: any): { ok: true; value: ReviewInput } | { ok: false; error: string } {
  const rating = Number(body?.rating);
  if (!Number.isInteger(rating) || rating < 1 || rating > 5) return { ok: false, error: "Please choose a rating from 1 to 5 stars." };
  const title = String(body?.title ?? "").trim();
  const content = String(body?.content ?? "").trim();
  const name = String(body?.name ?? "").trim();
  if (title.length > 100) return { ok: false, error: "Please keep the title under 100 characters." };
  if (content.length > 2000) return { ok: false, error: "Please keep the review under 2,000 characters." };
  if (name.length > 60) return { ok: false, error: "Please keep your name under 60 characters." };
  return { ok: true, value: { rating, title, content, name } };
}

const escapeHtml = (v: unknown) =>
  String(v ?? "").replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[c]!);

/** The review-request email. Customer and product text is escaped. */
export function reviewRequestEmail(o: { firstName: string; productNames: string[]; link: string }) {
  const greeting = o.firstName ? `Hi ${escapeHtml(o.firstName)},` : "Hi,";
  const list = o.productNames.slice(0, 6).map((n) => `<li style="margin:4px 0">${escapeHtml(n)}</li>`).join("");
  const html = `
  <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; color: #333; border: 1px solid #eee; border-radius: 10px;">
    <h1 style="color: #10b981; font-size: 22px;">How are you finding your order?</h1>
    <p>${greeting}</p>
    <p>A little while ago you ordered from Lifestyle Medicine Gateway:</p>
    <ul style="padding-left: 18px;">${list}</ul>
    <p>Would you share a quick review? It takes about a minute, and honest reviews, good or bad, help other
      Australians choose wellness products with confidence.</p>
    <p style="margin: 24px 0;">
      <a href="${escapeHtml(o.link)}" style="display: inline-block; background: #10b981; color: #fff; padding: 12px 24px; text-decoration: none; border-radius: 6px; font-weight: bold;">Write a review</a>
    </p>
    <p style="font-size: 12px; color: #64748b;">No account needed. This link is just for your order and works for ${REVIEW_LINK_VALID_DAYS} days.</p>
    <p style="font-size: 12px; color: #64748b;">Lifestyle Medicine Gateway</p>
  </div>`;
  return { subject: "How are you finding your order?", html };
}
