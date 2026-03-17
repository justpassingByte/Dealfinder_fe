import type { NextConfig } from "next";

const nextConfig: NextConfig = {
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
