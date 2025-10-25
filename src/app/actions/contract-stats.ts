'use server';

import { createPublicClient, http } from 'viem';
import { base, baseSepolia } from 'viem/chains';

const isMainnet = process.env.NEXT_PUBLIC_ENABLE_MAINNET === 'true';

// Contract addresses
const CONTRACT_ADDRESS = isMainnet 
  ? (process.env.NEXT_PUBLIC_NFT_CONTRACT_ADDRESS as `0x${string}`) || '0x362EbDDb00933852D80eBDCc8fA6c969dAE5268C' as `0x${string}`
  : (process.env.NEXT_PUBLIC_NFT_CONTRACT_ADDRESS_TESTNET as `0x${string}`);

const MAX_PUBLIC_SUPPLY = 402;

// Minimal ABI for reading contract data
const CONTRACT_ABI = [
  {
    inputs: [],
    name: 'totalSupply',
    outputs: [{ internalType: 'uint256', name: '', type: 'uint256' }],
    stateMutability: 'view',
    type: 'function',
  },
  {
    inputs: [{ internalType: 'address', name: 'owner', type: 'address' }],
    name: 'mintedPerWallet',
    outputs: [{ internalType: 'uint256', name: '', type: 'uint256' }],
    stateMutability: 'view',
    type: 'function',
  },
] as const;

// Create public client for reading contract data
const publicClient = createPublicClient({
  chain: isMainnet ? base : baseSepolia,
  transport: http(),
});

/**
 * Get current contract statistics
 */
export async function getContractStats() {
  try {
    if (!CONTRACT_ADDRESS) {
      console.warn('Contract address not configured');
      return {
        totalSupply: 0,
        maxSupply: MAX_PUBLIC_SUPPLY,
        remaining: MAX_PUBLIC_SUPPLY,
        nextTokenId: 1,
      };
    }

    const totalSupply = await publicClient.readContract({
      address: CONTRACT_ADDRESS,
      abi: CONTRACT_ABI,
      functionName: 'totalSupply',
    });

    const supply = Number(totalSupply);
    const remaining = Math.max(0, MAX_PUBLIC_SUPPLY - supply);
    const nextTokenId = supply + 1;

    return {
      totalSupply: supply,
      maxSupply: MAX_PUBLIC_SUPPLY,
      remaining,
      nextTokenId,
    };
  } catch (error) {
    console.error('Error fetching contract stats:', error);
    // Return fallback data on error
    return {
      totalSupply: 0,
      maxSupply: MAX_PUBLIC_SUPPLY,
      remaining: MAX_PUBLIC_SUPPLY,
      nextTokenId: 1,
    };
  }
}

/**
 * Get number of NFTs minted by a specific wallet
 */
export async function getWalletMintCount(walletAddress: string) {
  try {
    if (!CONTRACT_ADDRESS) {
      return 0;
    }

    const count = await publicClient.readContract({
      address: CONTRACT_ADDRESS,
      abi: CONTRACT_ABI,
      functionName: 'mintedPerWallet',
      args: [walletAddress as `0x${string}`],
    });

    return Number(count);
  } catch (error) {
    console.error('Error fetching wallet mint count:', error);
    return 0;
  }
}
