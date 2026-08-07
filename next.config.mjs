import path from 'node:path';
import { fileURLToPath } from 'node:url';
import './env.mjs';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

/** @type {import('next').NextConfig} */
const nextConfig = {
  output: 'standalone',
  outputFileTracingRoot: __dirname,

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

  // ─── PWA Service Worker Headers ─────────────────────────────────
  // /sw.js needs its own Cache-Control (must never be stale) and a scoped
  // CSP so the service worker's own fetch calls can reach Cloudinary/Unsplash.
  // output: 'standalone' honours headers() in both Docker and Vercel.
  async headers() {
    return [
      {
        source: '/sw.js',
        headers: [
          {
            key: 'Content-Type',
            value: 'application/javascript; charset=utf-8',
          },
          {
            // SW script must never be stale — browser must always check for updates
            key: 'Cache-Control',
            value: 'public, max-age=0, must-revalidate',
          },
          {
            // Allow the SW to control the entire origin scope
            key: 'Service-Worker-Allowed',
            value: '/',
          },
          {
            // SW-scoped CSP: connect-src must cover Cloudinary/Unsplash because
            // the SW's own fetch() calls are governed by the CSP of the response
            // that served the worker script — not the page CSP.
            key: 'Content-Security-Policy',
            value: [
              "default-src 'self'",
              "script-src 'self'",
              "connect-src 'self' https://res.cloudinary.com https://images.unsplash.com https://vercel.live wss://ws-us3.pusher.com",
            ].join('; '),
          },
        ],
      },
    ];
  },

  // ─── Rewrites ───────────────────────────────────────────────────
  // Map the static manifest path to our API route to bypass Next.js 16 app/manifest.js hanging bug
  async rewrites() {
    return [
      {
        source: '/manifest.webmanifest',
        destination: '/api/manifest',
      },
    ];
  },
};

export default nextConfig;
