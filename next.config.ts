import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'i.ytimg.com',
        port: '',
        pathname: '/**',
      },
    ],
  },
  experimental: {
    // Disable automatic instrumentation to prevent OpenTelemetry conflicts
    instrumentationHook: false,
  },
};

export default nextConfig;
