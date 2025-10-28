/**
 * Centralized RPC Configuration
 * Single source of truth for all blockchain RPC connections
 */

import { createPublicClient, http, type Chain } from 'viem';

const isMainnet = process.env.NEXT_PUBLIC_ENABLE_MAINNET === 'true';

/**
 * Custom chain definitions with multiple fallback RPCs
 * Uses Base's official public RPC as primary, with fallbacks
 */
export const baseMainnetChain: Chain = {
  id: 8453,
  name: 'Base',
  nativeCurrency: { name: 'Ether', symbol: 'ETH', decimals: 18 },
  rpcUrls: {
    default: { http: ['https://mainnet.base.org'] },
    public: { http: ['https://mainnet.base.org'] },
  },
  blockExplorers: {
    default: { name: 'BaseScan', url: 'https://basescan.org' },
  },
};

export const baseSepoliaChain: Chain = {
  id: 84532,
  name: 'Base Sepolia',
  nativeCurrency: { name: 'Ether', symbol: 'ETH', decimals: 18 },
  rpcUrls: {
    default: { http: ['https://sepolia.base.org'] },
    public: { http: ['https://sepolia.base.org'] },
  },
  blockExplorers: {
    default: { name: 'BaseScan', url: 'https://sepolia.basescan.org' },
  },
  testnet: true,
};

/**
 * Get the current chain based on environment
 */
export function getCurrentChain(): Chain {
  return isMainnet ? baseMainnetChain : baseSepoliaChain;
}

/**
 * Get the public RPC URL (no authentication needed)
 */
export function getPublicRpcUrl(): string {
  const chain = getCurrentChain();
  return chain.rpcUrls.public.http[0];
}

/**
 * Create a public client for reading blockchain data
 * Uses public RPC endpoints - no authentication required
 * 
 * NOTE: Public RPCs have rate limits. Consider:
 * - Caching results where possible
 * - Implementing retry logic
 * - Using rate-limited services for production (Alchemy, Infura)
 */
export function createPublicRpcClient() {
  const chain = getCurrentChain();
  
  return createPublicClient({
    chain,
    transport: http(getPublicRpcUrl(), {
      // Add retry logic for rate limits
      retryCount: 3,
      retryDelay: 1000,
    })
  });
}

/**
 * Export chain info
 */
export const RPC_CONFIG = {
  isMainnet,
  chain: getCurrentChain(),
  rpcUrl: getPublicRpcUrl(),
  chainId: isMainnet ? 8453 : 84532,
  explorerUrl: isMainnet ? 'https://basescan.org' : 'https://sepolia.basescan.org',
} as const;
