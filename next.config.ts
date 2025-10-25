import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Webpack configuration to handle Web3 library dependencies
  webpack: (config: any) => {
    // Ignore optional dependencies that cause warnings
    config.resolve = config.resolve || {};
    config.resolve.fallback = {
      ...config.resolve.fallback,
      // MetaMask SDK optional dependencies
      "@react-native-async-storage/async-storage": false,
      // Pino logger optional dependencies
      "pino-pretty": false,
      "lokijs": false,
      "encoding": false,
    };

    // Ignore warnings for these specific modules
    config.ignoreWarnings = [
      ...(config.ignoreWarnings || []),
      { module: /node_modules\/@metamask\/sdk/ },
      { module: /node_modules\/pino/ },
      { module: /node_modules\/@walletconnect/ },
    ];

    return config;
  },

  // Security headers for PWA
  async headers() {
    return [
      {
        // Apply these headers to all routes
        source: "/:path*",
        headers: [
          {
            key: "X-DNS-Prefetch-Control",
            value: "on",
          },
          {
            key: "Strict-Transport-Security",
            // More conservative: 1 year, includeSubDomains, no preload
            // Change to 2 years + preload once you're confident everything works
            value: "max-age=31536000; includeSubDomains",
          },
          {
            key: "X-Frame-Options",
            value: "SAMEORIGIN",
          },
          {
            key: "X-Content-Type-Options",
            value: "nosniff",
          },
          {
            key: "X-XSS-Protection",
            value: "1; mode=block",
          },
          {
            key: "Referrer-Policy",
            value: "strict-origin-when-cross-origin",
          },
          {
            key: "Permissions-Policy",
            value: "camera=(), microphone=(), geolocation=()",
          },
        ],
      },
      {
        // Service Worker specific headers
        source: "/service-worker.js",
        headers: [
          {
            key: "Cache-Control",
            value: "public, max-age=0, must-revalidate",
          },
          {
            key: "Service-Worker-Allowed",
            value: "/",
          },
        ],
      },
      {
        // Manifest specific headers
        source: "/manifest.json",
        headers: [
          {
            key: "Content-Type",
            value: "application/manifest+json",
          },
          {
            key: "Cache-Control",
            value: "public, max-age=3600, must-revalidate",
          },
        ],
      },
    ];
  },

  // Image optimization
  images: {
    formats: ["image/avif", "image/webp"],
    deviceSizes: [640, 750, 828, 1080, 1200, 1920, 2048, 3840],
    imageSizes: [16, 32, 48, 64, 96, 128, 256, 384],
  },

  // Enable React strict mode for better development experience
  reactStrictMode: true,

  // Enable compression
  compress: true,

  // PWA-specific configurations
  poweredByHeader: false, // Remove X-Powered-By header for security
};

export default nextConfig;
