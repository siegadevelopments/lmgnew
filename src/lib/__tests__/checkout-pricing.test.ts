import { describe, it, expect } from "vitest";
import { calculateShipping, gstIncluded } from "../checkout-pricing";

describe("calculateShipping", () => {
  it("charges flat fee at or under the threshold", () => {
    expect(calculateShipping(20)).toBe(5.99);
    expect(calculateShipping(50)).toBe(5.99);
  });
  it("is free over the threshold", () => {
    expect(calculateShipping(50.01)).toBe(0);
  });
  it("is free for bookings-only carts", () => {
    expect(calculateShipping(20, true)).toBe(0);
  });
});

describe("gstIncluded", () => {
  it("returns one eleventh", () => {
    expect(gstIncluded(110)).toBeCloseTo(10);
  });
});
