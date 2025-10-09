/** @type {import('next').NextConfig} */
const nextConfig = {
  async rewrites() {
    return [
      { source: '/api/graphql', destination: process.env.NEXT_PUBLIC_GRAPHQL_ENDPOINT }, // ปรับให้ตรง env
    ];
  },
};
export default nextConfig;
