const path = require("path");

/** @type {import('next').NextConfig} */
const nextConfig = {
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
};

module.exports = nextConfig;
