'use client';

import { useState, useEffect } from 'react';
import { getTokenBalances } from '@/app/actions/token-balances';
import { getSolanaTokenBalances } from '@/app/actions/solana-token-balances';
import { usePublicClient } from 'wagmi';

type TokenBalance = {
  amount: {
    amount: string;
    decimals: number;
  };
  token: {
    network?: string;
    symbol?: string;
    name?: string;
    contractAddress?: string;
    mintAddress?: string;
  };
};

export function useTokenBalances(
  chain: 'ethereum' | 'solana',
  address: string | null | undefined,
  shouldFetch: boolean = true
) {
  const [balances, setBalances] = useState<TokenBalance[] | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const publicClient = usePublicClient();

  useEffect(() => {
    if (!shouldFetch || !address) {
      setBalances(null);
      return;
    }

    async function fetchBalances() {
      setLoading(true);
      setError(null);
      
      try {
        let tokenBalances: TokenBalance[] = [];
        
        if (chain === 'ethereum' && address) {
          // Fetch ERC-20 tokens from CDP API
          tokenBalances = await getTokenBalances(address);
          
          // Fetch native ETH balance using wagmi
          if (publicClient) {
            try {
              const ethBalance = await publicClient.getBalance({ 
                address: address as `0x${string}` 
              });
              // Keep as wei string (BigInt compatible) for formatTokenAmount
              const ethWei = ethBalance.toString();
              
              // Add ETH as first token in the list
              const ethToken: TokenBalance = {
                amount: {
                  amount: ethWei, // Store as wei string, not formatted ether
                  decimals: 18,
                },
                token: {
                  symbol: 'ETH',
                  name: 'Ethereum',
                  network: 'base',
                },
              };
              
              // Prepend ETH to the token list
              tokenBalances = [ethToken, ...tokenBalances];
            } catch (ethError) {
              console.error('Failed to fetch ETH balance:', ethError);
              // Continue with just ERC-20 tokens if ETH fetch fails
            }
          }
        } else if (chain === 'solana' && address) {
          tokenBalances = await getSolanaTokenBalances(address);
        }
        
        setBalances(tokenBalances);
      } catch (err) {
        console.error('Failed to fetch balances:', err);
        setError(err instanceof Error ? err.message : 'Failed to fetch balances');
        setBalances([]);
      } finally {
        setLoading(false);
      }
    }

    fetchBalances();
  }, [chain, address, shouldFetch, publicClient]);

  return { balances, loading, error };
}
