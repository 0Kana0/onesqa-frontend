import createNextIntlPlugin from 'next-intl/plugin';

/** @type {import('next').NextConfig} */
const nextConfig = {
  async rewrites() {
    return [
      { source: '/api/graphql', destination: process.env.NEXT_PUBLIC_GRAPHQL_ENDPOINT }, // ปรับให้ตรง env
    ];
  },
};

// Use the next-intl plugin with the current nextConfig
const withNextIntl = createNextIntlPlugin();

export default withNextIntl(nextConfig);
