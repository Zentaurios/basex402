import { createConfig, http } from 'wagmi';
import { base, baseSepolia } from 'wagmi/chains';
import { coinbaseWallet } from 'wagmi/connectors';

// Check if mainnet based on environment
const isMainnet = process.env.NEXT_PUBLIC_ENABLE_MAINNET === 'true';

// Get RPC URLs from environment or use defaults
const baseRpcUrl = process.env.NEXT_PUBLIC_BASE_MAINNET_RPC || 'https://mainnet.base.org';
const sepoliaRpcUrl = process.env.NEXT_PUBLIC_BASE_SEPOLIA_RPC || 'https://sepolia.base.org';

// Configure HTTP transport with aggressive timeouts and retries
const httpConfig = {
  // Reduce timeout from default 30s to 8s for faster failures
  timeout: 8_000,
  // Only retry once instead of 3 times
  retryCount: 1,
  // Faster retry delay (default is 150ms exponential backoff)
  retryDelay: 500,
  // Batch multiple RPC calls together to reduce requests
  batch: {
    wait: 50, // Wait 50ms to batch calls together
  },
};

// Create wagmi config with Coinbase Wallet connector
// The connector handles multiple wallet types through OnchainKit UI
export const wagmiConfig = createConfig({
  chains: isMainnet ? [base] : [baseSepolia],
  connectors: [
    coinbaseWallet({
      appName: 'x402 Pioneers',
      preference: 'all', // Supports Smart Wallet and EOA
    }),
  ],
  ssr: true,
  transports: {
    [base.id]: http(baseRpcUrl, httpConfig),
    [baseSepolia.id]: http(sepoliaRpcUrl, httpConfig),
  },
});
