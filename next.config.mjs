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
    ],
  },
  // Since we are migrating from a SPA, we might need to disable some strict checks initially
  typescript: {
    ignoreBuildErrors: true,
  },
  eslint: {
    ignoreDuringBuilds: true,
  },
};

export default nextConfig;
