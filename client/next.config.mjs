/** @type {import('next').NextConfig} */
const apiUrl = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000";
const { hostname, port, protocol } = new URL(apiUrl);

const nextConfig = {
  images: {
    remotePatterns: [
      {
        protocol: protocol.replace(":", ""),
        hostname,
        port: port || "",
        pathname: "/uploads/**",
      },
      // Allow common demo image hosts used by the seed script
      { protocol: "https", hostname: "picsum.photos" },
      { protocol: "https", hostname: "images.unsplash.com" },
      { protocol: "https", hostname: "i.pravatar.cc" },
    ],
  },
};

export default nextConfig;
