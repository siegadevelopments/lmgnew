### Architecture & Tech Stack

#### Foundational Stack
- **Framework**: Next.js (App Router).
- **Styling**: Tailwind CSS v4 + PostCSS, heavily utilizing Radix UI primitives (`@radix-ui/react-*`) for accessible components.
- **State & Forms**: React Hook Form with Zod for robust schema validation. 
- **Data Fetching**: `@tanstack/react-query` for client-side state and caching.

#### Backend & Infrastructure
- **Database & Auth**: Supabase (PostgreSQL, Supabase Auth).
- **File Storage**: Cloudflare R2 is preferred for all media (images, videos) due to capacity limits on Supabase Storage. Avoid `supabase.storage` when generating new upload features.
- **Edge Functions**: Used via Supabase (e.g., Stripe webhooks, R2 upload presigned URLs, admin-api).
- **Payments**: Stripe integrations (Checkout sessions, webhooks).

### Deployment Strategy
- **Frontend Hosting**: The application is deployed to **Vercel** with environment variables managed through Vercel's dashboard.
- **Backend Deployment**: Do not attempt to deploy Supabase Edge Functions using the local Supabase CLI (Docker is not running locally). Assume Edge Functions are managed and deployed separately via CI/CD or the Supabase Dashboard.

### Core Conventions
- **Database Access**: Prefer using the Supabase client via the `@supabase/supabase-js` library. Use `SUPABASE_SERVICE_ROLE_KEY` (where secure/necessary) for backend migrations or bypassing RLS.
- **Storage Strategy**: Fallback to Supabase Storage only if Cloudflare R2 uploads explicitly fail, but R2 should always be the default target.

### Social Media & Product Links
- All product links in generated social media content MUST be absolute URLs formatted as `https://www.lifestylemedicinegateway.com/products/[slug]`.
- Do NOT use relative routes like `/products/...` or incorrect `/shop/...` routes in captions or scheduled post data.
- Refer to [.agents/rules/social_media_product_links.md](file:///Users/ernestsiega/Documents/projects/lmgnew/.agents/rules/social_media_product_links.md) for full specifications.

### Image Generation
- Do not include watermarks when generating images for the content manager.
