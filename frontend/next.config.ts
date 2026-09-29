import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  turbopack: {
    root: __dirname,
  },
  async rewrites() {
    const backendHost = process.env.BACKEND_HOSTPORT || 'localhost:5000';
    return [
      {
        source: '/api/:path*',
        destination: `http://${backendHost}/api/:path*`,
      },
    ];
  },
};

export default nextConfig;
