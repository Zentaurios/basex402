import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import "@/styles/onchainkit-theme.css";
import "@/styles/onchainkit-overrides.css";
import "@/styles/wallet-modal-fix.css"; // Force WalletModal above GlobalWalletModal
import "@/styles/wallet-dropdown-custom.css"; // Custom WalletDropdown styling
import { Providers } from "./providers";
import { ThemeProvider } from "@/components/providers/ThemeProvider";
import { Header } from "@/components/layout/Header";
// import { PWAInstaller } from "@/components/PWAInstaller";
// import { PWAUpdateNotifier } from "@/components/PWAUpdateNotifier";
import { defaultMetadata, viewport as defaultViewport, organizationStructuredData } from "@/lib/metadata";

const inter = Inter({ subsets: ["latin"] });

// Check if mainnet based on environment
const isMainnet = process.env.NEXT_PUBLIC_ENABLE_MAINNET === 'true';
const networkName = isMainnet ? 'Base' : 'Base Sepolia';

// Export metadata and viewport
export const metadata: Metadata = defaultMetadata;
export const viewport = defaultViewport;

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        {/* Structured Data for SEO */}
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: JSON.stringify(organizationStructuredData),
          }}
        />
      </head>
      <body className={`${inter.className} antialiased flex flex-col min-h-screen`}>
        {/* PWA Components */}
        {/*<PWAInstaller />
        <PWAUpdateNotifier />*/}
        
        <ThemeProvider
          attribute="class"
          defaultTheme="system"
          enableSystem
        >
          <Providers>
            {/* Header Component */}
            <Header isMainnet={isMainnet} networkName={networkName} />

            {/* Main Content */}
            <main id="main-content" className="flex-1 pt-8 lg:pt-16">
              {children}
            </main>
          </Providers>
        </ThemeProvider>
      </body>
    </html>
  );
}
