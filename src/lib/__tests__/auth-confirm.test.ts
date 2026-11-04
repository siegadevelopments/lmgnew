import { describe, expect, it } from "vitest";
import { buildConfirmLink, resolveOtpType, safeNextPath } from "../auth-confirm";

describe("safeNextPath", () => {
  it("allows same-site relative paths", () => {
    expect(safeNextPath("/vendor")).toBe("/vendor");
    expect(safeNextPath("/login?type=recovery")).toBe("/login?type=recovery");
  });

  it.each([
    "https://evil.com",
    "//evil.com",
    "/\\evil.com",
    "javascript:alert(1)",
    "evil.com",
    "/ok\nhttps://evil.com",
  ])("rejects %j", (input) => {
    expect(safeNextPath(input)).toBe("/");
  });

  it("uses the fallback for empty input", () => {
    expect(safeNextPath(null, "/vendor")).toBe("/vendor");
    expect(safeNextPath("", "/vendor")).toBe("/vendor");
  });
});

describe("resolveOtpType", () => {
  it("maps signup to email and passes known types through", () => {
    expect(resolveOtpType("signup")).toBe("email");
    expect(resolveOtpType("email")).toBe("email");
    expect(resolveOtpType("recovery")).toBe("recovery");
  });

  it("rejects unknown or prototype keys", () => {
    expect(resolveOtpType("admin")).toBeNull();
    expect(resolveOtpType("__proto__")).toBeNull();
    expect(resolveOtpType("constructor")).toBeNull();
    expect(resolveOtpType(null)).toBeNull();
  });
});

describe("buildConfirmLink", () => {
  it("builds an own-domain link and encodes the token", () => {
    expect(buildConfirmLink("https://www.example.com", "abc123", "recovery")).toBe(
      "https://www.example.com/auth/confirm?token_hash=abc123&type=recovery",
    );
    expect(buildConfirmLink("https://x.com", "a&b=c", "recovery")).toContain("token_hash=a%26b%3Dc");
  });
});
