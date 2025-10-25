import { 
  initialize, 
  isSignedIn, 
  getCurrentUser,
  type Config,
  type User
} from '@coinbase/cdp-core';
import type { WalletInfo } from '@/types';

/**
 * Official Embedded Wallets Implementation using CDP Core v0.0.31
 * Updated to use the official Coinbase Embedded Wallets beta
 */

let isInitialized = false;

/**
 * Initialize the CDP Core SDK for Embedded Wallets
 */
export async function initializeEmbeddedWallets(): Promise<void> {
  if (isInitialized) {
    return;
  }

  try {
    const config: Config = {
      projectId: process.env.NEXT_PUBLIC_CDP_PROJECT_ID!,
      ethereum: {
        createOnLogin: 'eoa' // Create EOA (Externally Owned Account) on login
      },
      solana: {
        createOnLogin: false
      }
    };

    await initialize(config);
    isInitialized = true;
    console.log('✅ Embedded Wallets initialized successfully');
  } catch (error) {
    console.error('❌ Failed to initialize Embedded Wallets:', error);
    throw new Error(`Embedded Wallets initialization failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
}

/**
 * Check if user is currently signed in
 */
export async function checkUserSignedIn(): Promise<boolean> {
  try {
    if (!isInitialized) {
      await initializeEmbeddedWallets();
    }
    
    return await isSignedIn();
  } catch (error) {
    console.error('❌ Failed to check sign-in status:', error);
    return false;
  }
}

/**
 * Get current user information
 */
export async function getCurrentUserInfo(): Promise<User | null> {
  try {
    const signedIn = await checkUserSignedIn();
    if (!signedIn) {
      return null;
    }

    const user = await getCurrentUser();
    console.log('👤 Current user:', {
      userId: user?.userId,
      evmAccounts: user?.evmAccounts?.length ?? 0,
      smartAccounts: user?.evmSmartAccounts?.length ?? 0
    });
    
    return user;
  } catch (error) {
    console.error('❌ Failed to get current user:', error);
    return null;
  }
}

/**
 * Sign in user with email OTP
 * NOTE: signIn is not available in current CDP version
 * TODO: Update when CDP SDK provides signIn functionality
 */
export async function signInWithEmail(email: string): Promise<boolean> {
  console.warn('signInWithEmail not implemented - signIn not available in current CDP version');
  return false;
}

/**
 * Sign in user with SMS OTP
 * NOTE: signIn is not available in current CDP version
 * TODO: Update when CDP SDK provides signIn functionality
 */
export async function signInWithSMS(phoneNumber: string): Promise<boolean> {
  console.warn('signInWithSMS not implemented - signIn not available in current CDP version');
  return false;
}

/**
 * Sign out current user
 * NOTE: signOut is not available in current CDP version
 * TODO: Update when CDP SDK provides signOut functionality
 */
export async function signOutUser(): Promise<void> {
  console.warn('signOutUser not implemented - signOut not available in current CDP version');
}

/**
 * Get wallet information for display
 */
export async function getWalletInfo(): Promise<WalletInfo | null> {
  try {
    const user = await getCurrentUserInfo();
    if (!user) {
      return null;
    }

    // Get the first available account (prefer smart accounts)
    const account = (user.evmSmartAccounts && user.evmSmartAccounts.length > 0)
      ? user.evmSmartAccounts[0] 
      : (user.evmAccounts && user.evmAccounts[0]);

    if (!account) {
      console.warn('⚠️ No accounts found for user');
      return null;
    }

    const walletInfo: WalletInfo = {
      address: typeof account === 'string' ? account : account,
      balance: '0', // TODO: Implement balance fetching
      network: process.env.NEXT_PUBLIC_ENABLE_MAINNET === 'true' ? 'base-mainnet' : 'base-sepolia',
      isConnected: true
    };

    return walletInfo;
  } catch (error) {
    console.error('❌ Failed to get wallet info:', error);
    return null;
  }
}

/**
 * Create a payment authorization for x402
 */
export async function createPaymentAuthorization(
  paymentRequest: any
): Promise<string | null> {
  try {
    const user = await getCurrentUserInfo();
    if (!user) {
      throw new Error('User not signed in');
    }

    // Get the appropriate account
    const account = (user.evmSmartAccounts && user.evmSmartAccounts.length > 0)
      ? user.evmSmartAccounts[0] 
      : (user.evmAccounts && user.evmAccounts[0]);

    if (!account) {
      throw new Error('No accounts available');
    }

    // Create the payment transaction
    const transaction = {
      to: paymentRequest.asset, // USDC contract address
      value: 0n, // ERC-20 transfer has 0 ETH value
      data: encodeTransferData(paymentRequest.payTo, paymentRequest.maxAmountRequired),
      chainId: process.env.NEXT_PUBLIC_BASE_SEPOLIA_CHAIN_ID ? parseInt(process.env.NEXT_PUBLIC_BASE_SEPOLIA_CHAIN_ID) : 84532
    };

    // TODO: Use the official CDP method to create payment authorization
    // This would involve signing the transaction with the embedded wallet
    console.log('💳 Creating payment authorization for:', paymentRequest);
    
    // For now, return a placeholder - this would be implemented with the actual
    // CDP signing methods once we have the full API documentation
    return 'payment-authorization-placeholder';
    
  } catch (error) {
    console.error('❌ Failed to create payment authorization:', error);
    return null;
  }
}

/**
 * Helper function to encode ERC-20 transfer data
 */
function encodeTransferData(to: string, amount: string): string {
  // ERC-20 transfer function signature: transfer(address,uint256)
  const functionSignature = '0xa9059cbb';
  
  // Pad address to 32 bytes
  const addressPadded = to.replace('0x', '').padStart(64, '0');
  
  // Pad amount to 32 bytes
  const amountBigInt = BigInt(amount);
  const amountPadded = amountBigInt.toString(16).padStart(64, '0');
  
  return functionSignature + addressPadded + amountPadded;
}

/**
 * Get user's USDC balance (if available)
 */
export async function getUSDCBalance(): Promise<string> {
  try {
    const user = await getCurrentUserInfo();
    if (!user) {
      return '0';
    }

    // TODO: Implement actual balance fetching using CDP APIs
    // This would require additional CDP SDK methods for token balance queries
    console.log('💰 Fetching USDC balance...');
    
    return '0'; // Placeholder
  } catch (error) {
    console.error('❌ Failed to get USDC balance:', error);
    return '0';
  }
}

/**
 * Fund wallet with testnet USDC (if available)
 */
export async function fundWalletWithUSDC(): Promise<boolean> {
  try {
    const user = await getCurrentUserInfo();
    if (!user) {
      throw new Error('User not signed in');
    }

    // TODO: Implement testnet USDC funding
    // This might involve calling a faucet or using CDP's funding methods
    console.log('💧 Funding wallet with testnet USDC...');
    
    return true; // Placeholder
  } catch (error) {
    console.error('❌ Failed to fund wallet:', error);
    return false;
  }
}

/**
 * Export wallet for user (self-custody feature)
 */
export async function exportWallet(): Promise<string | null> {
  try {
    const user = await getCurrentUserInfo();
    if (!user) {
      throw new Error('User not signed in');
    }

    // TODO: Implement wallet export using CDP APIs
    // This would provide the user with their seed phrase or private key
    console.log('📤 Exporting wallet for user...');
    
    return null; // Placeholder - would return seed phrase or export data
  } catch (error) {
    console.error('❌ Failed to export wallet:', error);
    return null;
  }
}
