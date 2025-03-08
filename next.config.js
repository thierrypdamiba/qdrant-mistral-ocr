/** @type {import('next').NextConfig} */
const nextConfig = {
  env: {
    API_BASE_URL: process.env.API_BASE_URL || 'https://danek-api.fly.dev',
  },
  async rewrites() {
    return [
      {
        source: '/api/py/:path*',
        destination: `${process.env.API_BASE_URL || 'https://danek-api.fly.dev'}/:path*`,
      },
    ];
  },
  // Add performance optimizations
  poweredByHeader: false,
  reactStrictMode: true,
  swcMinify: true,
  images: {
    formats: ['image/avif', 'image/webp'],
  },
  // Cache API responses
  httpAgentOptions: {
    keepAlive: true,
  },
  experimental: {
    optimizeCss: true,
    scrollRestoration: true,
  },
  compiler: {
    removeConsole: process.env.NODE_ENV === 'production' ? {
      exclude: ['error', 'warn'],
    } : false,
  },
};

module.exports = nextConfig;
