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
 * Fetch EVM token balances using CDP SDK + native ETH balance
 * SDK automatically handles JWT authentication
 */
export async function getTokenBalances(address: string): Promise<TokenBalance[]> {
  try {
    // CDP SDK automatically reads CDP_API_KEY_ID and CDP_API_KEY_SECRET from env
    const cdp = new CdpClient();
    
    const isMainnet = process.env.NEXT_PUBLIC_ENABLE_MAINNET === 'true';
    const network = isMainnet ? 'base' : 'base-sepolia';
    const chain = isMainnet ? base : baseSepolia;
    
    // Fetch ERC-20 token balances from CDP
    const result = await cdp.evm.listTokenBalances({
      address: address as `0x${string}`,
      network: network as 'base' | 'base-sepolia',
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

    // Fetch native ETH balance using viem
    try {
      const publicClient = createPublicClient({
        chain,
        transport: http(),
      });

      const ethBalance = await publicClient.getBalance({
        address: address as `0x${string}`,
      });

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
          contractAddress: '0x0000000000000000000000000000000000000000', // Native token address
        },
      };

      // Return ETH first, then other tokens
      return [ethTokenBalance, ...tokenBalances];
    } catch (ethError) {
      console.error('Error fetching ETH balance:', ethError);
      // Return token balances even if ETH fetch fails
      return tokenBalances;
    }
  } catch (error) {
    console.error('Error fetching token balances:', error);
    // Return empty array so UI shows "No assets found"
    return [];
  }
}
