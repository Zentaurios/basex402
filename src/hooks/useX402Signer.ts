'use client';

import { useCallback } from 'react';
import { type TypedDataDefinition, type SignTypedDataReturnType } from 'viem';
import { useSignEvmTypedData, useEvmAddress, useCurrentUser } from '@coinbase/cdp-hooks';
import { useWalletClient } from 'wagmi';
import { useWallet } from '@/components/wallet/WalletProvider';
import { type X402Signer } from '@/types';

/**
 * Hook that provides a unified signer for both CDP embedded wallets and external wallets
 * Returns a signer object that can sign EIP-712 typed data for x402 payments
 * 
 * IMPORTANT: For CDP smart accounts, this returns the EOA address (not the smart account)
 * because EIP-3009 signatures must be from the account that signs, not the smart account.
 */
export function useX402Signer(): X402Signer | null {
  // Get wallet info from context
  const { address, walletType } = useWallet();
  
  // CDP hooks - only available for embedded wallets
  const { signEvmTypedData: cdpSignTypedData } = useSignEvmTypedData();
  const { evmAddress: cdpAddress } = useEvmAddress();
  const { currentUser } = useCurrentUser();
  
  // Wagmi wallet client - only available for external wallets
  const { data: walletClient, isLoading: isWalletClientLoading } = useWalletClient();

  // Determine which wallet is active
  const isCdpWallet = walletType === 'embedded';
  const isExternalWallet = walletType === 'external';

  // For CDP wallets, use the EOA address as the signer address
  const eoaAddress = currentUser?.evmAccounts?.[0];

  // Initialize signer based on wallet type

  // Memoize the signTypedData function for CDP wallets
  const wrappedCdpSignTypedData = useCallback(
    async (params: {
      domain: any;
      types: any;
      primaryType: string;
      message: any;
    }): Promise<string> => {
      if (!cdpAddress) {
        throw new Error('CDP smart account address not available');
      }

      if (!cdpSignTypedData) {
        throw new Error('CDP signEvmTypedData not available');
      }

      // Get the EOA address (the owner of the smart account)
      const eoaAddress = currentUser?.evmAccounts?.[0];
      
      if (!eoaAddress) {
        throw new Error(
          'CDP EOA address not found. Your CDP wallet may not be fully initialized. ' +
          'Please try refreshing the page or reconnecting your wallet.'
        );
      }

      // ✅ SECURITY: Validate that cdpAddress matches our wallet context
      if (address !== cdpAddress) {
        throw new Error('Security error: Address mismatch detected. The CDP address does not match the wallet context.');
      }

      // ✅ SECURITY: Validate smart account ownership via currentUser
      if (currentUser?.evmSmartAccounts?.[0] && currentUser.evmSmartAccounts[0] !== cdpAddress) {
        throw new Error('Security error: Smart account mismatch. The address does not match the user\'s smart account.');
      }

      try {

        // Sign with the EOA (owner)
        const result = await cdpSignTypedData({
          evmAccount: eoaAddress,  // Use EOA to sign
          typedData: {
            domain: params.domain,
            types: params.types,    // Now includes EIP712Domain!
            primaryType: params.primaryType,
            message: params.message,
          }
        });

        // Extract signature from result
        let signature: string;
        
        if (typeof result === 'string') {
          signature = result;
        } else if (result && typeof result === 'object' && 'signature' in result) {
          signature = (result as any).signature;
        } else if (result && typeof result === 'object' && 'data' in result) {
          signature = (result as any).data;
        } else {
          throw new Error(`Invalid signature format received from CDP. Expected string or object with 'signature' property, got: ${typeof result}`);
        }
        
        // Validate signature format
        if (typeof signature !== 'string') {
          throw new Error(`Signature is not a string: ${typeof signature}`);
        }
        
        if (!signature.startsWith('0x')) {
          signature = '0x' + signature;
        }

        return signature;
      } catch (error) {

        // Provide user-friendly error message
        if ((error as any)?.message?.includes('EVM account not found')) {
          throw new Error(
            'CDP wallet not ready. Your wallet may not be fully initialized. ' +
            'Please try:\n' +
            '1. Refreshing the page\n' +
            '2. Disconnecting and reconnecting your wallet\n' +
            '3. Clearing your browser cache\n\n' +
            'If the problem persists, please contact support.'
          );
        }

        throw error;
      }
    },
    [cdpAddress, cdpSignTypedData, currentUser, address]
  );

  // Memoize the signTypedData function for external wallets
  const wrappedExternalSignTypedData = useCallback(
    async (params: {
      domain: any;
      types: any;
      primaryType: string;
      message: any;
    }): Promise<string> => {
      if (!walletClient) {
        throw new Error('Wallet client not available');
      }

      try {

        // Convert to TypedDataDefinition format for wagmi
        const signature = await walletClient.signTypedData({
          domain: params.domain,
          types: params.types,
          primaryType: params.primaryType,
          message: params.message,
        } as TypedDataDefinition);

        return signature;
      } catch (error) {
        console.error('❌ [useX402Signer] External signing error:', error);
        throw error;
      }
    },
    [walletClient]
  );

  // Return the appropriate signer based on wallet type
  if (isCdpWallet && cdpAddress && eoaAddress) {
    // ✅ CRITICAL: Return both smart account and EOA addresses
    // address = smart account (for display)
    // eoaAddress = EOA owner (for x402 payments)
    return {
      address: cdpAddress,  // Smart account for display
      eoaAddress: eoaAddress,  // EOA for x402 payments
      signTypedData: wrappedCdpSignTypedData,
      walletClient: null,
      isLoading: false,
    };
  }

  if (isExternalWallet && walletClient && address) {
    // Type guard to ensure address is in the correct format
    if (!address.startsWith('0x')) {
      return null;
    }
    
    // For external wallets, address and eoaAddress are the same
    return {
      address: address,
      eoaAddress: address,  // Same as address for EOA wallets
      signTypedData: wrappedExternalSignTypedData,
      walletClient,
      isLoading: isWalletClientLoading,
    };
  }

  return null;
}
