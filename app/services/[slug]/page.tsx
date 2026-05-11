'use client'

// Re-export the product detail page for service URLs
// This allows services to live under /services/[slug] while reusing the same component
export { default } from '../../products/[slug]/page';
