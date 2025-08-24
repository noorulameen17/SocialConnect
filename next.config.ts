import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'ygixmbokfdsjdonadccy.supabase.co',
        pathname: '/storage/v1/object/public/**',
      },
    ],
  },
  eslint: { ignoreDuringBuilds: true },
};

export default nextConfig;
