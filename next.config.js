/** @type {import('next').NextConfig} */

const nextConfig = {
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'images.unsplash.com'
      },
      {
        protocol: 'https',
        hostname: 'api.dicebear.com'
      }
    ],
    dangerouslyAllowSVG: true,
    contentDispositionType: 'attachment',
    contentSecurityPolicy: "default-src 'self'; script-src 'none'; sandbox;",
  },
  reactStrictMode: true,
  compiler: {
    removeConsole: process.env.NODE_ENV === 'production',
  },
  experimental: {
    optimizePackageImports: ['@/components/ui']
  },
  typescript: {
    ignoreBuildErrors: false,
  },
  eslint: {
    ignoreDuringBuilds: false,
  },
  swcMinify: true,
  webpack: (config, { isServer }) => {
    // Exclude test files from the build
    config.module.rules.push({
      test: /test\/.*$/,
      loader: 'ignore-loader'
    });
    return config;
  }
};

if (process.env.NEXT_PUBLIC_TEMPO) {
  if (!nextConfig["experimental"]) {
    nextConfig["experimental"] = {};
  }
  
  // NextJS 14.1.3 to 14.2.11:
  nextConfig.experimental.swcPlugins = [[require.resolve("tempo-devtools/swc/0.90"), {}]];

  // NextJS 15+ (Not yet supported, coming soon)
}

// Bypass Node.js version check
process.env.NODE_OPTIONS = '--no-deprecation';

module.exports = nextConfig;
