const path = require("path");

/** @type {import('next').NextConfig} */
const nextConfig = {
  distDir: process.env.NODE_ENV === "development" ? ".next-dev" : ".next",
  transpilePackages: ["@doubleclout/db", "@doubleclout/ai", "@doubleclout/shared"],
  images: {
    remotePatterns: [
      { protocol: "https", hostname: "lh3.googleusercontent.com", pathname: "/**" },
      { protocol: "https", hostname: "avatars.githubusercontent.com", pathname: "/**" },
      { protocol: "https", hostname: "bafowilqrykdwycgpnbd.supabase.co", pathname: "/storage/v1/object/public/**" },
      { protocol: "https", hostname: "cdn.simpleicons.org", pathname: "/**" },
    ],
  },
  experimental: {
    outputFileTracingRoot: path.join(__dirname, "../.."),
  },
  webpack: (config, { dev }) => {
    if (dev) {
      // Avoid flaky module/chunk mismatches in local dev during frequent HMR updates.
      config.cache = false;
    }
    return config;
  },
};

module.exports = nextConfig;
