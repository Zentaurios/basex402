'use server';

import { CdpClient } from '@coinbase/cdp-sdk';

/**
 * Debug function to see what methods are available on cdp.solana
 */
export async function debugSolanaApi() {
  try {
    const cdp = new CdpClient();
    
    console.log('CDP Solana methods:', Object.getOwnPropertyNames(Object.getPrototypeOf(cdp.solana)));
    console.log('CDP Solana keys:', Object.keys(cdp.solana));
    
    // Try to see what's available
    const solanaApi = cdp.solana as any;
    console.log('Available methods:', Object.getOwnPropertyNames(solanaApi));
    
    return {
      success: true,
      methods: Object.getOwnPropertyNames(Object.getPrototypeOf(cdp.solana))
    };
  } catch (error) {
    console.error('Debug error:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error'
    };
  }
}
