'use server';

/**
 * NFT Metadata structure following OpenSea standard
 */
export type NFTMetadata = {
  name: string;
  description: string;
  image: string;
  external_url?: string;
  attributes: Array<{
    trait_type: string;
    value: string | number;
  }>;
  background_color?: string;
};

/**
 * Fetch NFT metadata from tokenURI
 * Handles IPFS, HTTP, and data URIs
 * 
 * @param tokenURI - The token URI from the contract
 * @returns Parsed metadata or null if failed
 */
export async function fetchNFTMetadata(tokenURI: string): Promise<NFTMetadata | null> {
  try {
    // Handle different URI schemes
    let fetchURL = tokenURI;
    
    // Convert IPFS URIs to HTTP gateway
    if (tokenURI.startsWith('ipfs://')) {
      fetchURL = tokenURI.replace('ipfs://', 'https://ipfs.io/ipfs/');
    }
    
    // Handle data URIs (base64 encoded JSON)
    if (tokenURI.startsWith('data:application/json')) {
      const base64Data = tokenURI.split(',')[1];
      const jsonString = Buffer.from(base64Data, 'base64').toString('utf-8');
      return JSON.parse(jsonString) as NFTMetadata;
    }
    
    // Fetch metadata from HTTP/HTTPS endpoint
    const response = await fetch(fetchURL, {
      headers: {
        'Accept': 'application/json',
      },
      // Cache for 1 hour since NFT metadata rarely changes
      next: { revalidate: 3600 },
    });
    
    if (!response.ok) {
      console.error(`Failed to fetch metadata: ${response.status} ${response.statusText}`);
      return null;
    }
    
    const metadata = await response.json() as NFTMetadata;
    
    // Convert IPFS image URLs to HTTP gateway
    if (metadata.image?.startsWith('ipfs://')) {
      metadata.image = metadata.image.replace('ipfs://', 'https://ipfs.io/ipfs/');
    }
    
    return metadata;
  } catch (error) {
    console.error('Error fetching NFT metadata:', error);
    return null;
  }
}

/**
 * Fetch metadata for multiple NFTs in parallel
 * 
 * @param tokenURIs - Array of token URIs
 * @returns Array of metadata (null for failed fetches)
 */
export async function fetchMultipleNFTMetadata(
  tokenURIs: string[]
): Promise<(NFTMetadata | null)[]> {
  try {
    const metadataPromises = tokenURIs.map(uri => fetchNFTMetadata(uri));
    return await Promise.all(metadataPromises);
  } catch (error) {
    console.error('Error fetching multiple NFT metadata:', error);
    return tokenURIs.map(() => null);
  }
}