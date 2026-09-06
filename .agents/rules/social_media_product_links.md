# Social Media Product Link Guidelines

## Core Rule
Whenever generating or publishing social media content (for Facebook, Instagram, Pinterest, Buffer, or email marketing), **all product links MUST be fully qualified, absolute, and pointing to valid production routes.**

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

## 2. Social Media Caption Formatting Rules

### Facebook Posts
* Include the explicit full product URL (`https://www.lifestylemedicinegateway.com/products/[slug]`) directly within the post caption or at the end before hashtags.
* Ensure open graph metadata tags are intact so link preview cards render cleanly.

### Instagram Posts
* Direct users to the product link or Linktree in bio, OR include the full working URL in the caption (`https://www.lifestylemedicinegateway.com/products/[slug]`).
* Format with clean spacing and 3–5 relevant hashtags.

### Pinterest Pins
* Include the full absolute product URL in the pin description or destination URL field.
* Keep overall text under **450 characters** to ensure it stays strictly under Pinterest's 500-character limit.

---

## 3. Automated Post Generation Rules (Codebase Implementation)

When generating social media posts via AI (`api/generate-posts.ts` or AI prompt tools):
1. **Always pass full absolute product URLs** in the payload summary (`https://www.lifestylemedicinegateway.com/products/${p.slug}`).
2. **Auto-correct Relative Links**: Any `/products/` or `/shop/` relative paths returned by AI must be automatically transformed into `https://www.lifestylemedicinegateway.com/products/${slug}` before saving to `scheduled_posts` or pushing to Buffer.
3. **No Unreplaced Placeholders**: Strip raw template tags like `{source_url}` or `Link:` prefix strings.
