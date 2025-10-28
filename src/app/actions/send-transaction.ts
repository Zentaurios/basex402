'use server';

import { CdpClient } from '@coinbase/cdp-sdk';
import { parseUnits, encodeFunctionData } from 'viem';

export type SendTransactionParams = {
  fromAddress: string;
  toAddress: string;
  amount: string; // Human-readable amount (e.g., "1.5")
  tokenAddress?: string; // undefined for native ETH, contract address for ERC-20
  decimals: number;
};

export type SendTransactionResult = {
  success: boolean;
  transactionHash?: string;
  error?: string;
};

// ERC-20 ABI for transfer function
const ERC20_TRANSFER_ABI = [
  {
    name: 'transfer',
    type: 'function',
    stateMutability: 'nonpayable',
    inputs: [
      { name: 'to', type: 'address' },
      { name: 'amount', type: 'uint256' },
    ],
    outputs: [{ name: '', type: 'bool' }],
  },
] as const;

/**
 * Send EVM transaction (ETH or ERC-20) using CDP SDK
 * Smart Accounts enable gasless transactions!
 */
export async function sendEvmTransaction(
  params: SendTransactionParams
): Promise<SendTransactionResult> {
  try {
    const cdp = new CdpClient();
    const network = process.env.NEXT_PUBLIC_ENABLE_MAINNET === 'true' ? 'base' : 'base-sepolia';

    // Convert human-readable amount to smallest unit (wei/token units)
    const amountInSmallestUnit = parseUnits(params.amount, params.decimals);

    // For native ETH transfers
    if (!params.tokenAddress) {
      const { transactionHash } = await cdp.evm.sendTransaction({
        address: params.fromAddress as `0x${string}`,
        network: network as 'base' | 'base-sepolia',
        transaction: {
          to: params.toAddress as `0x${string}`,
          value: amountInSmallestUnit,
        },
      });

      return {
        success: true,
        transactionHash,
      };
    }

    // For ERC-20 token transfers
    const transferData = encodeFunctionData({
      abi: ERC20_TRANSFER_ABI,
      functionName: 'transfer',
      args: [params.toAddress as `0x${string}`, amountInSmallestUnit],
    });

    const { transactionHash } = await cdp.evm.sendTransaction({
      address: params.fromAddress as `0x${string}`,
      network: network as 'base' | 'base-sepolia',
      transaction: {
        to: params.tokenAddress as `0x${string}`,
        data: transferData,
      },
    });

    return {
      success: true,
      transactionHash,
    };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to send transaction',
    };
  }
}

/**
 * Validate EVM address format
 * Made async to satisfy Next.js 15 server action requirements
 */
export async function isValidEvmAddress(address: string): Promise<boolean> {
  return /^0x[a-fA-F0-9]{40}$/.test(address);
}
