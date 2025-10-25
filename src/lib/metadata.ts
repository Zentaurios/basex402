import type { Metadata, Viewport } from "next";

/**
 * Base metadata configuration for x402 Pioneers
 * Uses generated logo assets and OpenGraph images
 */

const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || "https://x402.xyz";

/**
 * Viewport configuration for PWA
 */
export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 5,
  userScalable: true,
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "#0000ff" },
    { media: "(prefers-color-scheme: dark)", color: "#0000ff" },
  ],
};

/**
 * Default metadata for all pages
 */
export const defaultMetadata: Metadata = {
  metadataBase: new URL(baseUrl),
  title: {
    default: "x402 Pioneers | x402 Micropayments NFTs on Base",
    template: "%s | x402 Pioneers",
  },
  description: "Mint exclusive x402 NFTs celebrating the revolutionary x402 micropayments protocol. Limited to 402 collectible NFTs at $1 USDC each on Base blockchain.",
  keywords: [
    "x402",
    "NFT",
    "Base",
    "Base blockchain",
    "Coinbase",
    "micropayments",
    "HTTP 402",
    "payment required",
    "Web3",
    "crypto",
    "collectibles",
    "limited edition",
  ],
  authors: [{ name: "x402 Pioneers", url: baseUrl }],
  creator: "x402 Pioneers",
  publisher: "x402 Pioneers",
  applicationName: "x402 Pioneers",
  
  // Apple-specific PWA meta tags
  appleWebApp: {
    capable: true,
    statusBarStyle: "default",
    title: "X402",
  },
  
  // Format detection
  formatDetection: {
    telephone: false,
  },
  
  // Favicon and icons
  icons: {
    icon: [
      { url: "/favicon.ico", sizes: "any" },
      { url: "/icons/favicon-16x16.png", sizes: "16x16", type: "image/png" },
      { url: "/icons/favicon-32x32.png", sizes: "32x32", type: "image/png" },
      { url: "/icons/favicon-48x48.png", sizes: "48x48", type: "image/png" },
    ],
    apple: [
      { url: "/apple-touch-icon.png", sizes: "180x180", type: "image/png" },
    ],
    other: [
      {
        rel: "icon",
        type: "image/png",
        sizes: "192x192",
        url: "/icons/favicon-256x256.png",
      },
    ],
  },
  
  // Manifest for PWA
  manifest: "/manifest.json",
  
  // OpenGraph
  openGraph: {
    type: "website",
    locale: "en_US",
    url: baseUrl,
    siteName: "x402 Pioneers",
    title: "x402 Pioneers | x402 Micropayments NFTs on Base",
    description: "Mint exclusive x402 NFTs celebrating the revolutionary x402 micropayments protocol. Limited to 402 NFTs on Base.",
    images: [
      {
        url: "/images/og-default.png",
        width: 1200,
        height: 630,
        alt: "x402 Pioneers - x402 Micropayments on Base",
      },
    ],
  },
  
  // Twitter
  twitter: {
    card: "summary_large_image",
    site: "@base",
    creator: "@base",
    title: "x402 Pioneers | x402 Protocol NFTs",
    description: "Limited collection of 402 NFTs celebrating x402 micropayments. Mint yours for $1 USDC on Base.",
    images: ["/images/og-default.png"],
  },
  
  // Robots
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      "max-video-preview": -1,
      "max-image-preview": "large",
      "max-snippet": -1,
    },
  },
  
  // Category
  category: "technology",
  
  // Other metadata
  other: {
    // Microsoft specific
    "msapplication-TileColor": "#0000ff",
    "msapplication-config": "/browserconfig.xml",
  },
};

/**
 * Generate page-specific metadata
 */
export function generatePageMetadata(
  title: string,
  description: string,
  ogImage?: string,
  additionalKeywords?: string[]
): Metadata {
  return {
    title,
    description,
    keywords: [...(defaultMetadata.keywords as string[]), ...(additionalKeywords || [])],
    openGraph: {
      ...defaultMetadata.openGraph,
      title,
      description,
      images: ogImage
        ? [
            {
              url: ogImage,
              width: 1200,
              height: 630,
              alt: title,
            },
          ]
        : defaultMetadata.openGraph?.images,
    },
    twitter: {
      ...defaultMetadata.twitter,
      title,
      description,
      images: ogImage ? [ogImage] : (defaultMetadata.twitter?.images as string[]),
    },
  };
}

/**
 * Structured data for Organization
 */
export const organizationStructuredData = {
  "@context": "https://schema.org",
  "@type": "Organization",
  name: "x402 Pioneers",
  url: baseUrl,
  logo: `${baseUrl}/images/logo.png`,
  description: "Mint and trace x402 NFTs with x402 micropayments on Base",
  sameAs: [
    // Add your social media links here when available
  ],
};

/**
 * Structured data for NFT Collection
 */
export const collectionStructuredData = {
  "@context": "https://schema.org",
  "@type": "CreativeWork",
  name: "x402NFT Collection",
  description: "Limited collection of 402 NFTs celebrating the x402 micropayments protocol on Base blockchain",
  creator: {
    "@type": "Organization",
    name: "x402 Pioneers",
  },
  url: baseUrl,
  image: `${baseUrl}/images/collection-banner.png`,
  numberOfItems: 402,
  offers: {
    "@type": "Offer",
    price: "1",
    priceCurrency: "USDC",
    availability: "https://schema.org/InStock",
  },
};
