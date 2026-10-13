import { describe, it, expect } from "vitest";
import { sanitizeHtml, jsonLd } from "@/lib/security";

// Runs in the node environment, so this exercises the server-render (sanitize-html) path —
// the one that used to return raw HTML.
describe("sanitizeHtml (server path)", () => {
  it("strips script tags", () => {
    expect(sanitizeHtml('<p>hi</p><script>alert(1)</script>')).toBe("<p>hi</p>");
  });
  it("strips inline event handlers", () => {
    const out = sanitizeHtml('<img src="https://x.test/a.png" onerror="alert(1)">');
    expect(out).not.toContain("onerror");
  });
  it("blocks javascript: URLs", () => {
    expect(sanitizeHtml('<a href="javascript:alert(1)">x</a>')).not.toContain("javascript:");
  });
  it("removes iframes and inline styles", () => {
    const out = sanitizeHtml('<iframe src="https://evil.test"></iframe><p style="color:red">t</p>');
    expect(out).not.toContain("iframe");
    expect(out).not.toContain("style");
  });
  it("keeps normal formatting", () => {
    expect(sanitizeHtml("<h2>Title</h2><p><strong>bold</strong></p>")).toBe("<h2>Title</h2><p><strong>bold</strong></p>");
  });
  it("adds rel=noopener to links", () => {
    expect(sanitizeHtml('<a href="https://a.test" target="_blank">a</a>')).toContain("noopener");
  });
});

describe("jsonLd", () => {
  it("cannot be broken out of a <script> tag", () => {
    const out = jsonLd({ name: "</script><script>alert(1)</script>" });
    expect(out).not.toContain("</script>");
    expect(JSON.parse(out).name).toBe("</script><script>alert(1)</script>");
  });
});
