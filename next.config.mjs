/** @type {import('next').NextConfig} */
const nextConfig = {
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: '**.supabase.co',
      },
      {
        protocol: 'https',
        hostname: 'lifestylemedicinegateway.com',
      },
      {
        protocol: 'https',
        hostname: 'www.lifestylemedicinegateway.com',
      },
      {
        protocol: 'https',
        hostname: 'static.wixstatic.com',
      },
      {
        protocol: 'https',
        hostname: 'img.youtube.com',
      },
      {
        protocol: 'https',
        hostname: '**.cloudflarestorage.com',
      },
      {
        protocol: 'https',
        hostname: '**.lifestylemedicinegateway.com',
      },
    ],
    formats: ['image/avif', 'image/webp'],
    deviceSizes: [640, 750, 828, 1080, 1200, 1920],
    imageSizes: [16, 32, 48, 64, 96, 128, 256, 384],
  },
  typescript: {
    ignoreBuildErrors: true,
  },
  poweredByHeader: false,
  compress: true,
  transpilePackages: ['react-quill-new', 'dompurify'],
  headers: async () => [
    {
      source: '/(.*)',
      headers: [
        { key: 'X-Content-Type-Options', value: 'nosniff' },
        { key: 'X-Frame-Options', value: 'DENY' },
        { key: 'X-XSS-Protection', value: '1; mode=block' },
        { key: 'Referrer-Policy', value: 'strict-origin-when-cross-origin' },
        { key: 'Strict-Transport-Security', value: 'max-age=31536000; includeSubDomains; preload' },
        { key: 'Permissions-Policy', value: 'camera=(), microphone=(), geolocation=(), interest-cohort=()' },
        {
          key: 'Content-Security-Policy',
          value: "default-src 'self'; script-src 'self' 'unsafe-inline' 'unsafe-eval' https://*.supabase.co https://*.vercel-scripts.com https://va.vercel-scripts.com https://vercel.live https://*.vercel.live; style-src 'self' 'unsafe-inline' https://fonts.googleapis.com; font-src 'self' https://fonts.gstatic.com data:; img-src 'self' data: blob: https://*.supabase.co https://*.wixstatic.com https://*.lifestylemedicinegateway.com https://img.youtube.com https://www.lifestylemedicinegateway.com https://vercel.live https://*.vercel.live https://*.cloudflarestorage.com https://*.r2.cloudflarestorage.com https://*.r2.dev; connect-src 'self' https://*.supabase.co https://*.mux.com https://vitals.vercel-insights.com https://vercel.live https://*.vercel.live https://*.cloudflarestorage.com https://*.r2.cloudflarestorage.com https://*.r2.dev; frame-src 'self' https://www.youtube.com https://www.youtube-nocookie.com https://*.mux.com https://vercel.live https://*.vercel.live https://player.vimeo.com; media-src 'self' blob: https://*.supabase.co https://stream.mux.com https://*.mux.com https://*.cloudflarestorage.com https://*.r2.cloudflarestorage.com https://*.r2.dev https://lifestylemedicinegateway.com https://*.lifestylemedicinegateway.com; object-src 'none'; base-uri 'self';"
        }
      ],
    },
    {
      source: '/llms.txt',
      headers: [
        { key: 'Content-Type', value: 'text/plain; charset=utf-8' },
        { key: 'Cache-Control', value: 'public, max-age=86400' },
      ],
    },
  ],
};

export default nextConfig;
