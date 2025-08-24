import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'ygixmbokfdsjdonadccy.supabase.co', // Supabase project domain
        pathname: '/storage/v1/object/public/**',
      },
    ],
  },
};

export default nextConfig;
