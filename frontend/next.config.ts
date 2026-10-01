import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  turbopack: {
    root: __dirname,
  },
  async rewrites() {
    const backendUrl = process.env.BACKEND_URL;
    if (process.env.NODE_ENV === 'production' && !backendUrl) {
      throw new Error('BACKEND_URL must be set for production');
    }

    const destinationUrl = (backendUrl || 'http://localhost:5000').replace(/\/+$/, '');
    return [
      {
        source: '/api/:path*',
        destination: `${destinationUrl}/api/:path*`,
      },
    ];
  },
};

export default nextConfig;
