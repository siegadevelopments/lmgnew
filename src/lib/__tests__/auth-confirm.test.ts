import { describe, expect, it } from "vitest";
import {
  buildConfirmLink,
  isRememberablePath,
  resolveOtpType,
  resolvePostConfirmPath,
  sanitizeReturnPath,
  safeNextPath,
} from "../auth-confirm";

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

describe("resolvePostConfirmPath", () => {
  it("sends admins to the admin dashboard, even if they asked for another role", () => {
    expect(resolvePostConfirmPath({ profileRole: "admin", requestedRole: "vendor", returnTo: "/recipes" })).toBe("/admin");
  });

  it("sends vendors to the vendor dashboard", () => {
    expect(resolvePostConfirmPath({ profileRole: "customer", requestedRole: "vendor" })).toBe("/vendor");
    expect(resolvePostConfirmPath({ profileRole: "vendor" })).toBe("/vendor");
  });

  it("never grants admin from user-editable metadata", () => {
    expect(resolvePostConfirmPath({ profileRole: "customer", requestedRole: "admin" })).toBe("/");
  });

  it("sends customers back to the page they were on, then next, then home", () => {
    expect(resolvePostConfirmPath({ profileRole: "customer", requestedRole: "customer", returnTo: "/recipes/lentil-soup" })).toBe("/recipes/lentil-soup");
    expect(resolvePostConfirmPath({ returnTo: null, next: "/products" })).toBe("/products");
    expect(resolvePostConfirmPath({})).toBe("/");
  });

  it("ignores unsafe return paths", () => {
    expect(resolvePostConfirmPath({ returnTo: "https://evil.com" })).toBe("/");
    expect(resolvePostConfirmPath({ returnTo: "//evil.com", next: "/products" })).toBe("/products");
    expect(resolvePostConfirmPath({ returnTo: { a: 1 } })).toBe("/");
  });
});

describe("sanitizeReturnPath / isRememberablePath", () => {
  it("rejects auth pages and over-long paths", () => {
    expect(sanitizeReturnPath("/signup")).toBeNull();
    expect(sanitizeReturnPath("/login?redirect=/x")).toBeNull();
    expect(sanitizeReturnPath("/auth/confirm?token_hash=abc")).toBeNull();
    expect(sanitizeReturnPath("/" + "a".repeat(600))).toBeNull();
    expect(sanitizeReturnPath("/articles/sleep?ref=1")).toBe("/articles/sleep?ref=1");
  });

  it("does not treat lookalike paths as auth pages", () => {
    expect(isRememberablePath("/signup-guide")).toBe(true);
    expect(isRememberablePath("/login")).toBe(false);
  });
});
