import type { NextConfig } from "next";

const destinationApiUrl =
  process.env.DESTINATION_API_URL ||
  process.env.INTERNAL_API_URL ||
  process.env.NEXT_PUBLIC_INTERNAL_API_URL ||
  process.env.NEXT_PUBLIC_API_URL ||
  "http://localhost:4000";

const nextConfig: NextConfig = {
  async rewrites() {
    return [
      {
        source: '/api/:path*',
        destination: `${destinationApiUrl.replace(/\/api\/?$/, "").replace(/\/$/, "")}/api/:path*`,
      },
    ];
  },
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: '**.susercontent.com',
      },
      {
        protocol: 'https',
        hostname: 'cf.shopee.vn',
      },
      {
        protocol: 'https',
        hostname: '**.slatic.net',
      },
      {
        protocol: 'https',
        hostname: '**.alicdn.com',
      },
    ],
  },
};

export default nextConfig;
