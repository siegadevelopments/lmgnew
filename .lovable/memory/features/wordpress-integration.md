---
name: WordPress content integration
description: Live content from lifestylemedicinegateway.com WP REST API — articles, recipes, products, vendors
type: feature
---
- WordPress site: lifestylemedicinegateway.com (self-hosted)
- Public REST API, no auth needed
- Content types: posts (articles), wprm_recipe (recipes), product (products), product_brand (vendors), categories, media
- API client: src/lib/wordpress.ts with typed fetchers
- Query options: src/lib/wp-queries.ts (5min stale time)
- Routes: /articles, /articles/$slug, /recipes, /recipes/$slug, /products, /products/$slug, /vendors, /vendors/$slug
- Homepage sections: LatestArticlesSection, FeaturedRecipesSection, FeaturedVendorsSection (live data)
- Vendors = product_brand taxonomy (e.g. Seeds & Such, One Planet, Mandala Earth)
- Product categories: Health Products, Lifestyle products, Affiliate, Herbal
- 298 total products, 10 brands
