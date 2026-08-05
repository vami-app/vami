import "./env.mjs";

/** @type {import('next').NextConfig} */
const nextConfig = {
  // turbopack: {
  //   root: process.cwd(),
  // },
  output: 'standalone',

  // ─── Cache Components (Next.js 16) ──────────────────────────────
  // Enables: 'use cache' directive, cacheTag, cacheLife, Partial Prerendering
  cacheComponents: true,

  // ─── Image Optimization ─────────────────────────────────────────
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'res.cloudinary.com',
        pathname: '/**',
      },
      {
        protocol: 'https',
        hostname: 'images.unsplash.com',
        pathname: '/**',
      },
    ],
  },
};

export default nextConfig;
