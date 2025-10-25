/**
 * Network configuration using environment variables
 * Supports both mainnet and testnet based on env vars
 */

// Get network configuration from environment variables
const getEnvConfig = () => {
  const isMainnet = process.env.NEXT_PUBLIC_ENABLE_MAINNET === 'true';
  
  if (isMainnet) {
    return {
      chainId: parseInt(process.env.NEXT_PUBLIC_BASE_CHAIN_ID || '8453'),
      name: 'Base',
      rpcUrl: process.env.NEXT_PUBLIC_BASE_MAINNET_RPC || 'https://mainnet.base.org',
      explorerUrl: process.env.NEXT_PUBLIC_BASE_EXPLORER || 'https://basescan.org',
      explorerApiUrl: 'https://api.etherscan.io/v2/api',
      usdcAddress: process.env.NEXT_PUBLIC_USDC_CONTRACT_ADDRESS || '0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913'
    };
  } else {
    return {
      chainId: parseInt(process.env.NEXT_PUBLIC_BASE_CHAIN_ID || '84532'),
      name: 'Base Sepolia',
      rpcUrl: process.env.NEXT_PUBLIC_BASE_SEPOLIA_RPC || 'https://sepolia.base.org',
      explorerUrl: process.env.NEXT_PUBLIC_BASE_EXPLORER || 'https://sepolia.basescan.org',
      explorerApiUrl: 'https://api.etherscan.io/v2/api',
      usdcAddress: process.env.NEXT_PUBLIC_USDC_CONTRACT_ADDRESS || '0x036CbD53842c5426634e7929541eC2318f3dCF7e'
    };
  }
};

export const NETWORK_CONFIG = {
  ...getEnvConfig(),
  
  // Native Currency (same for both networks)
  nativeCurrency: {
    name: 'Ethereum',
    symbol: 'ETH',
    decimals: 18
  },
  
  // USDC details (6 decimals for both networks)
  usdc: {
    address: getEnvConfig().usdcAddress,
    decimals: 6,
    symbol: 'USDC',
    name: 'USD Coin'
  },
  
  // Block time and confirmations
  blockTime: 2, // seconds
  confirmations: 3,
  
  // Gas settings for Base
  gasSettings: {
    gasLimit: 21000,
    maxFeePerGas: '0x59682f00', // 1.5 gwei
    maxPriorityFeePerGas: '0x3b9aca00', // 1 gwei
  }
} as const;

/**
 * Get current network name for display
 */
export function getCurrentNetworkName(): string {
  return NETWORK_CONFIG.name;
}

/**
 * Check if running on mainnet
 */
export function isMainnet(): boolean {
  return process.env.NEXT_PUBLIC_ENABLE_MAINNET === 'true';
}

/**
 * Get network-specific configuration
 */
export function getNetworkConfig() {
  return NETWORK_CONFIG;
}

/**
 * Format address for current network explorer
 */
export function getExplorerAddressUrl(address: string): string {
  return `${NETWORK_CONFIG.explorerUrl}/address/${address}`;
}

/**
 * Format transaction for current network explorer  
 */
export function getExplorerTxUrl(txHash: string): string {
  return `${NETWORK_CONFIG.explorerUrl}/tx/${txHash}`;
}

/**
 * Format contract for current network explorer
 */
export function getExplorerContractUrl(contractAddress: string): string {
  return `${NETWORK_CONFIG.explorerUrl}/address/${contractAddress}#code`;
}

/**
 * Get network display info for UI
 */
export function getNetworkDisplayInfo() {
  return {
    name: NETWORK_CONFIG.name,
    chainId: NETWORK_CONFIG.chainId,
    isMainnet: isMainnet(),
    explorerName: isMainnet() ? 'BaseScan' : 'BaseScan Sepolia',
    explorerUrl: NETWORK_CONFIG.explorerUrl,
    nativeCurrency: NETWORK_CONFIG.nativeCurrency,
    usdcAddress: NETWORK_CONFIG.usdc.address
  };
}

/**
 * Check if address is valid Ethereum address
 */
export function isValidAddress(address: string): boolean {
  return /^0x[a-fA-F0-9]{40}$/.test(address);
}

/**
 * Format USDC amount for display (6 decimals)
 */
export function formatUSDC(amount: string | bigint): string {
  const amountBigInt = typeof amount === 'string' ? BigInt(amount) : amount;
  const formatted = Number(amountBigInt) / 1e6;
  return `${formatted.toFixed(2)} USDC`;
}

/**
 * Parse USDC amount to atomic units
 */
export function parseUSDC(amount: string): bigint {
  const parsed = parseFloat(amount);
  return BigInt(Math.floor(parsed * 1e6));
}

/**
 * Get network configuration for wagmi/viem
 */
export const getWagmiNetworkConfig = () => ({
  id: NETWORK_CONFIG.chainId,
  name: NETWORK_CONFIG.name,
  network: isMainnet() ? 'base' : 'base-sepolia',
  nativeCurrency: NETWORK_CONFIG.nativeCurrency,
  rpcUrls: {
    default: {
      http: [NETWORK_CONFIG.rpcUrl],
    },
    public: {
      http: [NETWORK_CONFIG.rpcUrl],
    },
  },
  blockExplorers: {
    default: {
      name: isMainnet() ? 'BaseScan' : 'BaseScan Sepolia',
      url: NETWORK_CONFIG.explorerUrl,
    },
  },
  contracts: {
    usdc: {
      address: NETWORK_CONFIG.usdc.address as `0x${string}`,
      abi: [
        // ERC-20 standard functions
        {
          name: 'transfer',
          type: 'function',
          stateMutability: 'nonpayable',
          inputs: [
            { name: 'to', type: 'address' },
            { name: 'amount', type: 'uint256' }
          ],
          outputs: [{ name: '', type: 'bool' }]
        },
        {
          name: 'balanceOf',
          type: 'function',
          stateMutability: 'view',
          inputs: [{ name: 'account', type: 'address' }],
          outputs: [{ name: '', type: 'uint256' }]
        },
        {
          name: 'allowance',
          type: 'function',
          stateMutability: 'view',
          inputs: [
            { name: 'owner', type: 'address' },
            { name: 'spender', type: 'address' }
          ],
          outputs: [{ name: '', type: 'uint256' }]
        }
      ]
    }
  }
});
