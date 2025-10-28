/**
 * Comprehensive wallet storage clearing utility
 * Handles wagmi, Coinbase Wallet SDK, OnchainKit, and WalletConnect storage
 */

/**
 * Disconnect from Phantom wallet provider directly
 * This prevents Phantom from auto-reconnecting on page reload
 */
export async function disconnectPhantom(): Promise<void> {
  if (typeof window === 'undefined') return;
  
  try {
    const phantom = (window as any).phantom;
    
    if (!phantom?.ethereum) {
      console.log('No Phantom provider found');
      return;
    }
    
    console.log('👻 Attempting to disconnect from Phantom...');
    
    let disconnected = false;
    
    // Try multiple disconnect methods
    try {
      // Method 1: Standard disconnect
      if (typeof phantom.ethereum.disconnect === 'function') {
        await phantom.ethereum.disconnect();
        console.log('✅ Phantom disconnected via .disconnect()');
        disconnected = true;
      }
    } catch (err) {
      console.warn('Phantom .disconnect() failed:', err);
    }
    
    try {
      // Method 2: Request disconnection via wallet_revokePermissions
      if (typeof phantom.ethereum.request === 'function') {
        await phantom.ethereum.request({
          method: 'wallet_revokePermissions',
          params: [{ eth_accounts: {} }]
        });
        console.log('✅ Phantom permissions revoked');
      }
    } catch (err) {
      // This method might not be supported, that's ok
      console.warn('Phantom wallet_revokePermissions not supported:', err);
    }
    
    // Clear any Phantom event listeners
    if (phantom.ethereum.removeAllListeners) {
      phantom.ethereum.removeAllListeners();
      console.log('✅ Phantom listeners cleared');
    }
    
    // Force clear the connected state
    if (phantom.ethereum._state) {
      phantom.ethereum._state = {};
    }
    
    if (!disconnected) {
      console.warn('⚠️ Phantom disconnect methods not available');
    }
    
  } catch (error) {
    console.error('Failed to disconnect from Phantom:', error);
  }
}

/**
 * Check if a wallet address is blocked from connecting
 * Currently disabled - no wallets are blocked
 */
export function isBlockedWallet(address: string | undefined): boolean {
  // No wallets are currently blocked
  return false;
}

/**
 * Clear ALL wallet-related storage including connector-specific data
 * This includes: wagmi, Coinbase Wallet SDK, OnchainKit, WalletConnect, and connector caches
 */
export function clearAllWalletStorage(): void {
  if (typeof window === 'undefined') return;
  
  try {
    const keys = Object.keys(localStorage);
    let clearedCount = 0;
    
    // All wallet-related storage key patterns
    const walletKeyPatterns = [
      // Wagmi and connectors
      'wagmi.',
      '@@wagmi',
      'recentConnectorId',
      'connector.',
      'injected.',
      'metaMask.',
      'phantom.',
      
      // Coinbase Wallet SDK
      'walletlink:',
      '-walletlink:',
      'cbw:',
      'CoinbaseWalletSDK:',
      'CoinbaseWallet:',
      'CoinbaseWalletEIP6963',
      'Coinbase',
      
      // OnchainKit
      'onchainkit:',
      'onchainkit.',
      'ock:',
      'ock.',
      
      // WalletConnect
      'wc@',
      'WALLETCONNECT_',
      'walletconnect',
      
      // Phantom
      'phantom',
      'solana',
      
      // MetaMask
      'metamask',
      'MetaMask',
      
      // Generic wallet keys
      'wallet.connected',
      'wallet_',
      'eth_',
      'ethereum.',
    ];
    
    // Remove all matching keys
    keys.forEach(key => {
      const shouldRemove = walletKeyPatterns.some(pattern => 
        key.includes(pattern) || key.startsWith(pattern)
      );
      
      if (shouldRemove) {
        try {
          localStorage.removeItem(key);
          console.log('🧹 Cleared storage key:', key);
          clearedCount++;
        } catch (err) {
          console.error('Failed to remove key:', key, err);
        }
      }
    });
    
    // Also clear sessionStorage
    const sessionKeys = Object.keys(sessionStorage);
    sessionKeys.forEach(key => {
      const shouldRemove = walletKeyPatterns.some(pattern => 
        key.includes(pattern) || key.startsWith(pattern)
      );
      
      if (shouldRemove) {
        try {
          sessionStorage.removeItem(key);
          console.log('🧹 Cleared session storage key:', key);
          clearedCount++;
        } catch (err) {
          console.error('Failed to remove session key:', key, err);
        }
      }
    });
    
    console.log(`✅ Cleared ${clearedCount} wallet storage keys`);
  } catch (error) {
    console.error('Error clearing wallet storage:', error);
  }
}

/**
 * Clear ONLY wagmi-related storage (backward compatibility)
 */
export function clearWagmiStorage(): void {
  if (typeof window === 'undefined') return;
  
  try {
    const keys = Object.keys(localStorage);
    
    const wagmiKeys = keys.filter(key => 
      key.startsWith('wagmi.') || 
      key.startsWith('@@wagmi') ||
      key.includes('wagmi') ||
      key === 'recentConnectorId' ||
      key === 'wallet.connected' ||
      key.includes('connector.') ||
      key.includes('injected.')
    );
    
    wagmiKeys.forEach(key => {
      try {
        localStorage.removeItem(key);
        console.log('🧹 Cleared wagmi storage key:', key);
      } catch (err) {
        console.error('Failed to remove key:', key, err);
      }
    });
    
    console.log('✅ Cleared', wagmiKeys.length, 'wagmi storage keys');
  } catch (error) {
    console.error('Error clearing wagmi storage:', error);
  }
}

/**
 * Emergency function to completely reset wallet state
 * Clears ALL wallet storage (wagmi + Coinbase SDK + OnchainKit + WalletConnect + connectors)
 */
export function emergencyWalletReset(): void {
  console.warn('🚨 EMERGENCY WALLET RESET - Clearing ALL wallet storage');
  
  clearAllWalletStorage();
  
  // Also try to disconnect Phantom
  disconnectPhantom().catch(console.error);
  
  // Force reload after a brief delay to ensure cleanup completes
  setTimeout(() => {
    window.location.reload();
  }, 500);
}

/**
 * List all wallet-related storage keys (for debugging)
 */
export function listWalletStorage(): string[] {
  if (typeof window === 'undefined') return [];
  
  const keys = Object.keys(localStorage);
  const walletKeyPatterns = [
    'wagmi', 'walletlink', 'cbw', 'CoinbaseWallet', 'onchainkit', 'ock',
    'wc@', 'WALLETCONNECT', 'wallet', 'eth_', 'ethereum', 'connector',
    'injected', 'metamask', 'phantom'
  ];
  
  const walletKeys = keys.filter(key => 
    walletKeyPatterns.some(pattern => 
      key.toLowerCase().includes(pattern.toLowerCase())
    )
  );
  
  console.log('📋 Found', walletKeys.length, 'wallet-related storage keys:');
  walletKeys.forEach(key => console.log('  -', key));
  
  return walletKeys;
}

/**
 * Make functions available in browser console for debugging
 */
if (typeof window !== 'undefined') {
  (window as any).emergencyWalletReset = emergencyWalletReset;
  (window as any).clearAllWalletStorage = clearAllWalletStorage;
  (window as any).clearWagmiStorage = clearWagmiStorage;
  (window as any).listWalletStorage = listWalletStorage;
  (window as any).disconnectPhantom = disconnectPhantom;
  (window as any).checkBlockedWallet = (address: string) => {
    const blocked = isBlockedWallet(address);
    console.log(`Wallet ${address} is ${blocked ? '🚫 BLOCKED' : '✅ allowed'}`);
    return blocked;
  };
  
  console.log('💡 Wallet debug functions available:');
  console.log('  - window.emergencyWalletReset() - Full reset (ALL wallets) and reload');
  console.log('  - window.clearAllWalletStorage() - Clear ALL wallet storage (no reload)');
  console.log('  - window.clearWagmiStorage() - Clear only wagmi storage');
  console.log('  - window.listWalletStorage() - List all wallet storage keys');
  console.log('  - window.disconnectPhantom() - Force disconnect Phantom');
  console.log('  - window.checkBlockedWallet(address) - Check if wallet is blocked');
}
