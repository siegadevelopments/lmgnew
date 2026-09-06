# Social Media Product Link & Brand Alignment Guidelines

## Core Rule
Whenever generating or publishing social media content (for Facebook, Instagram, Pinterest, Buffer, or email marketing), **all product links MUST be fully qualified, absolute, pointing to valid production routes, and strictly matched to the correct vendor/brand.**

---

## 1. Domain & URL Route Specifications

* **Base Domain**: `https://www.lifestylemedicinegateway.com`
* **Product Route Pattern**: `/products/[slug]`
* **Full Product URL Format**:  
  `https://www.lifestylemedicinegateway.com/products/[product-slug]`

> [!WARNING]
> Do **NOT** use `/shop/[slug]` or relative paths like `/products/[slug]`. Social media platforms (Facebook, Instagram, Pinterest, Buffer) require full `https://` URLs to make links clickable and indexable for previews.

### Other Content Route Formats
* **Articles**: `https://www.lifestylemedicinegateway.com/articles/[slug]`
* **Recipes**: `https://www.lifestylemedicinegateway.com/recipes/[slug]`
* **Guides**: `https://www.lifestylemedicinegateway.com/guides/[slug]`

---

## 2. Vendor & Brand Alignment (Strict Rule)

> [!IMPORTANT]
> **Never Cross-Promote Unrelated Vendor Products**: Every social media post must strictly pair videos, articles, and products belonging to the SAME vendor or brand.

1. **Vendor-Specific Post Scope**:
   * When generating content for a specific vendor (e.g., *Founder's Formula*), **ALL** promoted products, featured links, and captions MUST belong exclusively to that vendor.
   * Example Violation: Combining a *Founder's Formula* video with a product link for *Pure Ceremonial Cacao* from a different vendor.
2. **Single-Brand Integrity**:
   * Each social post must promote products ONLY from the brand featured in that post.
3. **Product Link Verification**:
   * Ensure product URLs use the exact product slug corresponding to that vendor (e.g., `https://www.lifestylemedicinegateway.com/products/[vendor-product-slug]`).

---

## 3. Social Media Caption Formatting Rules

### Facebook Posts
* Include the explicit full product URL (`https://www.lifestylemedicinegateway.com/products/[slug]`) directly within the post caption.
* Ensure open graph metadata tags are intact so link preview cards render cleanly.

### Instagram Posts
* Direct users to the product link or Linktree in bio, OR include the full working URL in the caption (`https://www.lifestylemedicinegateway.com/products/[slug]`).
* Format with clean spacing and 3–5 relevant hashtags.

### Pinterest Pins
* Include the full absolute product URL in the pin description or destination URL field.
* Keep overall text under **450 characters** to ensure it stays strictly under Pinterest's 500-character limit.

---

## 4. Automated Post Generation Rules (Codebase Implementation)

When generating social media posts via AI (`api/generate-posts.ts` or AI prompt tools):
1. **Fetch & Scope by Vendor**: If `selectedVendorId` or `selectedProductIds` are provided, constrain product feeds and prompt AI specifically to ONLY generate posts using that vendor's products.
2. **Pass Full Absolute Product URLs**: Use `https://www.lifestylemedicinegateway.com/products/${p.slug}` in the payload summary.
3. **Auto-correct Relative & Legacy Links**: Any `/products/` or `/shop/` relative paths returned by AI must be automatically transformed into `https://www.lifestylemedicinegateway.com/products/${slug}` before saving to `scheduled_posts` or pushing to Buffer.
4. **No Unreplaced Placeholders**: Strip raw template tags like `{source_url}` or `Link:` prefix strings.
