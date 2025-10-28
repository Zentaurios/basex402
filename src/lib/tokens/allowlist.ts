/**
 * Token Allowlist Configuration
 * 
 * This file contains verified token contracts for Base and Solana networks.
 * Only tokens on this list will be shown by default to prevent spam/scam tokens.
 */

export type TokenInfo = {
  symbol: string;
  name: string;
  decimals: number;
  address: string; // Contract address for EVM, Mint address for Solana
  logoUrl?: string;
};

// Base Mainnet Verified Tokens
export const BASE_MAINNET_TOKENS: Record<string, TokenInfo> = {
  // Native ETH (no contract address)
  ETH: {
    symbol: 'ETH',
    name: 'Ethereum',
    decimals: 18,
    address: 'native',
  },
  // USDC on Base
  USDC: {
    symbol: 'USDC',
    name: 'USD Coin',
    decimals: 6,
    address: '0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913',
  },
  // Wrapped ETH
  WETH: {
    symbol: 'WETH',
    name: 'Wrapped Ether',
    decimals: 18,
    address: '0x4200000000000000000000000000000000000006',
  },
  // DAI on Base
  DAI: {
    symbol: 'DAI',
    name: 'Dai Stablecoin',
    decimals: 18,
    address: '0x50c5725949A6F0c72E6C4a641F24049A917DB0Cb',
  },
  // cbETH
  cbETH: {
    symbol: 'cbETH',
    name: 'Coinbase Wrapped Staked ETH',
    decimals: 18,
    address: '0x2Ae3F1Ec7F1F5012CFEab0185bfc7aa3cf0DEc22',
  },
};

// Base Sepolia (Testnet) Verified Tokens
export const BASE_SEPOLIA_TOKENS: Record<string, TokenInfo> = {
  // Native ETH
  ETH: {
    symbol: 'ETH',
    name: 'Ethereum',
    decimals: 18,
    address: 'native',
  },
  // USDC on Base Sepolia
  USDC: {
    symbol: 'USDC',
    name: 'USD Coin',
    decimals: 6,
    address: '0x036CbD53842c5426634e7929541eC2318f3dCF7e',
  },
};

// Solana Mainnet Verified Tokens
export const SOLANA_MAINNET_TOKENS: Record<string, TokenInfo> = {
  // Native SOL
  SOL: {
    symbol: 'SOL',
    name: 'Solana',
    decimals: 9,
    address: 'native',
  },
  // USDC on Solana
  USDC: {
    symbol: 'USDC',
    name: 'USD Coin',
    decimals: 6,
    address: 'EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v',
  },
  // USDT on Solana
  USDT: {
    symbol: 'USDT',
    name: 'Tether USD',
    decimals: 6,
    address: 'Es9vMFrzaCERmJfrF4H2FYD4KCoNkY11McCe8BenwNYB',
  },
};

// Solana Devnet Verified Tokens
export const SOLANA_DEVNET_TOKENS: Record<string, TokenInfo> = {
  // Native SOL
  SOL: {
    symbol: 'SOL',
    name: 'Solana',
    decimals: 9,
    address: 'native',
  },
  // Note: Devnet doesn't have official USDC, users can create test tokens
};

/**
 * Get the token allowlist for a specific network
 */
export function getTokenAllowlist(
  chain: 'ethereum' | 'solana',
  network: 'mainnet' | 'testnet'
): Record<string, TokenInfo> {
  if (chain === 'ethereum') {
    return network === 'mainnet' ? BASE_MAINNET_TOKENS : BASE_SEPOLIA_TOKENS;
  } else {
    return network === 'mainnet' ? SOLANA_MAINNET_TOKENS : SOLANA_DEVNET_TOKENS;
  }
}

/**
 * Check if a token is on the allowlist by contract address
 * This is the PRIMARY filter - only tokens with matching addresses are allowed
 */
export function isTokenAllowedByAddress(
  address: string | undefined,
  chain: 'ethereum' | 'solana',
  network: 'mainnet' | 'testnet'
): boolean {
  if (!address) {
    // Native tokens (ETH, SOL) don't have contract addresses
    return false;
  }

  const allowlist = getTokenAllowlist(chain, network);
  
  // Normalize addresses for comparison
  const normalizedAddress = chain === 'ethereum' 
    ? address.toLowerCase() 
    : address;

  // Check if token address matches any in allowlist
  return Object.values(allowlist).some(token => {
    if (token.address === 'native') return false; // Native tokens handled separately
    
    const allowedAddress = chain === 'ethereum'
      ? token.address.toLowerCase()
      : token.address;
      
    return allowedAddress === normalizedAddress;
  });
}

/**
 * Common contract address placeholders for native tokens
 * These addresses are used by various APIs to represent native ETH/SOL
 */
const NATIVE_ETH_ADDRESSES = [
  '0x0000000000000000000000000000000000000000', // Zero address
  '0xeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeee', // ERC-7528 standard
  '0xEeeeeEeeeEeEeeEeEeEeeEEEeeeeEeeeeeeeEEeE', // Mixed case (CDP uses this)
  'native',                                      // Explicit 'native' string
].map(addr => addr.toLowerCase());

/**
 * Check if a token is native (ETH/SOL) based on symbol and address
 */
export function isNativeToken(
  symbol: string | undefined,
  address: string | undefined
): boolean {
  // Check if symbol indicates native token
  const isNativeSymbol = symbol === 'ETH' || symbol === 'SOL' || symbol === 'Ethereum' || symbol === 'Solana';
  
  // If no address, check symbol
  if (!address) {
    return isNativeSymbol;
  }
  
  // Check if address is a known native token placeholder
  const normalizedAddress = address.toLowerCase();
  const isNativeAddress = NATIVE_ETH_ADDRESSES.includes(normalizedAddress);
  
  // A token is native if:
  // 1. It has a native placeholder address, OR
  // 2. It has a native symbol AND no standard contract address
  return isNativeAddress || (isNativeSymbol && !address);
}
