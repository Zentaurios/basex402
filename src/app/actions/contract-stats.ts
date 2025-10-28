'use server';

import { createPublicRpcClient, RPC_CONFIG } from '@/lib/rpc-config';

// Contract addresses
const CONTRACT_ADDRESS = RPC_CONFIG.isMainnet 
  ? (process.env.NFT_CONTRACT_ADDRESS as `0x${string}`) || '0x362EbDDb00933852D80eBDCc8fA6c969dAE5268C' as `0x${string}`
  : (process.env.NFT_CONTRACT_ADDRESS_TESTNET as `0x${string}`);

// Total supply is 402, but last 47 are reserved for airdrop
const TOTAL_SUPPLY = 402;
const AIRDROP_RESERVE = 47;
const MAX_PUBLIC_SUPPLY = TOTAL_SUPPLY - AIRDROP_RESERVE; // 355

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

/**
 * Get current contract statistics
 */
export async function getContractStats() {
  try {
    if (!CONTRACT_ADDRESS) {
      return {
        totalSupply: 0,
        maxSupply: MAX_PUBLIC_SUPPLY,
        remaining: MAX_PUBLIC_SUPPLY,
        nextTokenId: 1,
      };
    }

    // Create public client with retry logic
    const publicClient = createPublicRpcClient();

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
    // Return fallback data on error (don't crash the app)
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

    const publicClient = createPublicRpcClient();

    const count = await publicClient.readContract({
      address: CONTRACT_ADDRESS,
      abi: CONTRACT_ABI,
      functionName: 'mintedPerWallet',
      args: [walletAddress as `0x${string}`],
    });

    return Number(count);
  } catch (error) {
    return 0;
  }
}
