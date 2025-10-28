'use server';

import { createPublicClient, http, encodeFunctionData } from 'viem';
import { base, baseSepolia } from 'viem/chains';

// ERC-721 Transfer ABI
const ERC721_TRANSFER_ABI = [
  {
    inputs: [
      { internalType: 'address', name: 'from', type: 'address' },
      { internalType: 'address', name: 'to', type: 'address' },
      { internalType: 'uint256', name: 'tokenId', type: 'uint256' },
    ],
    name: 'transferFrom',
    outputs: [],
    stateMutability: 'nonpayable',
    type: 'function',
  },
  {
    inputs: [
      { internalType: 'address', name: 'from', type: 'address' },
      { internalType: 'address', name: 'to', type: 'address' },
      { internalType: 'uint256', name: 'tokenId', type: 'uint256' },
    ],
    name: 'safeTransferFrom',
    outputs: [],
    stateMutability: 'nonpayable',
    type: 'function',
  },
  {
    inputs: [{ internalType: 'uint256', name: 'tokenId', type: 'uint256' }],
    name: 'ownerOf',
    outputs: [{ internalType: 'address', name: '', type: 'address' }],
    stateMutability: 'view',
    type: 'function',
  },
] as const;

/**
 * Verify the user owns the NFT before attempting transfer
 */
export async function verifyNFTOwnership(
  tokenId: bigint,
  expectedOwner: string
): Promise<{ isOwner: boolean; currentOwner?: string }> {
  try {
    const isMainnet = process.env.NEXT_PUBLIC_ENABLE_MAINNET === 'true';
    const chain = isMainnet ? base : baseSepolia;
    const nftContractAddress = process.env.NEXT_PUBLIC_NFT_CONTRACT as `0x${string}`;

    if (!nftContractAddress) {
      throw new Error('NFT contract address not configured');
    }

    const publicClient = createPublicClient({
      chain,
      transport: http(),
    });

    const currentOwner = await publicClient.readContract({
      address: nftContractAddress,
      abi: ERC721_TRANSFER_ABI,
      functionName: 'ownerOf',
      args: [tokenId],
    });

    return {
      isOwner: currentOwner.toLowerCase() === expectedOwner.toLowerCase(),
      currentOwner,
    };
  } catch (error) {
    console.error('Error verifying NFT ownership:', error);
    return { isOwner: false };
  }
}

/**
 * Get the transfer function call data for the NFT
 * This will be used by the client to send the transaction
 */
export async function getNFTTransferData(
  fromAddress: string,
  toAddress: string,
  tokenId: bigint
): Promise<{
  to: `0x${string}`;
  data: `0x${string}`;
  value: bigint;
}> {
  const nftContractAddress = process.env.NEXT_PUBLIC_NFT_CONTRACT as `0x${string}`;

  if (!nftContractAddress) {
    throw new Error('NFT contract address not configured');
  }

  const isMainnet = process.env.NEXT_PUBLIC_ENABLE_MAINNET === 'true';
  const chain = isMainnet ? base : baseSepolia;

  const publicClient = createPublicClient({
    chain,
    transport: http(),
  });

  // Encode the safeTransferFrom function call
    const data = encodeFunctionData({
      abi: ERC721_TRANSFER_ABI,
      functionName: 'safeTransferFrom',
      args: [fromAddress as `0x${string}`, toAddress as `0x${string}`, tokenId],
    });

  return {
    to: nftContractAddress,
    data,
    value: 0n,
  };
}

