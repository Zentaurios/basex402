import { createConfig, http } from 'wagmi';
import { base, baseSepolia } from 'wagmi/chains';
import { coinbaseWallet, injected } from 'wagmi/connectors';
// TODO: Uncomment after installing @base-org/account
// import { baseAccount } from 'wagmi/connectors';

// Check if mainnet based on environment
const isMainnet = process.env.NEXT_PUBLIC_ENABLE_MAINNET === 'true';

// Get RPC URLs from environment or use fallback
// Note: You MUST set NEXT_PUBLIC_BASE_MAINNET_RPC in .env.local
// Coinbase Cloud: https://api.developer.coinbase.com/rpc/v1/base/YOUR_CDP_API_KEY_NAME
// Alchemy: https://base-mainnet.g.alchemy.com/v2/YOUR_API_KEY
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
