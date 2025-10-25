'use server';

import { CdpClient } from '@coinbase/cdp-sdk';

export type SendSolanaTransactionParams = {
  fromAddress: string;
  toAddress: string;
  amount: string; // Human-readable amount (e.g., "1.5")
  mintAddress?: string; // undefined for native SOL, mint address for SPL tokens
  decimals: number;
};

export type SendSolanaTransactionResult = {
  success: boolean;
  signature?: string;
  error?: string;
};

/**
 * Send Solana transaction (SOL or SPL token) using CDP SDK
 * Note: Solana transactions always require SOL for fees
 */
export async function sendSolanaTransaction(
  params: SendSolanaTransactionParams
): Promise<SendSolanaTransactionResult> {
  try {
    const cdp = new CdpClient();
    const isMainnet = process.env.NEXT_PUBLIC_ENABLE_MAINNET === 'true';
    const network = isMainnet ? 'solana-mainnet' : 'solana-devnet';

    // Convert human-readable amount to lamports/token units
    const amountInSmallestUnit = Math.floor(
      parseFloat(params.amount) * Math.pow(10, params.decimals)
    );

    console.log('Sending Solana transaction:', {
      from: params.fromAddress,
      to: params.toAddress,
      amount: amountInSmallestUnit,
      token: params.mintAddress || 'SOL',
      network
    });

    // Try the direct transfer API similar to EVM
    // Check if cdp.solana has a transfer method
    const solanaApi = cdp.solana as any;
    
    if (typeof solanaApi.transfer === 'function') {
      console.log('Using cdp.solana.transfer()');
      const result = await solanaApi.transfer({
        address: params.fromAddress,
        network: network,
        destination: params.toAddress,
        amount: amountInSmallestUnit,
        token: params.mintAddress || 'sol',
      });
      
      return {
        success: true,
        signature: result.signature || result.transactionHash,
      };
    } else if (typeof solanaApi.sendTransaction === 'function') {
      console.log('Using cdp.solana.sendTransaction()');
      // If there's a sendTransaction method like EVM
      const result = await solanaApi.sendTransaction({
        address: params.fromAddress,
        network: network,
        transaction: {
          to: params.toAddress,
          amount: amountInSmallestUnit,
          token: params.mintAddress,
        },
      });
      
      return {
        success: true,
        signature: result.signature || result.transactionHash,
      };
    } else {
      // List what methods are actually available
      const availableMethods = Object.getOwnPropertyNames(Object.getPrototypeOf(solanaApi));
      console.error('Available Solana API methods:', availableMethods);
      throw new Error(`Solana API methods not found. Available: ${availableMethods.join(', ')}`);
    }
  } catch (error) {
    console.error('Error sending Solana transaction:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to send transaction',
    };
  }
}

/**
 * Validate Solana address format (base58 check)
 */
export async function isValidSolanaAddress(address: string): Promise<boolean> {
  try {
    // Basic length and character check for base58
    if (!address || address.length < 32 || address.length > 44) {
      return false;
    }
    
    // Check if string contains only base58 characters
    const base58Regex = /^[1-9A-HJ-NP-Za-km-z]+$/;
    return base58Regex.test(address);
  } catch {
    return false;
  }
}
