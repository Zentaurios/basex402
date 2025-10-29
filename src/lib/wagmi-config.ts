import { createConfig, http } from 'wagmi';
import { base, baseSepolia } from 'wagmi/chains';
import { coinbaseWallet, injected } from 'wagmi/connectors';
// TODO: Uncomment after installing @base-org/account
// import { baseAccount } from 'wagmi/connectors';

// Check if mainnet based on environment
const isMainnet = process.env.NEXT_PUBLIC_ENABLE_MAINNET === 'true';

// Get RPC URLs from environment or use fallback
// IMPORTANT: NEXT_PUBLIC_* vars are exposed to browser and can't use auth
// Use public RPC endpoints for all client-side operations
const baseRpcUrl = 'https://mainnet.base.org';
const sepoliaRpcUrl = 'https://sepolia.base.org';

// Note: For server-side operations that need authenticated RPC,
// use the CDP_API_KEY_ID directly in your server actions/API routes

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

// Create wagmi config with multiple connectors
export const wagmiConfig = createConfig({
  chains: isMainnet ? [base] : [baseSepolia],
  connectors: [
    // TODO: Uncomment after installing @base-org/account
    // baseAccount({
    //   appName: 'x402 Pioneers',
    // }),
    // Coinbase Wallet connector (for Smart Wallets and Coinbase Wallet)
    coinbaseWallet({
      appName: 'x402 Pioneers',
      preference: 'all', // Supports Smart Wallet and EOA
    }),
    // MetaMask-specific injected connector
    injected({
      target: 'metaMask',
      shimDisconnect: true,
    }),
    // Phantom-specific injected connector
    injected({
      target: 'phantom',
      shimDisconnect: true,
    }),
  ],
  ssr: true,
  // Enable multiInjectedProviderDiscovery for EIP-6963 support
  multiInjectedProviderDiscovery: true,
  transports: {
    [base.id]: http(baseRpcUrl, httpConfig),
    [baseSepolia.id]: http(sepoliaRpcUrl, httpConfig),
  },
});
