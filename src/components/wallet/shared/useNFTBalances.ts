'use client';

import { useState, useEffect } from 'react';
import { getUserNFTs, type NFTWithMetadata } from '@/app/actions/nft-balances';

export function useNFTBalances(
  address: string | null | undefined,
  shouldFetch: boolean = true
) {
  const [nfts, setNfts] = useState<NFTWithMetadata[] | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!shouldFetch || !address) {
      setNfts(null);
      return;
    }

    async function fetchNFTs() {
      setLoading(true);
      setError(null);
      
      try {
        const nftData = await getUserNFTs(address as string);
        setNfts(nftData);
      } catch (err) {
        console.error('Failed to fetch NFTs:', err);
        setError(err instanceof Error ? err.message : 'Failed to fetch NFTs');
        setNfts([]);
      } finally {
        setLoading(false);
      }
    }

    fetchNFTs();
  }, [address, shouldFetch]);

  return { nfts, loading, error };
}