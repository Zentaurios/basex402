'use server';

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
 * Fetch token balances using Address History JSON-RPC API
 * Only requires Client API Key (no server authentication needed)
 */
export async function getTokenBalances(address: string): Promise<TokenBalance[]> {
  try {
    const clientApiKey = process.env.NEXT_PUBLIC_CDP_API_KEY;
    
    if (!clientApiKey) {
      throw new Error('CDP_API_KEY_NOT_CONFIGURED');
    }
    
    const network = process.env.NEXT_PUBLIC_ENABLE_MAINNET === 'true' ? 'base' : 'base-sepolia';
    const rpcUrl = `https://api.developer.coinbase.com/rpc/v1/${network}/${clientApiKey}`;
    
    const response = await fetch(rpcUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        jsonrpc: '2.0',
        id: 1,
        method: 'cdp_listBalances',
        params: [{
          address,
          pageToken: '',
          pageSize: 100
        }]
      }),
      cache: 'no-store',
    });

    if (!response.ok) {
      throw new Error(`Failed to fetch balances: ${response.statusText}`);
    }

    const data = await response.json();
    
    // Transform JSON-RPC response to match our TokenBalance type
    if (data.result && data.result.balances) {
      return data.result.balances;
    }
    
    return [];
  } catch (error) {
    console.error('Error fetching token balances:', error);
    return [];
  }
}
