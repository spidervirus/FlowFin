/** @type {import('next').NextConfig} */

const nextConfig = {
  images: {
    domains: ["images.unsplash.com", "api.dicebear.com"],
  },
  skipTrailingSlashRedirect: true,
  skipMiddlewareUrlNormalize: true,
};

if (process.env.NEXT_PUBLIC_TEMPO) {
  if (!nextConfig["experimental"]) {
    nextConfig["experimental"] = {};
  }
  
  // NextJS 13.4.8 up to 14.1.3:
  // nextConfig.experimental.swcPlugins = [[require.resolve("tempo-devtools/swc/0.86"), {}]];
  // NextJS 14.1.3 to 14.2.11:
  nextConfig.experimental.swcPlugins = [[require.resolve("tempo-devtools/swc/0.90"), {}]];

  // NextJS 15+ (Not yet supported, coming soon)
}

// Bypass Node.js version check
process.env.NODE_OPTIONS = '--no-deprecation';

module.exports = nextConfig;
