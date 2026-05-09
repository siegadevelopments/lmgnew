# Next.js Migration Plan

This plan outlines the steps required to migrate the Lifestyle Medicine Gateway application from its current architecture (Vite + TanStack Router SPA) to a Next.js App Router architecture.

The primary goals of this migration are to leverage Next.js features such as:
- **Built-in Image Optimization** (`next/image`)
- **Enhanced SEO** (Server-Side Rendering and metadata API)
- **AI and GEO Edge Capabilities** (Vercel edge functions, standard Next.js deployments)
- **Mobile Friendliness & Performance** (Automatic code splitting, font optimization)

## User Review Required

> [!WARNING]
> This is a massive architectural change. During this migration, the application might be temporarily unstable as routing and build systems are completely replaced. 
> 
> Because this is a large SPA, the fastest and most stable path forward is to initially mark most interactive UI components and pages with `"use client"`. This preserves your existing React state, hooks, and Framer Motion animations while immediately granting you the routing, image optimization, and initial SEO benefits of Next.js. We can progressively transition suitable components to Server Components later.
>
> Please confirm if you are comfortable with this approach and the associated downtime during the rewrite.

## Open Questions

1. **Deployment Target**: Next.js works best on Vercel. Are you currently deploying to Vercel, or do you plan to use a different provider (e.g., AWS, Netlify, Cloudflare Pages)? This affects how we configure edge features and image optimization.
2. **External Image Domains**: To use Next.js built-in Image optimization, we must allowlist external domains (like your Supabase Storage or Cloudflare R2 bucket domains) in the `next.config.mjs`. Could you confirm the primary domains used for your stored media?

## Proposed Changes

---

### Build System & Configuration

We will replace Vite with Next.js.

#### [NEW] `next.config.mjs`
Initialize Next.js configuration, configuring `remotePatterns` for image optimization (Supabase, R2).

#### [MODIFY] `package.json`
- **Add**: `next`, `next-pwa` (or equivalent), `eslint-config-next`.
- **Remove**: `vite`, `@vitejs/plugin-react`, `@tanstack/react-router`, `@tanstack/router-plugin`, `@tanstack/start`, `vite-plugin-pwa`.
- Update scripts (`dev`, `build`, `start`).

#### [DELETE] `vite.config.ts`, `tsr.config.json`
Remove Vite-specific tooling.

---

### Routing Migration (App Router)

We will migrate all 32 files from `src/routes/` to the Next.js `app/` directory structure.

#### [NEW] `app/layout.tsx`
Will replace the root configuration in `src/routes/__root.tsx` and `src/main.tsx`. Will handle global providers (Auth, QueryClient) and global CSS.

#### [NEW] `app/page.tsx`
Will replace `src/routes/index.tsx`.

#### [NEW] `app/(routes)/[route]/page.tsx`
For every route (e.g., `about.tsx`, `checkout.tsx`, `products.$slug.tsx`), we will create the corresponding Next.js route (e.g., `app/about/page.tsx`, `app/checkout/page.tsx`, `app/products/[slug]/page.tsx`).
- We will translate TanStack's `head` meta tags to Next.js `export const metadata`.

#### [DELETE] `src/routes/`
The entire TanStack router directory will be removed once the `app/` directory is fully populated.

---

### Component Adaptation & Optimization

#### [MODIFY] All files in `src/components/`, `src/hooks/`, `src/lib/`
- Add `"use client"` directive at the top of components utilizing `useState`, `useEffect`, `useContext`, or browser APIs.
- Update internal navigation: Replace `@tanstack/react-router` (`Link`, `useNavigate`, `useParams`) with `next/navigation` and `next/link`.

#### [MODIFY] Image Components
- Systematically replace standard `<img src="..." />` tags with Next.js `<Image src="..." width={...} height={...} alt="..." />` to leverage automatic WebP conversion, resizing, and lazy loading.
- Adapt Framer Motion `<motion.img>` to wrap `next/image` correctly.

## Verification Plan

### Automated/Build Verification
- Run `npm run build` using Next.js to ensure all TypeScript errors, routing mismatches, and `"use client"` boundaries are resolved.
- Verify `next/image` is successfully processing external URLs without throwing unconfigured domain errors.

### Manual Verification
- Test critical user journeys (Login, Browse Products, Checkout, Vendor Dashboard) to ensure state and context providers migrated correctly.
- Run Lighthouse/PageSpeed Insights on the Next.js local build to verify LCP improvements due to `next/image`.
