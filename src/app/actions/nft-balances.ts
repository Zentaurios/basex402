'use server';

import { createPublicRpcClient } from '@/lib/rpc-config';

// Contract ABI for the getNFTsOwned function
const NFT_CONTRACT_ABI = [
  {
    inputs: [{ internalType: 'address', name: 'owner', type: 'address' }],
    name: 'getNFTsOwned',
    outputs: [
      {
        components: [
          { internalType: 'uint256', name: 'tokenId', type: 'uint256' },
          { internalType: 'string', name: 'tokenURI', type: 'string' },
          { internalType: 'string', name: 'rarityTier', type: 'string' },
          {
            components: [
              { internalType: 'uint256', name: 'timestamp', type: 'uint256' },
              { internalType: 'string', name: 'paymentMethod', type: 'string' },
              { internalType: 'string', name: 'network', type: 'string' },
            ],
            internalType: 'struct X402ProtocolPioneers.MintData',
            name: 'mintData',
            type: 'tuple',
          },
        ],
        internalType: 'struct X402ProtocolPioneers.TokenWithMetadata[]',
        name: '',
        type: 'tuple[]',
      },
    ],
    stateMutability: 'view',
    type: 'function',
  },
] as const;

export type NFTMintData = {
  timestamp: bigint;
  paymentMethod: string;
  network: string;
};

export type NFTWithMetadata = {
  tokenId: bigint;
  tokenURI: string;
  rarityTier: string;
  mintData: NFTMintData;
};

/**
 * Fetch NFTs owned by an address from the X402ProtocolPioneers contract
 * Uses the contract's getNFTsOwned function which returns all data in a single call
 * 
 * @param address - The wallet address to fetch NFTs for
 * @returns Array of NFTs with full metadata
 */
export async function getUserNFTs(address: string): Promise<NFTWithMetadata[]> {
  try {
    // Get NFT contract address from env
    const nftContractAddress = process.env.NEXT_PUBLIC_NFT_CONTRACT as `0x${string}`;
    
    if (!nftContractAddress) {
      console.error('NEXT_PUBLIC_NFT_CONTRACT not configured');
      return [];
    }
    
    // Create public client using centralized RPC config
    const publicClient = createPublicRpcClient();
    
    // Call the contract's getNFTsOwned function
    const nfts = await publicClient.readContract({
      address: nftContractAddress,
      abi: NFT_CONTRACT_ABI,
      functionName: 'getNFTsOwned',
      args: [address as `0x${string}`],
    });
    
    // Transform the contract response to our type
    return nfts.map((nft) => ({
      tokenId: nft.tokenId,
      tokenURI: nft.tokenURI,
      rarityTier: nft.rarityTier,
      mintData: {
        timestamp: nft.mintData.timestamp,
        paymentMethod: nft.mintData.paymentMethod,
        network: nft.mintData.network,
      },
    }));
  } catch (error) {
    console.error('Error fetching NFTs:', error);
    return [];
  }
}

/**
 * Get formatted NFT count for display
 * @param address - The wallet address to check
 * @returns Number of NFTs owned
 */
export async function getNFTCount(address: string): Promise<number> {
  const nfts = await getUserNFTs(address);
  return nfts.length;
}