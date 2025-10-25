'use server';

import { generateJwt } from '@coinbase/cdp-sdk/auth';

type SolanaTokenBalance = {
  amount: {
    amount: string;
    decimals: number;
  };
  token: {
    symbol?: string;
    name?: string;
    mintAddress: string;
  };
};

type SolanaBalancesResponse = {
  balances: SolanaTokenBalance[];
  nextPageToken?: string;
};

/**
 * Fetch Solana token balances using CDP v2 REST API
 * Uses CDP SDK's generateJwt for authentication
 */
export async function getSolanaTokenBalances(address: string): Promise<SolanaTokenBalance[]> {
  try {
    const apiKeyId = process.env.CDP_API_KEY_ID;
    const apiKeySecret = process.env.CDP_API_KEY_SECRET;

    if (!apiKeyId || !apiKeySecret) {
      throw new Error('CDP_API_KEY_NOT_CONFIGURED');
    }

    const network = process.env.NEXT_PUBLIC_ENABLE_MAINNET === 'true' ? 'solana' : 'solana-devnet';
    const requestPath = `/platform/v2/solana/token-balances/${network}/${address}`;
    const requestHost = 'api.cdp.coinbase.com';

    // Generate JWT using CDP SDK
    const jwt = await generateJwt({
      apiKeyId,
      apiKeySecret,
      requestMethod: 'GET',
      requestHost,
      requestPath,
      expiresIn: 120, // 2 minutes
    });

    const response = await fetch(
      `https://${requestHost}${requestPath}`,
      {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${jwt}`,
          'Content-Type': 'application/json',
        },
        cache: 'no-store',
      }
    );

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      console.error('Solana token balances API error:', errorData);
      throw new Error(`Failed to fetch Solana balances: ${response.statusText}`);
    }

    const data: SolanaBalancesResponse = await response.json();
    return data.balances;
  } catch (error) {
    console.error('Error fetching Solana token balances:', error);
    return [];
  }
}
