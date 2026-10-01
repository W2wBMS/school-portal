import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  turbopack: {
    root: __dirname,
  },
  async rewrites() {
    const backendHost = process.env.BACKEND_HOSTPORT;
    if (process.env.NODE_ENV === 'production' && !backendHost) {
      throw new Error('BACKEND_HOSTPORT must be set for production');
    }

    const destinationHost = backendHost || 'localhost:5000';
    return [
      {
        source: '/api/:path*',
        destination: `http://${destinationHost}/api/:path*`,
      },
    ];
  },
};

export default nextConfig;
