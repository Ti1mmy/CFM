import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  async rewrites() {
    return [
      { source: '/about', destination: '/' },
      { source: '/class', destination: '/' },
      { source: '/webring', destination: '/' },
    ];
  },
};

export default nextConfig;
