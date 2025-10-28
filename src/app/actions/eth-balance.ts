'use server';

import { createPublicRpcClient } from '@/lib/rpc-config';

/**
 * Fetch native ETH balance for a single address
 */
export async function getEthBalance(address: string): Promise<string> {
  try {
    // Use centralized RPC config
    const publicClient = createPublicRpcClient();

    const ethBalance = await publicClient.getBalance({
      address: address as `0x${string}`,
    });

    return ethBalance.toString();
  } catch (error) {
    console.error('Error fetching ETH balance for', address, ':', error);
    return '0';
  }
}
