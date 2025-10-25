/**
 * Token Filtering Utilities
 * 
 * Combines allowlist checking and spam detection to filter token lists.
 */

import { isTokenAllowedByAddress, isNativeToken, getTokenAllowlist } from './allowlist';
import { isSpamToken, getSpamDetails } from './spam-detection';

export type FilteredToken<T> = T & {
  isVerified: boolean;
  isSpam: boolean;
  spamReasons?: string[];
};

export type TokenFilterOptions = {
  chain: 'ethereum' | 'solana';
  network: 'mainnet' | 'testnet';
  showUnverified: boolean;
};

/**
 * Filter a list of tokens based on allowlist and spam detection
 * PRIMARY FILTER: Contract address must match allowlist
 */
export function filterTokens<T extends { 
  token: { 
    symbol?: string; 
    name?: string; 
    contractAddress?: string;
    mintAddress?: string;
  } 
}>(
  tokens: T[] | null | undefined,
  options: TokenFilterOptions
): FilteredToken<T>[] {
  const { chain, network, showUnverified } = options;

  // Safety check: return empty array if tokens is null/undefined
  if (!tokens || !Array.isArray(tokens)) {
    return [];
  }

  return tokens
    .map(token => {
      const contractAddress = token.token.contractAddress || token.token.mintAddress;
      const symbol = token.token.symbol;
      
      // Check if token is native (ETH/SOL)
      const isNative = isNativeToken(symbol, contractAddress);
      
      // Check if token contract address is on the allowlist
      const isVerifiedByAddress = isNative || isTokenAllowedByAddress(contractAddress, chain, network);
      
      // Check if token appears to be spam (only matters if not verified by address)
      const spamCheck = isVerifiedByAddress ? { isSpam: false, reasons: [] } : getSpamDetails(token.token);
      
      // Debug log for each token
      if (contractAddress || isNative) {
        console.log(`Token check: ${symbol}`, {
          contractAddress: contractAddress || 'native',
          isNative,
          isVerified: isVerifiedByAddress,
          isSpam: spamCheck.isSpam,
          spamReasons: spamCheck.reasons,
        });
      }
      
      return {
        ...token,
        isVerified: isVerifiedByAddress,
        isSpam: spamCheck.isSpam,
        spamReasons: spamCheck.reasons,
      };
    })
    .filter(token => {
      // ALWAYS show verified tokens (verified by contract address)
      if (token.isVerified) return true;
      
      // NEVER show unverified tokens (wrong contract address) unless explicitly requested
      if (!showUnverified) return false;
      
      // If showing unverified, still hide obvious spam
      if (token.isSpam && !showUnverified) return false;
      
      return showUnverified;
    });
}

/**
 * Sort tokens with verified tokens first
 */
export function sortTokens<T extends { isVerified: boolean }>(tokens: T[]): T[] {
  return [...tokens].sort((a, b) => {
    // Verified tokens first
    if (a.isVerified && !b.isVerified) return -1;
    if (!a.isVerified && b.isVerified) return 1;
    return 0;
  });
}

export { isTokenAllowedByAddress, isNativeToken, getTokenAllowlist } from './allowlist';
export { isSpamToken, getSpamDetails } from './spam-detection';
