/** @type {import('next').NextConfig} */
const nextConfig = {
  transpilePackages: ["@doubleclout/db", "@doubleclout/ai", "@doubleclout/shared"],
};

module.exports = nextConfig;
