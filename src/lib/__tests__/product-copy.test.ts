import { describe, expect, it } from "vitest";
import {
  buildProductPrompt,
  mentionsProduct,
  parseFramework,
  sanitizeProducts,
  toPlainText,
} from "../../../api/_product-copy";

const cloths = {
  title: "Microfibre Cloths (Yellow & White - 2 Pack)",
  url: "https://www.lifestylemedicinegateway.com/products/microfibre-cloths",
  description: "Reusable <b>chemical-free</b> cleaning cloths.",
};

describe("product copy prompts", () => {
  it("sanitises products and drops non-LMG links", () => {
    const [p] = sanitizeProducts([{ ...cloths, url: "https://evil.example/x" }]);
    expect(p.url).toBe("");
    expect(p.description).toBe("Reusable chemical-free cleaning cloths.");
    expect(sanitizeProducts("nope")).toEqual([]);
    expect(sanitizeProducts([{ title: "" }])).toEqual([]);
  });

  it("only accepts known frameworks", () => {
    expect(parseFramework("PAS")).toBe("PAS");
    expect(parseFramework("other")).toBeNull();
  });

  it("detects off-topic copy using distinctive product words only", () => {
    const products = sanitizeProducts([cloths]);
    expect(mentionsProduct("Small habits build lasting wellness. Pack your lunch!", products)).toBe(false);
    expect(mentionsProduct("These microfibre cloths make cleaning easy", products)).toBe(true);
  });

  it("makes the product the task, with framework and link", () => {
    const prompt = buildProductPrompt({
      brandContext: "BRAND",
      field: "caption",
      products: sanitizeProducts([cloths]),
      framework: "PAS",
    });
    expect(prompt).toContain("PRODUCT post");
    expect(prompt).toContain("Microfibre Cloths");
    expect(prompt).toContain(cloths.url);
    expect(prompt).toContain("PAS");
    expect(prompt).not.toContain("Current draft");
  });

  it("strips Markdown but keeps hashtags and plain asterisk-free text", () => {
    expect(toPlainText("Meet our **Microfibre Cloths (Yellow & White - 2 Pack)**!")).toBe(
      "Meet our Microfibre Cloths (Yellow & White - 2 Pack)!",
    );
    expect(toPlainText("So *easy* to use")).toBe("So easy to use");
    expect(toPlainText("## Why it works\n* Reusable\n#CleanHome #Australia")).toBe(
      "Why it works\n• Reusable\n#CleanHome #Australia",
    );
    expect(toPlainText("5 * 3 = 15")).toBe("5 * 3 = 15");
  });
});
