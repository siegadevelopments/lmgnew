import { describe, it, expect } from "vitest";
import { normalisePhone } from "../phone";

describe("normalisePhone", () => {
  it.each([
    ["0421 082 860", "0421 082 860"],
    ["+61 407 715 486", "+61 407 715 486"],
    ["  1300   687 326 ", "1300 687 326"],
    ["(07) 5555-1234", "(07) 5555-1234"],
    ["+976 7712 0256", "+976 7712 0256"],
  ])("accepts %s", (input, expected) => {
    expect(normalisePhone(input)).toBe(expected);
  });

  it.each(["", "   ", "1234567", "0412 345 678 ext 2", "call me", "+61+412345678", "0".repeat(16), null, undefined])(
    "rejects %s",
    (input) => {
      expect(normalisePhone(input)).toBeNull();
    },
  );
});
