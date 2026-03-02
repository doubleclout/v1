const path = require("path");

/** @type {import('next').NextConfig} */
const nextConfig = {
  transpilePackages: ["@doubleclout/db", "@doubleclout/ai", "@doubleclout/shared"],
  experimental: {
    outputFileTracingRoot: path.join(__dirname, "../.."),
  },
};

module.exports = nextConfig;
