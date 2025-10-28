'use client';

import { ReactNode, useState, useEffect } from 'react';
import { useTheme } from 'next-themes';
import { Toaster } from 'react-hot-toast';
import { CDPReactProvider } from "@coinbase/cdp-react";
import { type Config } from "@coinbase/cdp-react";
import { OnchainKitProvider } from '@coinbase/onchainkit';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { WagmiProvider } from 'wagmi';
import { ThemeTransition } from '@/components/theme/ThemeTransition';
import { WalletProvider } from '@/components/wallet/WalletProvider';
import { ExportModalProvider } from '@/components/wallet/ExportModalContext';
import { GlobalWalletModal } from '@/components/wallet/GlobalWalletModal';
import { InitializedWrapper } from '@/components/wallet/InitializedWrapper';
import { OnchainKitWalletBridge } from '@/components/wallet/OnchainKitWalletBridge';
import { LoadingBoundary } from '@/components/LoadingBoundary';
import { getBaseOrgTheme } from '@/lib/cdp-theme';
import { wagmiConfig } from '@/lib/wagmi-config';
import { base, baseSepolia } from 'viem/chains';

// Check if mainnet based on environment
const isMainnet = process.env.NEXT_PUBLIC_ENABLE_MAINNET === 'true';
const chain = isMainnet ? base : baseSepolia;
const networkId = isMainnet ? 'base' : 'base-sepolia';

// CDP Configuration with BOTH EVM and Solana support
// Config includes both AppConfig and CDPHooksConfig merged together
const cdpConfig: Config = {
  // CDPHooksConfig properties
  projectId: process.env.NEXT_PUBLIC_CDP_PROJECT_ID ?? "",
  // Enable EVM account creation on login with network specification
  ethereum: {
    createOnLogin: "smart", // ✅ Create smart account (EOA owner used for x402 signing)
  },
  // Enable Solana account creation on login
  solana: {
    createOnLogin: true
  },
  // AppConfig properties (merged into Config)
  appName: "BaseX402",
  appLogoUrl: "/favicon.ico",
  authMethods: ["email"], // Only email authentication
};

// Create QueryClient with optimized settings
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      // Reduce network requests on mount
      staleTime: 60 * 1000, // Consider data fresh for 1 minute
      // Don't refetch on window focus by default
      refetchOnWindowFocus: false,
      // Retry failed requests only once
      retry: 1,
    },
  },
});

interface ProvidersProps {
  children: ReactNode;
}

export function Providers({ children }: ProvidersProps) {
  const { resolvedTheme } = useTheme();
  const [mounted, setMounted] = useState(false);
  const [showDebugTools, setShowDebugTools] = useState(false);
  
  // Validation check for required environment variables (non-blocking)
  useEffect(() => {
    if (!process.env.NEXT_PUBLIC_CDP_PROJECT_ID) {
      console.warn(
        `⚠️ CDP Project ID not found. Please add NEXT_PUBLIC_CDP_PROJECT_ID to your .env.local file.`
      );
    }

    if (!process.env.NEXT_PUBLIC_CDP_API_KEY) {
      console.warn(
        `⚠️ OnchainKit API Key not found. Please add NEXT_PUBLIC_CDP_API_KEY to your .env.local file.`
      );
    }
  }, []);

  // Wait for component to mount to avoid hydration mismatch
  useEffect(() => {
    setMounted(true);
    
    // Defer loading debug tools to avoid blocking initial render
    const timer = setTimeout(() => {
      setShowDebugTools(process.env.NODE_ENV === 'development');
    }, 2000);
    
    return () => clearTimeout(timer);
  }, []);

  // Use light theme during SSR, then switch to dynamic theme after mount
  const cdpTheme = mounted && resolvedTheme === 'dark' 
    ? getBaseOrgTheme(true) 
    : getBaseOrgTheme(false);

  return (
    <WagmiProvider config={wagmiConfig}>
      <QueryClientProvider client={queryClient}>
        <OnchainKitProvider
          apiKey={process.env.NEXT_PUBLIC_CDP_API_KEY}
          chain={chain}
          config={{
            appearance: {
              name: 'BaseX402',
              logo: '/favicon.ico',
              mode: 'auto', // Auto-switch between light and dark
              theme: 'base-custom', // Custom theme with both light and dark
            },
            wallet: {
              display: 'modal',
              termsUrl: 'https://basex402.com/terms',
              privacyUrl: 'https://basex402.com/privacy',
            },
          }}
        >
          <CDPReactProvider config={cdpConfig} theme={cdpTheme}>
            {/* InitializedWrapper ensures CDP checks for existing sessions before rendering */}
            <InitializedWrapper>
              <ExportModalProvider>
                <WalletProvider>
                  <OnchainKitWalletBridge />
                  <ThemeTransition />
                  
                  {/* Defer non-critical components to improve initial load */}
                  <LoadingBoundary delay={500}>
                    <GlobalWalletModal />
                  </LoadingBoundary>
                  
                  <Toaster
                    position="top-right"
                    toastOptions={{
                      // Default options
                      duration: 4000,
                      style: {
                        background: resolvedTheme === 'dark' ? 'var(--base-gray-80)' : 'var(--base-white)',
                        color: resolvedTheme === 'dark' ? 'var(--base-white)' : 'var(--base-black)',
                        border: `1px solid ${resolvedTheme === 'dark' ? 'var(--base-gray-60)' : 'var(--base-gray-15)'}`,
                        borderRadius: '0.5rem',
                        fontSize: '0.875rem',
                        fontWeight: '500',
                        boxShadow: resolvedTheme === 'dark' 
                          ? '0 10px 15px -3px rgba(0, 0, 0, 0.3), 0 4px 6px -2px rgba(0, 0, 0, 0.2)'
                          : '0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05)',
                      },
                      // Success toast
                      success: {
                        iconTheme: {
                          primary: 'var(--base-green)',
                          secondary: resolvedTheme === 'dark' ? 'var(--base-gray-80)' : 'var(--base-white)',
                        },
                      },
                      // Error toast
                      error: {
                        iconTheme: {
                          primary: 'var(--base-red)',
                          secondary: resolvedTheme === 'dark' ? 'var(--base-gray-80)' : 'var(--base-white)',
                        },
                      },
                      // Loading toast
                      loading: {
                        iconTheme: {
                          primary: resolvedTheme === 'dark' ? 'var(--base-cerulean)' : 'var(--base-blue)',
                          secondary: resolvedTheme === 'dark' ? 'var(--base-gray-80)' : 'var(--base-white)',
                        },
                      },
                    }}
                  />
                  
                  <div className="min-h-screen font-sans transition-colors duration-300">
                    {children}
                  </div>
                </WalletProvider>
              </ExportModalProvider>
            </InitializedWrapper>
          </CDPReactProvider>
        </OnchainKitProvider>
      </QueryClientProvider>
    </WagmiProvider>
  );
}
