/** @type {import('next').NextConfig} */
const nextConfig = {
  // ❌ отключаем turbopack
  turbo: false,

  // ❗ ВАЖНО — возвращаем классический Webpack
  experimental: {
    turbo: {
      rules: {}, // полностью отключаем
    },
  },

  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "**.supabase.co",
      },
    ],
  },
};

export default nextConfig;