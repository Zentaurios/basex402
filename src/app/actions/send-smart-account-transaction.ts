'use server';

import { CdpClient } from '@coinbase/cdp-sdk';

export type SendSmartAccountTransactionParams = {
  fromAddress: string;
  toAddress: string;
  data?: string; // For contract calls (ERC-20 transfers)
  value?: string; // For native token transfers (in wei as string)
};

export type SendSmartAccountTransactionResult = {
  success: boolean;
  transactionHash?: string;
  error?: string;
};

/**
 * Send transaction from CDP Smart Account with gas sponsorship
 * This must be a server action because it uses CDP API keys for paymaster
 */
export async function sendSmartAccountTransaction(
  params: SendSmartAccountTransactionParams
): Promise<SendSmartAccountTransactionResult> {
  try {
    const cdp = new CdpClient();
    const network = process.env.NEXT_PUBLIC_ENABLE_MAINNET === 'true' ? 'base' : 'base-sepolia';

    console.log('Sending Smart Account transaction:', {
      from: params.fromAddress,
      to: params.toAddress,
      network,
      hasData: !!params.data,
      hasValue: !!params.value,
    });

    // Build transaction object
    const transaction: any = {
      to: params.toAddress as `0x${string}`,
    };

    // Add data if present (for ERC-20 transfers)
    if (params.data) {
      transaction.data = params.data as `0x${string}`;
    }

    // Add value if present (for native ETH transfers)
    if (params.value) {
      transaction.value = BigInt(params.value);
    }

    // Send through CDP SDK which handles Smart Account + Paymaster
    const { transactionHash } = await cdp.evm.sendTransaction({
      address: params.fromAddress as `0x${string}`,
      network: network as 'base' | 'base-sepolia',
      transaction,
    });

    console.log('Smart Account transaction successful:', transactionHash);

    return {
      success: true,
      transactionHash,
    };
  } catch (error) {
    console.error('Error sending Smart Account transaction:', error);
    
    // Extract meaningful error message
    let errorMessage = 'Failed to send transaction';
    if (error instanceof Error) {
      errorMessage = error.message;
    }

    return {
      success: false,
      error: errorMessage,
    };
  }
}
