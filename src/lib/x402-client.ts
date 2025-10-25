/**
 * x402 Client-Side Payment Handler
 * Handles the complete payment flow for x402 protocol
 */

import { type WalletClient } from 'viem';

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
  x402Version: string;
  scheme: string;
  network: string;
  paymentPayload: {
    from: string;
    to: string;
    value: string;
    validAfter: string;
    validBefore: string;
    nonce: string;
    v: number;
    r: string;
    s: string;
  };
}

/**
 * Make a request that may require x402 payment
 * Automatically handles 402 responses and payment flow
 */
export async function makeX402Request(
  url: string,
  options: RequestInit,
  walletClient: WalletClient | null,
  userAddress: string | undefined
): Promise<Response> {
  // First attempt without payment
  let response = await fetch(url, options);
  
  // If not 402, return the response
  if (response.status !== 402) {
    return response;
  }
  
  // Got 402 - need to make payment
  if (!walletClient || !userAddress) {
    throw new Error('Wallet required for payment');
  }
  
  // Parse payment request
  const paymentRequest: PaymentRequest = await response.json();
  
  console.log('💳 Payment required:', paymentRequest);
  console.log(`💰 Amount: ${parseInt(paymentRequest.maxAmountRequired) / 1_000_000} USDC`);
  
  // Create payment header
  const paymentHeader = await createPaymentHeader(
    paymentRequest,
    walletClient,
    userAddress
  );
  
  // Retry request with payment header
  const retryOptions = {
    ...options,
    headers: {
      ...options.headers,
      'X-PAYMENT': JSON.stringify(paymentHeader),
    },
  };
  
  console.log('🔄 Retrying request with payment...');
  response = await fetch(url, retryOptions);
  
  return response;
}

/**
 * Create a signed payment header for x402
 * This creates a EIP-3009 transfer authorization
 */
async function createPaymentHeader(
  paymentRequest: PaymentRequest,
  walletClient: WalletClient,
  userAddress: string
): Promise<PaymentHeader> {
  const now = Math.floor(Date.now() / 1000);
  const validAfter = now;
  const validBefore = now + paymentRequest.maxTimeoutSeconds;
  
  // Generate a random nonce
  const nonce = '0x' + Array.from({ length: 64 }, () => 
    Math.floor(Math.random() * 16).toString(16)
  ).join('');
  
  // Create the payment payload
  const paymentPayload = {
    from: userAddress,
    to: paymentRequest.payTo,
    value: paymentRequest.maxAmountRequired,
    validAfter: validAfter.toString(),
    validBefore: validBefore.toString(),
    nonce,
  };
  
  // Create EIP-712 domain
  const domain = {
    name: 'USD Coin',
    version: '2',
    chainId: await walletClient.getChainId(),
    verifyingContract: paymentRequest.asset as `0x${string}`,
  };
  
  // Create EIP-712 types for transfer authorization
  const types = {
    TransferWithAuthorization: [
      { name: 'from', type: 'address' },
      { name: 'to', type: 'address' },
      { name: 'value', type: 'uint256' },
      { name: 'validAfter', type: 'uint256' },
      { name: 'validBefore', type: 'uint256' },
      { name: 'nonce', type: 'bytes32' },
    ],
  };
  
  // Sign the authorization
  try {
    console.log('✍️ Signing payment authorization...');
    
    const signature = await walletClient.signTypedData({
      account: userAddress as `0x${string}`,
      domain,
      types,
      primaryType: 'TransferWithAuthorization',
      message: {
        from: paymentPayload.from as `0x${string}`,
        to: paymentPayload.to as `0x${string}`,
        value: BigInt(paymentPayload.value),
        validAfter: BigInt(paymentPayload.validAfter),
        validBefore: BigInt(paymentPayload.validBefore),
        nonce: paymentPayload.nonce as `0x${string}`,
      },
    });
    
    // Parse signature into v, r, s
    const r = signature.slice(0, 66);
    const s = '0x' + signature.slice(66, 130);
    const v = parseInt(signature.slice(130, 132), 16);
    
    console.log('✅ Payment authorization signed');
    
    return {
      x402Version: '0.0.1',
      scheme: paymentRequest.scheme,
      network: paymentRequest.network,
      paymentPayload: {
        ...paymentPayload,
        v,
        r,
        s,
      },
    };
  } catch (error) {
    console.error('❌ Failed to sign payment:', error);
    throw new Error('Payment signing failed');
  }
}
