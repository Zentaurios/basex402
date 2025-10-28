'use server';

import { CdpClient } from '@coinbase/cdp-sdk';
import { createPublicClient, http, formatEther } from 'viem';
import { base, baseSepolia } from 'viem/chains';

type TokenBalance = {
  amount: {
    amount: string;
    decimals: number;
  };
  token: {
    network: string;
    symbol?: string;
    name?: string;
    contractAddress: string;
  };
};

/**
 * Fetch EVM token balances using CDP SDK
 * CDP's listTokenBalances already includes native ETH!
 */
export async function getTokenBalances(address: string): Promise<TokenBalance[]> {
  console.log('📊 [getTokenBalances] Fetching balances for:', address);
  
  try {
    // CDP SDK automatically reads CDP_API_KEY_ID and CDP_API_KEY_SECRET from env
    const cdp = new CdpClient();
    
    const isMainnet = process.env.NEXT_PUBLIC_ENABLE_MAINNET === 'true';
    const network = isMainnet ? 'base' : 'base-sepolia';
    
    console.log('📊 [getTokenBalances] Using network:', network);
    
    // ✅ CDP's listTokenBalances already includes native ETH in the response!
    const result = await cdp.evm.listTokenBalances({
      address: address as `0x${string}`,
      network: network as 'base' | 'base-sepolia',
    });

    console.log('📊 [getTokenBalances] CDP returned:', {
      balanceCount: result.balances.length,
      tokens: result.balances.map(b => `${b.token.symbol} (${b.amount.amount})`),
    });

    const tokenBalances = result.balances.map((balance) => ({
      amount: {
        amount: balance.amount.amount.toString(),
        decimals: balance.amount.decimals,
      },
      token: {
        network: balance.token.network,
        symbol: balance.token.symbol,
        name: balance.token.name,
        contractAddress: balance.token.contractAddress,
      },
    }));

    // Check if CDP included ETH
    const hasEth = tokenBalances.some(b => b.token.symbol === 'ETH');
    console.log('📊 [getTokenBalances] CDP included ETH?', hasEth);

    // If CDP didn't include ETH, fetch it manually as fallback
    if (!hasEth) {
      console.log('⚠️ [getTokenBalances] CDP did not include ETH, fetching via viem...');
      
      try {
        const chain = isMainnet ? base : baseSepolia;
        const publicClient = createPublicClient({
          chain,
          transport: http(),
        });

        const ethBalance = await publicClient.getBalance({
          address: address as `0x${string}`,
        });

        console.log('📊 [getTokenBalances] Viem ETH balance:', ethBalance.toString());

        // Add ETH as a native token
        const ethTokenBalance: TokenBalance = {
          amount: {
            amount: ethBalance.toString(),
            decimals: 18,
          },
          token: {
            network: network,
            symbol: 'ETH',
            name: 'Ethereum',
            contractAddress: '0x0000000000000000000000000000000000000000',
          },
        };

        // Return ETH first, then other tokens
        return [ethTokenBalance, ...tokenBalances];
      } catch (ethError) {
        console.error('❌ [getTokenBalances] Error fetching ETH via viem:', ethError);
        return tokenBalances;
      }
    }

    // CDP already included ETH, return as-is
    return tokenBalances;
  } catch (error) {
    console.error('❌ [getTokenBalances] Error fetching token balances:', error);
    // Return empty array so UI shows "No assets found"
    return [];
  }
}
