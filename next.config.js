/** @type {import('next').NextConfig} */
const nextConfig = {
  webpack: (config, { isServer }) => {
    if (!isServer) {
      // Don't bundle Prisma browser client - it doesn't exist on Vercel
      config.resolve.fallback = {
        ...config.resolve.fallback,
        fs: false,
        net: false,
        tls: false,
      };
      config.resolve.alias = {
        ...config.resolve.alias,
        '@prisma/client/index-browser': false,
      };
    }
    return config;
  },
};

module.exports = nextConfig;
