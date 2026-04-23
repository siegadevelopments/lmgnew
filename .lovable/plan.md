

## WordPress Content Integration Plan

### Summary
Connect the Lifestyle Medicine Gateway WordPress site as a live content source, fetching articles, recipes, and media directly from the public WP REST API. Content will be displayed on new route pages with SSR for SEO.

### Architecture

The WordPress site at `lifestylemedicinegateway.com` exposes a public REST API. No API key or authentication is required for reading published content. We will fetch data server-side (in route loaders) for SEO, and cache responses with TanStack Query.

```text
Browser  -->  TanStack Route (SSR)  -->  WP REST API
                loader fetches            lifestylemedicinegateway.com/wp-json/wp/v2/...
                from WordPress
```

### What will be built

**1. WordPress API client library** (`src/lib/wordpress.ts`)
- Typed fetch functions for posts, recipes, media, categories, and tags
- Pagination support (`per_page`, `page`, `offset`)
- Embedded media fetching (`_embed` parameter for featured images)
- Types for WP post, recipe, category, media objects

**2. Articles listing page** (`src/routes/articles.tsx`)
- SSR route fetching posts from `/wp/v2/posts?_embed&per_page=12`
- Card grid with featured image, title, excerpt, date, category badges
- Pagination (load more or numbered pages)
- Category filtering via query params
- SEO meta tags per page

**3. Single article page** (`src/routes/articles.$slug.tsx`)
- SSR route fetching single post by slug (`/wp/v2/posts?slug={slug}&_embed`)
- Full rendered HTML content (WordPress returns rendered HTML)
- Featured image, author, date, categories
- SEO meta with og:image from featured image

**4. Recipes listing page** (`src/routes/recipes.tsx`)
- SSR route fetching from `/wp/v2/wprm_recipe?per_page=12`
- Card grid showing recipe name, image, summary
- Filtering by course/cuisine taxonomy if available

**5. Single recipe page** (`src/routes/recipes.$slug.tsx`)
- Full recipe display: ingredients, instructions, nutrition, prep/cook time
- Structured data (JSON-LD Recipe schema) for SEO

**6. Updated homepage sections**
- Replace static placeholder data in `FeaturedVendorsSection` and `CategoriesSection` with live WordPress content
- "Latest Articles" section on homepage pulling 3-4 recent posts
- "Featured Recipes" section pulling recent recipes

**7. Header navigation update**
- Add "Articles" and "Recipes" links to the header nav

### Content types from WP API

| Content | WP Endpoint | Key Fields |
|---------|------------|------------|
| Articles | `/wp/v2/posts?_embed` | title, excerpt, content, date, featured_media, categories |
| Recipes | `/wp/v2/wprm_recipe` | name, summary, ingredients, instructions, nutrition |
| Categories | `/wp/v2/categories` | name, slug, count |
| Media | `/wp/v2/media/{id}` | source_url, alt_text, media_details |

### Technical details

- All WordPress API calls happen server-side in route `loader` functions for SSR/SEO
- TanStack Query (`QueryClient.ensureQueryData`) caches responses with a 5-minute stale time
- WordPress content HTML is sanitized before rendering (using DOMPurify or equivalent)
- Images served directly from the WordPress CDN (no proxying needed)
- The WordPress base URL will be stored as a constant in the API client (not a secret -- it is a public API)
- Error and not-found components on every route with a loader

### No database changes needed
All content is read live from WordPress. No new tables or migrations required at this stage.

### Files to create/modify
- **Create**: `src/lib/wordpress.ts` -- API client with types
- **Create**: `src/routes/articles.tsx` -- articles listing
- **Create**: `src/routes/articles.$slug.tsx` -- single article
- **Create**: `src/routes/recipes.tsx` -- recipes listing
- **Create**: `src/routes/recipes.$slug.tsx` -- single recipe
- **Modify**: `src/routes/index.tsx` -- add latest articles/recipes sections
- **Modify**: `src/components/Header.tsx` -- add Articles, Recipes nav links

