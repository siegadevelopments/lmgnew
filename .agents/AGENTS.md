### Architecture & Tech Stack

#### Foundational Stack
- **Framework**: Next.js (App Router).
- **Styling**: Tailwind CSS v4 + PostCSS, heavily utilizing Radix UI primitives (`@radix-ui/react-*`) for accessible components.
- **State & Forms**: React Hook Form with Zod for robust schema validation. 
- **Data Fetching**: `@tanstack/react-query` for client-side state and caching.

#### Backend & Infrastructure
- **Database & Auth**: Supabase (PostgreSQL, Supabase Auth).
- **File Storage**: Cloudflare R2 is preferred for all media (images, videos) due to capacity limits on Supabase Storage. Avoid `supabase.storage` when generating new upload features.
- **Edge Functions**: Used via Supabase (e.g., Stripe webhooks, R2 upload presigned URLs).
- **Payments**: Stripe integrations (Checkout sessions, webhooks).

### Core Conventions
- **Database Access**: Prefer using the Supabase client via the `@supabase/supabase-js` library. Use `SUPABASE_SERVICE_ROLE_KEY` (where secure/necessary) for backend migrations or bypassing RLS.
- **Storage Strategy**: Fallback to Supabase Storage only if Cloudflare R2 uploads explicitly fail, but R2 should always be the default target.

### Image Generation
- Do not include watermarks when generating images for the content manager.
