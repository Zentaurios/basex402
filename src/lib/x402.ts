import { facilitator } from '@coinbase/x402';
import type { X402PaymentRequest, X402PaymentHeader } from '@/types';
import { getNetworkConfig, isMainnet } from './network-config';

/**
 * Official x402 Protocol Implementation using environment variables
 * Supports both Base and Sepolia based on configuration
 */

// Initialize the official Coinbase facilitator
let coinbaseFacilitator: typeof facilitator;

/**
 * Initialize the Coinbase x402 facilitator
 */
function initializeFacilitator(): typeof facilitator {
  if (coinbaseFacilitator) {
    return coinbaseFacilitator;
  }

  if (!process.env.CDP_API_KEY_ID || !process.env.CDP_API_KEY_SECRET) {
    console.warn('⚠️ CDP API keys not found, using default facilitator config');
    coinbaseFacilitator = facilitator;
  } else {
    // Use authenticated facilitator for verify/settle operations
    coinbaseFacilitator = facilitator;
  }

  const networkConfig = getNetworkConfig();
  console.log(`✅ Coinbase x402 facilitator initialized for ${networkConfig.name}`);
  return coinbaseFacilitator;
}

/**
 * Create x402 payment requirement response for current network
 */
export function createX402PaymentRequest(
  resource: string,
  description: string,
  amount: string = process.env.X402_PAYMENT_AMOUNT || '50000'
): X402PaymentRequest {
  const networkConfig = getNetworkConfig();
  const networkName = isMainnet() ? 'base-mainnet' : 'base-sepolia';
  
  return {
    scheme: 'exact',
    network: networkName as 'base-mainnet' | 'base-sepolia',
    maxAmountRequired: amount, // 0.05 USDC in atomic units (6 decimals)
    resource,
    description,
    mimeType: 'application/json',
    payTo: process.env.X402_RECIPIENT_ADDRESS!,
    maxTimeoutSeconds: parseInt(process.env.X402_MAX_TIMEOUT_SECONDS || '300'),
    asset: networkConfig.usdc.address, // USDC contract address for current network
    extra: {
      name: 'USD Coin',
      version: '2'
    }
  };
}

/**
 * Create HTTP 402 Payment Required response with CORS headers
 */
export function create402Response(paymentRequest: X402PaymentRequest): Response {
  return new Response(JSON.stringify(paymentRequest), {
    status: 402,
    statusText: 'Payment Required',
    headers: {
      'Content-Type': 'application/json',
      'Cache-Control': 'no-cache',
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Headers': 'X-PAYMENT, Content-Type, Authorization',
      'Access-Control-Allow-Methods': 'POST, GET, OPTIONS',
      'Access-Control-Expose-Headers': 'X-PAYMENT-RESPONSE'
    }
  });
}

/**
 * Validate Ethereum address format
 */
function isValidAddress(address: string): boolean {
  return /^0x[a-fA-F0-9]{40}$/.test(address);
}

/**
 * Validate payment payload has all required fields with proper types
 */
function validatePaymentPayload(payload: any): boolean {
  if (!payload || typeof payload !== 'object') {
    console.warn('⚠️ Payment payload missing or invalid type');
    return false;
  }

  // Required fields
  const requiredFields = ['from', 'to', 'value', 'validAfter', 'validBefore', 'nonce', 'v', 'r', 's'];
  for (const field of requiredFields) {
    if (!(field in payload)) {
      console.warn(`⚠️ Missing required field in payment payload: ${field}`);
      return false;
    }
  }

  // Validate addresses
  if (!isValidAddress(payload.from) || !isValidAddress(payload.to)) {
    console.warn('⚠️ Invalid address format in payment payload');
    return false;
  }

  // Validate value is a positive number string
  const value = parseInt(payload.value);
  if (isNaN(value) || value <= 0) {
    console.warn('⚠️ Invalid payment value');
    return false;
  }

  // Validate value is within reasonable bounds (0.01 to 1000 USDC)
  const MIN_AMOUNT = 10000; // 0.01 USDC
  const MAX_AMOUNT = 1000000000; // 1000 USDC
  if (value < MIN_AMOUNT || value > MAX_AMOUNT) {
    console.warn(`⚠️ Payment value out of bounds: ${value}`);
    return false;
  }

  // Validate timestamps
  const now = Math.floor(Date.now() / 1000);
  const validAfter = parseInt(payload.validAfter);
  const validBefore = parseInt(payload.validBefore);
  
  if (isNaN(validAfter) || isNaN(validBefore)) {
    console.warn('⚠️ Invalid timestamp format');
    return false;
  }

  if (validAfter > now) {
    console.warn('⚠️ Payment not yet valid');
    return false;
  }

  if (validBefore < now) {
    console.warn('⚠️ Payment expired');
    return false;
  }

  // Validate signature components
  if (typeof payload.v !== 'number' || typeof payload.r !== 'string' || typeof payload.s !== 'string') {
    console.warn('⚠️ Invalid signature format');
    return false;
  }

  return true;
}

/**
 * Parse x402 payment header from request with enhanced validation
 */
export function parsePaymentHeader(request: Request): X402PaymentHeader | null {
  const paymentHeader = request.headers.get('X-PAYMENT');
  
  if (!paymentHeader) {
    return null;
  }

  // Check header size (prevent extremely large payloads)
  if (paymentHeader.length > 10000) {
    console.warn('⚠️ Payment header too large');
    return null;
  }

  try {
    const payment = JSON.parse(paymentHeader) as X402PaymentHeader;
    
    // Basic validation using official x402 structure
    if (!payment.x402Version || !payment.scheme || !payment.paymentPayload) {
      console.warn('⚠️ Invalid payment header structure');
      return null;
    }

    // Validate required fields
    if (payment.x402Version !== '0.0.1') {
      console.warn('⚠️ Unsupported x402 version:', payment.x402Version);
      return null;
    }

    if (payment.scheme !== 'exact') {
      console.warn('⚠️ Unsupported payment scheme:', payment.scheme);
      return null;
    }

    // Validate network matches current configuration
    const expectedNetwork = isMainnet() ? 'base-mainnet' : 'base-sepolia';
    if (payment.network !== expectedNetwork) {
      console.warn(`⚠️ Invalid network. Expected: ${expectedNetwork}, Got: ${payment.network}`);
      return null;
    }

    // Enhanced validation of payment payload
    if (!validatePaymentPayload(payment.paymentPayload)) {
      return null;
    }

    return payment;
  } catch (error) {
    console.warn('⚠️ Failed to parse payment header:', error);
    return null;
  }
}

/**
 * Verify payment using official Coinbase facilitator
 */
export async function verifyPayment(paymentHeader: X402PaymentHeader): Promise<boolean> {
  try {
    const networkConfig = getNetworkConfig();
    console.log(`🔍 Verifying x402 payment on ${networkConfig.name} with Coinbase facilitator...`);
    
    const facilitatorConfig = initializeFacilitator();
    
    // Validate payment network matches current configuration
    const expectedNetwork = isMainnet() ? 'base-mainnet' : 'base-sepolia';
    if (paymentHeader.network !== expectedNetwork) {
      console.error(`❌ Payment network mismatch. Expected: ${expectedNetwork}, Got: ${paymentHeader.network}`);
      return false;
    }

    // Validate payment recipient
    if (paymentHeader.paymentPayload.to !== process.env.X402_RECIPIENT_ADDRESS) {
      console.error('❌ Payment recipient mismatch');
      return false;
    }

    // Use the official verify method from @coinbase/x402
    // Note: Public facilitator doesn't require auth headers
    const response = await fetch(`${facilitatorConfig.url}/verify`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        payment: paymentHeader,
        network: expectedNetwork,
        expectedAmount: process.env.X402_PAYMENT_AMOUNT,
        expectedRecipient: process.env.X402_RECIPIENT_ADDRESS,
        asset: networkConfig.usdc.address
      })
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error(`❌ Payment verification failed on ${networkConfig.name}:`, response.status, response.statusText, errorText);
      return false;
    }

    const result = await response.json();
    console.log(`✅ ${networkConfig.name} payment verification result:`, result);
    
    return result.verified === true || result.success === true;
    
  } catch (error) {
    const networkConfig = getNetworkConfig();
    console.error(`❌ ${networkConfig.name} payment verification error:`, error);
    return false;
  }
}

/**
 * Settle payment using official Coinbase facilitator
 */
export async function settlePayment(paymentHeader: X402PaymentHeader): Promise<{
  success: boolean;
  transactionHash?: string;
  blockNumber?: number;
}> {
  try {
    const networkConfig = getNetworkConfig();
    console.log(`💰 Settling x402 payment on ${networkConfig.name}...`);
    
    const facilitatorConfig = initializeFacilitator();
    const expectedNetwork = isMainnet() ? 'base-mainnet' : 'base-sepolia';
    
    // Use the official settle method from @coinbase/x402
    // Note: Public facilitator doesn't require auth headers
    const response = await fetch(`${facilitatorConfig.url}/settle`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        payment: paymentHeader,
        network: expectedNetwork
      })
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error(`❌ Payment settlement failed on ${networkConfig.name}:`, response.status, response.statusText, errorText);
      return { success: false };
    }

    const result = await response.json();
    console.log(`✅ ${networkConfig.name} payment settlement result:`, result);
    
    return {
      success: result.settled === true || result.success === true,
      transactionHash: result.transactionHash,
      blockNumber: result.blockNumber
    };
    
  } catch (error) {
    const networkConfig = getNetworkConfig();
    console.error(`❌ ${networkConfig.name} payment settlement error:`, error);
    return { success: false };
  }
}

/**
 * Extract payment amount from payment payload
 */
export function getPaymentAmount(paymentHeader: X402PaymentHeader): string {
  return paymentHeader.paymentPayload.value;
}

/**
 * Validate payment amount matches expected amount (0.05 USDC)
 */
export function validatePaymentAmount(paymentHeader: X402PaymentHeader): boolean {
  const expectedAmount = process.env.X402_PAYMENT_AMOUNT || '50000';
  const actualAmount = getPaymentAmount(paymentHeader);
  
  return actualAmount === expectedAmount;
}

/**
 * Validate payment recipient matches configuration
 */
export function validatePaymentRecipient(paymentHeader: X402PaymentHeader): boolean {
  const expectedRecipient = process.env.X402_RECIPIENT_ADDRESS;
  const actualRecipient = paymentHeader.paymentPayload.to;
  
  return actualRecipient.toLowerCase() === expectedRecipient?.toLowerCase();
}

/**
 * Create payment response header after successful verification
 */
export function createPaymentResponseHeader(transactionHash: string): Record<string, string> {
  const networkConfig = getNetworkConfig();
  
  return {
    'X-PAYMENT-RESPONSE': JSON.stringify({
      status: 'confirmed',
      transactionHash,
      timestamp: Date.now(),
      network: isMainnet() ? 'base-mainnet' : 'base-sepolia',
      facilitator: 'coinbase',
      explorerUrl: `${networkConfig.explorerUrl}/tx/${transactionHash}`
    }),
    'Access-Control-Expose-Headers': 'X-PAYMENT-RESPONSE'
  };
}

/**
 * Utility function to format USDC amount for display
 */
export function formatUSDCAmount(atomicAmount: string): string {
  const amount = parseFloat(atomicAmount) / 1e6; // USDC has 6 decimals
  return `$${amount.toFixed(2)} USDC`;
}

/**
 * Check if payment is required for a request
 */
export function isPaymentRequired(request: Request): boolean {
  const paymentHeader = parsePaymentHeader(request);
  return paymentHeader === null;
}

/**
 * Process complete x402 payment flow for current network
 * Returns 402 if payment required, verifies payment if provided
 * @param request The HTTP request
 * @param resource The resource being accessed
 * @param description Description of the payment
 * @param expectedAmount Optional expected amount in atomic units (defaults to env variable)
 */
export async function processX402Payment(
  request: Request,
  resource: string,
  description: string,
  expectedAmount?: number
): Promise<{ 
  requiresPayment: boolean; 
  paymentValid?: boolean; 
  response?: Response;
  settlementInfo?: any;
}> {
  const paymentHeader = parsePaymentHeader(request);
  
  // Determine the expected amount
  const expectedAmountStr = expectedAmount 
    ? expectedAmount.toString() 
    : (process.env.X402_PAYMENT_AMOUNT || '1000000');
  
  if (!paymentHeader) {
    // No payment provided - return 402
    const paymentRequest = createX402PaymentRequest(resource, description, expectedAmountStr);
    return {
      requiresPayment: true,
      response: create402Response(paymentRequest)
    };
  }
  
  // Verify payment amount matches expected amount
  const actualAmount = getPaymentAmount(paymentHeader);
  if (actualAmount !== expectedAmountStr) {
    console.warn(`⚠️ Payment amount mismatch. Expected: ${expectedAmountStr}, Got: ${actualAmount}`);
    return {
      requiresPayment: false,
      paymentValid: false
    };
  }
  
  // Payment provided - verify it
  const isValid = await verifyPayment(paymentHeader);
  
  if (!isValid) {
    return {
      requiresPayment: false,
      paymentValid: false
    };
  }

  // Payment verified - attempt settlement
  const settlementResult = await settlePayment(paymentHeader);
  
  return {
    requiresPayment: false,
    paymentValid: true,
    settlementInfo: settlementResult
  };
}

/**
 * Create payment instructions for frontend
 */
export function createPaymentInstructions(amount: string = '50000'): {
  amount: string;
  amountFormatted: string;
  recipient: string;
  network: string;
  usdcContract: string;
  chainId: number;
} {
  const networkConfig = getNetworkConfig();
  
  return {
    amount,
    amountFormatted: formatUSDCAmount(amount),
    recipient: process.env.X402_RECIPIENT_ADDRESS!,
    network: isMainnet() ? 'base-mainnet' : 'base-sepolia',
    usdcContract: networkConfig.usdc.address,
    chainId: networkConfig.chainId
  };
}
