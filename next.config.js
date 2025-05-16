/** @type {import('next').NextConfig} */

const nextConfig = {
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "images.unsplash.com",
      },
      {
        protocol: "https",
        hostname: "api.dicebear.com",
      },
    ],
    dangerouslyAllowSVG: true,
    contentDispositionType: "attachment",
    contentSecurityPolicy: "default-src 'self'; script-src 'none'; sandbox;",
  },
  reactStrictMode: true,
  compiler: {
    removeConsole: process.env.NODE_ENV === "production",
  },
  experimental: {
    optimizePackageImports: ["@/components/ui"],
    swcPlugins: process.env.NEXT_PUBLIC_TEMPO
      ? [[require.resolve("tempo-devtools/swc/0.90"), {}]]
      : undefined,
  },
  typescript: {
    ignoreBuildErrors: false,
  },
  eslint: {
    ignoreDuringBuilds: false,
  },
  swcMinify: true,
  webpack: (config, { isServer }) => {
    config.module.rules.push({
      test: /test\/.*$/,
      loader: "ignore-loader",
    });
    return config;
  },
};

module.exports = nextConfig;
