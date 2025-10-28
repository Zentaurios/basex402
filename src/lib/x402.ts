import { facilitator } from '@coinbase/x402';
import type { X402PaymentRequest, X402PaymentHeader } from '@/types';
import { getNetworkConfig, isMainnet } from './network-config';
import { generateJwt } from '@coinbase/cdp-sdk/auth';

/**
 * Official x402 Protocol Implementation using environment variables
 * Supports both Base and Sepolia based on configuration
 */

// Initialize the official Coinbase facilitator
let coinbaseFacilitator: typeof facilitator;

const COINBASE_FACILITATOR_BASE_URL = 'https://api.cdp.coinbase.com';
const COINBASE_FACILITATOR_V2_ROUTE = '/platform/v2/x402';

/**
 * Create CDP authentication header using JWT
 */
async function createCDPAuthHeader(
  method: string,
  path: string
): Promise<string> {
  const apiKeyId = process.env.CDP_API_KEY_ID;
  const apiKeySecret = process.env.CDP_API_KEY_SECRET;
  
  if (!apiKeyId || !apiKeySecret) {
    throw new Error('CDP API keys not configured');
  }
  
  const requestHost = COINBASE_FACILITATOR_BASE_URL.replace('https://', '');
  
  const jwt = await generateJwt({
    apiKeyId,
    apiKeySecret,
    requestMethod: method,
    requestHost,
    requestPath: path,
  });
  
  return `Bearer ${jwt}`;
}

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
  const networkName = isMainnet() ? 'base' : 'base-sepolia';
  
  return {
    scheme: 'exact',
    network: networkName as 'base' | 'base-sepolia',
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

  // Required fields (v, r, s are now in the signature field, not here)
  const requiredFields = ['from', 'to', 'value', 'validAfter', 'validBefore', 'nonce'];
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
    
    // Basic validation using CDP x402 structure
    if (!payment.x402Version || !payment.scheme || !payment.payload) {
      console.warn('⚠️ Invalid payment header structure');
      return null;
    }

    // Validate required fields
    if (payment.x402Version !== 1) {
      console.warn('⚠️ Unsupported x402 version:', payment.x402Version);
      return null;
    }

    if (payment.scheme !== 'exact') {
      console.warn('⚠️ Unsupported payment scheme:', payment.scheme);
      return null;
    }

    // Validate network matches current configuration
    const expectedNetwork = isMainnet() ? 'base' : 'base-sepolia';
    if (payment.network !== expectedNetwork) {
      console.warn(`⚠️ Invalid network. Expected: ${expectedNetwork}, Got: ${payment.network}`);
      return null;
    }

    // Enhanced validation of payment payload
    if (!payment.payload.authorization || !payment.payload.signature) {
      console.warn('⚠️ Missing authorization or signature in payload');
      return null;
    }
    
    if (!validatePaymentPayload(payment.payload.authorization)) {
      return null;
    }

    return payment;
  } catch (error) {
    console.warn('⚠️ Failed to parse payment header:', error);
    return null;
  }
}

/**
 * Verify payment using Coinbase facilitator
 * The facilitator validates the EIP-3009 signature
 */
export async function verifyPayment(
  paymentHeader: X402PaymentHeader,
  paymentRequest: X402PaymentRequest
): Promise<boolean> {
  try {
    const networkConfig = getNetworkConfig();
    console.log(`🔍 Verifying x402 payment on ${networkConfig.name} using facilitator...`);
    
    // Validate payment network matches current configuration
    const expectedNetwork = isMainnet() ? 'base' : 'base-sepolia';
    if (paymentHeader.network !== expectedNetwork) {
      console.error(`❌ Payment network mismatch. Expected: ${expectedNetwork}, Got: ${paymentHeader.network}`);
      return false;
    }

    // Validate payment recipient
    if (paymentHeader.payload.authorization.to.toLowerCase() !== process.env.X402_RECIPIENT_ADDRESS?.toLowerCase()) {
      console.error('❌ Payment recipient mismatch');
      return false;
    }

    // Create authentication header
    const verifyPath = `${COINBASE_FACILITATOR_V2_ROUTE}/verify`;
    const authHeader = await createCDPAuthHeader('POST', verifyPath);
    
    // Send in CDP facilitator format
    const requestBody = {
      x402Version: 1,
      paymentPayload: paymentHeader,
      paymentRequirements: paymentRequest, // CDP expects "paymentRequirements" not "paymentDetails"
    };
    
    // Log what we're sending for debugging
    console.log('📤 Sending to facilitator verify:', JSON.stringify(requestBody, null, 2));
    
    // Call facilitator verify endpoint with authentication
    const response = await fetch(`${COINBASE_FACILITATOR_BASE_URL}${verifyPath}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': authHeader,
        'Correlation-Context': 'sdk_version=1.29.0,sdk_language=typescript,source=x402,source_version=0.6.5',
      },
      body: JSON.stringify(requestBody)
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error(`❌ Payment verification failed on ${networkConfig.name}:`, response.status, response.statusText, errorText);
      return false;
    }

    const result = await response.json();
    console.log(`✅ ${networkConfig.name} payment verification result:`, result);
    
    // CDP API v2 returns 'isValid' field
    return result.isValid === true || result.verified === true || result.success === true;
    
  } catch (error) {
    const networkConfig = getNetworkConfig();
    console.error(`❌ ${networkConfig.name} payment verification error:`, error);
    return false;
  }
}

/**
 * Settle payment using Coinbase facilitator
 * The facilitator executes the USDC transfer on-chain
 */
export async function settlePayment(
  paymentHeader: X402PaymentHeader,
  paymentRequest: X402PaymentRequest
): Promise<{
  success: boolean;
  transactionHash?: string;
  blockNumber?: number;
  error?: string;
}> {
  try {
    const networkConfig = getNetworkConfig();
    console.log(`💰 Settling x402 payment on ${networkConfig.name}...`);
    
    // Create authentication header
    const settlePath = `${COINBASE_FACILITATOR_V2_ROUTE}/settle`;
    const authHeader = await createCDPAuthHeader('POST', settlePath);
    
    // Send in CDP facilitator format
    const requestBody = {
      x402Version: 1,
      paymentPayload: paymentHeader,
      paymentRequirements: paymentRequest, // CDP expects "paymentRequirements" not "paymentDetails"
    };
    
    // Log what we're sending for debugging
    console.log('📤 Sending to facilitator settle:', JSON.stringify(requestBody, null, 2));
    
    // Call facilitator settle endpoint with authentication
    const response = await fetch(`${COINBASE_FACILITATOR_BASE_URL}${settlePath}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': authHeader,
        'Correlation-Context': 'sdk_version=1.29.0,sdk_language=typescript,source=x402,source_version=0.6.5',
      },
      body: JSON.stringify(requestBody)
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error(`❌ Payment settlement failed on ${networkConfig.name}:`, response.status, response.statusText, errorText);
      return { 
        success: false,
        error: errorText 
      };
    }

    const result = await response.json();
    console.log(`✅ ${networkConfig.name} payment settlement result:`, result);
    
    // CDP API v2 may return different success indicators
    const isSettled = result.isSettled === true || result.settled === true || result.success === true;
    
    return {
      success: isSettled,
      transactionHash: result.transaction || result.transactionHash || result.txHash,
      blockNumber: result.blockNumber,
      error: !isSettled ? (result.error || result.message || 'Unknown settlement error') : undefined
    };
    
  } catch (error) {
    const networkConfig = getNetworkConfig();
    console.error(`❌ ${networkConfig.name} payment settlement error:`, error);
    return { 
      success: false,
      error: error instanceof Error ? error.message : 'Unknown settlement error'
    };
  }
}

/**
 * Extract payment amount from payment payload
 */
export function getPaymentAmount(paymentHeader: X402PaymentHeader): string {
  return paymentHeader.payload.authorization.value;
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
  const actualRecipient = paymentHeader.payload.authorization.to;
  
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
      network: isMainnet() ? 'base' : 'base-sepolia',
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
 * Verify payment WITHOUT settling (for verify-first flow)
 * This allows checking payment validity before performing actions
 * @param request The HTTP request
 * @param resource The resource being accessed
 * @param description Description of the payment
 * @param expectedAmount Optional expected amount in atomic units
 */
export async function verifyX402Payment(
  request: Request,
  resource: string,
  description: string,
  expectedAmount?: number
): Promise<{ 
  requiresPayment: boolean; 
  paymentValid?: boolean; 
  response?: Response;
  paymentHeader?: X402PaymentHeader;
  paymentRequest?: X402PaymentRequest;
}> {
  const paymentHeader = parsePaymentHeader(request);
  
  // Determine the expected amount
  const expectedAmountStr = expectedAmount 
    ? expectedAmount.toString() 
    : (process.env.X402_PAYMENT_AMOUNT || '1000000');
  
  // Create the payment request (needed for both 402 response and verification)
  const paymentRequest = createX402PaymentRequest(resource, description, expectedAmountStr);
  
  if (!paymentHeader) {
    // No payment provided - return 402
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
  
  // Payment provided - verify it with BOTH paymentHeader AND paymentRequest
  console.log('🔐 Starting payment verification (NOT settling yet)...');
  const isValid = await verifyPayment(paymentHeader, paymentRequest);
  console.log(`🔐 Verification result: ${isValid}`);
  
  if (!isValid) {
    console.error('❌ Verification failed');
    return {
      requiresPayment: false,
      paymentValid: false
    };
  }

  console.log('✅ Payment verified (settlement pending until action completes)');
  
  return {
    requiresPayment: false,
    paymentValid: true,
    paymentHeader: paymentHeader,
    paymentRequest: paymentRequest
  };
}

/**
 * Process complete x402 payment flow for current network
 * Returns 402 if payment required, verifies payment if provided
 * 
 * ⚠️ DEPRECATED: Use verifyX402Payment + settlePayment instead for critical operations
 * This function settles BEFORE the action completes, which can cause payment without delivery
 * 
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
  paymentHeader?: X402PaymentHeader;
}> {
  const paymentHeader = parsePaymentHeader(request);
  
  // Determine the expected amount
  const expectedAmountStr = expectedAmount 
    ? expectedAmount.toString() 
    : (process.env.X402_PAYMENT_AMOUNT || '1000000');
  
  // Create the payment request (needed for both 402 response and verification)
  const paymentRequest = createX402PaymentRequest(resource, description, expectedAmountStr);
  
  if (!paymentHeader) {
    // No payment provided - return 402
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
  
  // Payment provided - verify it with BOTH paymentHeader AND paymentRequest
  console.log('🔐 Starting payment verification...');
  const isValid = await verifyPayment(paymentHeader, paymentRequest);
  console.log(`🔐 Verification result: ${isValid}`);
  
  if (!isValid) {
    console.error('❌ Verification failed, stopping payment flow');
    return {
      requiresPayment: false,
      paymentValid: false
    };
  }

  // Payment verified - attempt settlement with BOTH paymentHeader AND paymentRequest
  console.log('💰 Verification passed, proceeding to settlement...');
  const settlementResult = await settlePayment(paymentHeader, paymentRequest);
  console.log('💰 Settlement completed with result:', settlementResult);
  
  // CRITICAL SECURITY: Settlement must succeed before allowing mint
  if (!settlementResult.success) {
    console.error('❌ Payment settlement failed - refusing to mint');
    console.error('❌ Settlement error details:', settlementResult);
    return {
      requiresPayment: false,
      paymentValid: false,  // Mark as invalid if settlement failed
      settlementInfo: settlementResult,
      paymentHeader: paymentHeader
    };
  }
  
  console.log('✅ Payment verified AND settled successfully');
  
  return {
    requiresPayment: false,
    paymentValid: true,
    settlementInfo: settlementResult,
    paymentHeader: paymentHeader
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
    network: isMainnet() ? 'base' : 'base-sepolia',
    usdcContract: networkConfig.usdc.address,
    chainId: networkConfig.chainId
  };
}
