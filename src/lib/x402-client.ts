/**
 * x402 Client-Side Payment Handler
 * Handles the complete payment flow for x402 protocol
 * Supports both external wallets (via WalletClient) and CDP embedded wallets (via custom signing function)
 */

import { type WalletClient } from 'viem';
import { type X402Signer } from '@/types';

interface PaymentRequest {
  scheme: string;
  network: string;
  maxAmountRequired: string;
  resource: string;
  description: string;
  payTo: string;
  asset: string;
  maxTimeoutSeconds: number;
}

interface PaymentHeader {
  x402Version: number;
  scheme: string;
  network: string;
  payload: {
    signature: string;
    authorization: {
      from: string;
      to: string;
      value: string;
      validAfter: string;
      validBefore: string;
      nonce: string;
    };
  };
}

interface X402FlowCallbacks {
  onPaymentRequired?: (amount: string) => void;
  onSigning?: () => void;
  onPaymentSigned?: () => void;
  onMinting?: () => void;
}

// Re-export for backwards compatibility
export type { X402Signer };

/**
 * Make a request that may require x402 payment
 * Automatically handles 402 responses and payment flow
 */
export async function makeX402Request(
  url: string,
  options: RequestInit,
  signer: X402Signer,
  callbacks?: X402FlowCallbacks
): Promise<Response> {
  // Making x402 request
  
  // First attempt without payment
  let response: Response;
  try {
    response = await fetch(url, options);
  } catch (error) {
    console.error('❌ [x402-client] Fetch failed:', error);
    throw error;
  }
  
  // If not 402, return the response
  if (response.status !== 402) {
    return response;
  }
  
  // Got 402 Payment Required - initiating payment flow
  
  // Got 402 - need to make payment
  if (!signer.address || (!signer.walletClient && !signer.signTypedData)) {
    console.error('❌ [x402-client] Signer required but not available:', {
      hasWalletClient: !!signer.walletClient,
      hasSignTypedData: !!signer.signTypedData,
      address: signer.address,
    });
    throw new Error('Wallet required for payment');
  }
  
  // Parse payment request
  let paymentRequest: PaymentRequest;
  try {
    const responseText = await response.text();
    paymentRequest = JSON.parse(responseText) as PaymentRequest;
  } catch (error) {
    console.error('❌ [x402-client] Failed to parse payment request:', error);
    throw new Error('Failed to parse payment request from server');
  }
  
  const amountUSDC = (parseInt(paymentRequest.maxAmountRequired) / 1_000_000).toFixed(2);
  
  // Notify payment required
  try {
    callbacks?.onPaymentRequired?.(amountUSDC);
  } catch (error) {
    console.error('❌ [x402-client] Payment required callback failed:', error);
  }
  
  try {
    // Notify signing step
    callbacks?.onSigning?.();
    
    // Create payment header
    const paymentHeader = await createPaymentHeader(
      paymentRequest,
      signer
    );
    
    // Notify payment signed
    callbacks?.onPaymentSigned?.();
    
    // Retry request with payment header
    const retryOptions = {
      ...options,
      headers: {
        ...options.headers,
        'X-PAYMENT': JSON.stringify(paymentHeader),
      },
    };
    
    response = await fetch(url, retryOptions);
    
    // Notify minting step after successful payment submission
    if (response.ok) {
      callbacks?.onMinting?.();
    }
    
    return response;
  } catch (error: any) {
    console.error('Payment flow failed:', error);
    throw error;
  }
}

/**
 * Create a signed payment header for x402
 * This creates a EIP-3009 transfer authorization
 * Works with both WalletClient (external wallets) and custom signTypedData (CDP embedded wallets)
 */
async function createPaymentHeader(
  paymentRequest: PaymentRequest,
  signer: X402Signer
): Promise<PaymentHeader> {
  const now = Math.floor(Date.now() / 1000);
  const validAfter = now;
  const validBefore = now + paymentRequest.maxTimeoutSeconds;
  
  // Generate a unique nonce using timestamp + crypto random
  // This ensures nonces are always unique even across rapid requests
  const timestamp = Date.now().toString(16).padStart(16, '0'); // 8 bytes
  const random = Array.from({ length: 48 }, () => 
    Math.floor(Math.random() * 16).toString(16)
  ).join(''); // 24 bytes
  const nonce = '0x' + timestamp + random; // Total 32 bytes (64 hex chars)
  
  // Create the payment payload
  // ✅ CRITICAL: Use EOA address for x402 payments (where USDC is held)
  const paymentPayload = {
    from: signer.eoaAddress || signer.address,  // Use EOA for payments
    to: paymentRequest.payTo,
    value: paymentRequest.maxAmountRequired,
    validAfter: validAfter.toString(),
    validBefore: validBefore.toString(),
    nonce,
  };
  
  // Check if using CDP embedded wallet or external wallet
  const isCdpWallet = !!signer.signTypedData && !signer.walletClient;
  
  // For external wallets, validate chain
  if (signer.walletClient && !isCdpWallet) {
    try {
      const currentChainId = await signer.walletClient.getChainId();
      
      const expectedChainId = paymentRequest.network === 'base' ? 8453 : 84532;
      if (currentChainId !== expectedChainId) {
        const networkName = paymentRequest.network === 'base' ? 'Base Mainnet' : 'Base Sepolia';
        throw new Error(
          `Wrong network! Please switch your wallet to ${networkName} (Chain ID: ${expectedChainId}). ` +
          `Currently on Chain ID: ${currentChainId}`
        );
      }
    } catch (error) {
      console.error('❌ Failed to get chain ID:', error);
      if (error instanceof Error && error.message.includes('Wrong network')) {
        throw error;
      }
      throw new Error('Failed to get wallet chain ID. Please ensure your wallet is connected.');
    }
  }
  
  // Create EIP-712 domain using the payment network's chain ID
  const paymentChainId = paymentRequest.network === 'base' ? 8453 : 84532;
  const domain = {
    name: 'USD Coin',
    version: '2',
    chainId: paymentChainId,
    verifyingContract: paymentRequest.asset as `0x${string}`,
  };
  
  // Create EIP-712 types for transfer authorization
  const types = {
    EIP712Domain: [
      { name: 'name', type: 'string' },
      { name: 'version', type: 'string' },
      { name: 'chainId', type: 'uint256' },
      { name: 'verifyingContract', type: 'address' },
    ],
    TransferWithAuthorization: [
      { name: 'from', type: 'address' },
      { name: 'to', type: 'address' },
      { name: 'value', type: 'uint256' },
      { name: 'validAfter', type: 'uint256' },
      { name: 'validBefore', type: 'uint256' },
      { name: 'nonce', type: 'bytes32' },
    ],
  };
  
  // Message to sign - Use BigInt for both CDP and external wallets
  // EIP-712 types specify uint256, so values MUST be BigInt for correct hashing
  const message = {
    from: paymentPayload.from as `0x${string}`,
    to: paymentPayload.to as `0x${string}`,
    value: BigInt(paymentPayload.value),         // ✅ BigInt for correct encoding
    validAfter: BigInt(paymentPayload.validAfter),
    validBefore: BigInt(paymentPayload.validBefore),
    nonce: paymentPayload.nonce as `0x${string}`,
  };

  // 🔧 CRITICAL FIX: Convert BigInt to hex strings for CDP SDK
  // CDP SDK calls JSON.stringify() internally which can't serialize BigInt
  // Hex strings are correctly interpreted as uint256 by EIP-712
  const messageCDP = {
    from: message.from,
    to: message.to,
    value: '0x' + message.value.toString(16),         // Convert to hex string
    validAfter: '0x' + message.validAfter.toString(16),
    validBefore: '0x' + message.validBefore.toString(16),
    nonce: message.nonce,
  };

  // Sign the authorization
  try {
    
    let signature: string;
    
    // Increase timeout to 60 seconds
    const SIGNATURE_TIMEOUT = 60000; // 60 seconds
    
    if (isCdpWallet && signer.signTypedData) {
      // Use CDP signing function with hex-encoded values
      
      interface EIP712Domain {
        name: string;
        version: string;
        chainId: number;
        verifyingContract: `0x${string}`;
      }

      interface EIP712Field {
        name: string;
        type: string;
      }

      interface EIP712Types {
        EIP712Domain: EIP712Field[];  // ✅ CRITICAL: Must include this!
        TransferWithAuthorization: EIP712Field[];
      }

      interface SignTypedDataParams {
        domain: EIP712Domain;
        types: EIP712Types;
        primaryType: 'TransferWithAuthorization';
        // CDP wallets use hex string (to avoid JSON.stringify BigInt error)
        message: {
          from: `0x${string}`;
          to: `0x${string}`;
          value: string;          // ✅ Hex string (e.g., "0xf4240")
          validAfter: string;     // ✅ Hex string
          validBefore: string;    // ✅ Hex string
          nonce: `0x${string}`;
        };
      }

      const signaturePromise: Promise<string> = signer.signTypedData({
        domain,
        types,
        primaryType: 'TransferWithAuthorization',
        message: messageCDP,  // ✅ Use hex-encoded version for CDP
      } as SignTypedDataParams).catch((err: unknown) => {
        console.error('CDP signature rejected:', err);
        throw err;
      });
      
      const timeoutPromise = new Promise<never>((_, reject) => {
        setTimeout(() => {
          reject(new Error(`Signature request timed out after ${SIGNATURE_TIMEOUT/1000} seconds. Please try again.`));
        }, SIGNATURE_TIMEOUT);
      });
      
      signature = await Promise.race([signaturePromise, timeoutPromise]);
      
    } else if (signer.walletClient) {
      // Use WalletClient (external wallet)
      
      // Check if wallet supports signTypedData
      if (typeof signer.walletClient.signTypedData !== 'function') {
        throw new Error('This wallet does not support EIP-712 signatures required for x402 payments. Please use a different wallet.');
      }
      
      interface EIP712Domain {
        name: string;
        version: string;
        chainId: number;
        verifyingContract: `0x${string}`;
      }

      interface EIP712Field {
        name: string;
        type: string;
      }

      // Add an index signature so this shape is compatible with libraries expecting
      // a Record<string, TypedDataParameter[]>
      interface EIP712Types {
        [key: string]: EIP712Field[];
        EIP712Domain: EIP712Field[];  // ✅ CRITICAL: Must include this!
        TransferWithAuthorization: EIP712Field[];
      }

      // WalletMessageExternal must be compatible with Record<string, unknown>
      // so add an index signature to satisfy the signTypedData parameter type.
      interface WalletMessageExternal {
        from: `0x${string}`;
        to: `0x${string}`;
        value: bigint;
        validAfter: bigint;
        validBefore: bigint;
        nonce: `0x${string}`;
        [key: string]: unknown;
      }

      interface WalletSignTypedDataParams {
        account: `0x${string}`;
        domain: EIP712Domain;
        types: EIP712Types;
        primaryType: 'TransferWithAuthorization';
        message: WalletMessageExternal;
      }

      const signaturePromise: Promise<string> = signer.walletClient.signTypedData({
        account: signer.address as `0x${string}`,
        domain,
        types,
        primaryType: 'TransferWithAuthorization',
        message: message as unknown as WalletMessageExternal,
      } as WalletSignTypedDataParams).catch((err: unknown) => {
        console.error('External wallet signature rejected:', err);
        throw err;
      });
      
      const timeoutPromise = new Promise<never>((_, reject) => {
        setTimeout(() => {
          reject(new Error(`Signature request timed out after ${SIGNATURE_TIMEOUT/1000} seconds. Please try refreshing the page.`));
        }, SIGNATURE_TIMEOUT);
      });
      
      signature = await Promise.race([signaturePromise, timeoutPromise]);
      
    } else {
      throw new Error('No valid signing method available');
    }
    
    // Parse signature into v, r, s
    const r = signature.slice(0, 66);
    const s = '0x' + signature.slice(66, 130);
    const v = parseInt(signature.slice(130, 132), 16);
    
    // Reconstruct full signature from v, r, s
    const fullSignature = r + s.slice(2) + v.toString(16).padStart(2, '0');
    
    // Return in CDP facilitator format
    return {
      x402Version: 1,
      scheme: paymentRequest.scheme,
      network: paymentRequest.network,
      payload: {
        signature: fullSignature,
        authorization: {
          from: paymentPayload.from,
          to: paymentPayload.to,
          value: paymentPayload.value,
          validAfter: paymentPayload.validAfter,
          validBefore: paymentPayload.validBefore,
          nonce: paymentPayload.nonce,
        },
      },
    };
  } catch (error: any) {
    console.error('Signature request failed:', error);
    
    // Provide user-friendly error messages
    if (error.message?.includes('timeout') || error.message?.includes('timed out')) {
      throw new Error(
        'Signature request timed out. This usually means:\n' +
        '1. Your wallet is not responding\n' +
        '2. The wallet popup is hidden behind another window\n' +
        '3. Your wallet extension needs to be refreshed\n\n' +
        'Please refresh the page and try again.'
      );
    }
    
    if (error.message?.includes('User rejected') || error.code === 4001 || error.code === 'ACTION_REJECTED') {
      throw new Error('You rejected the signature request. Please try again and approve the transaction.');
    }
    
    if (error.message?.includes('chain')) {
      throw new Error('Chain mismatch error. Please ensure you\'re on the correct network.');
    }
    
    if (error.message?.includes('disconnect') || error.message?.includes('not connected')) {
      throw new Error('Wallet disconnected. Please reconnect your wallet and try again.');
    }
    
    throw new Error(`Failed to sign payment: ${error.message || 'Unknown error'}. Please try again.`);
  }
}
