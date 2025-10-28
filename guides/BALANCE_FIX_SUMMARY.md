# Balance Display Fix - EOA Wallet Support

## Problem
After switching from Smart Wallet to EOA (Externally Owned Account) mode for the embedded wallet, token balances were no longer displaying in the WalletDropdown component.

## Root Cause
The `WalletDropdown` component was using `evmAddress` from the CDP hook `useEvmAddress()` to fetch token balances. However:

- **Smart Wallet Mode**: `evmAddress` returns the Smart Wallet address
- **EOA Mode**: The app now uses the EOA address (the owner account), but `evmAddress` was still returning the Smart Wallet address
- **Result**: Balance queries were hitting the wrong address (Smart Wallet) instead of the actual EOA address where funds are held

## Solution
Updated the balance fetching logic in `WalletDropdown.tsx` to:

1. **Use EOA address for embedded wallets**: When fetching balances for embedded wallets, the component now uses `eoaAddress` from the `WalletProvider` context instead of `evmAddress` from CDP hooks
2. **Keep external wallet behavior**: For external wallets (like MetaMask), continue using `evmAddress` since it's the same as the EOA
3. **Update address for Send tab**: Also fixed the address passed to `SendTab` to use EOA for embedded wallets

## Changes Made

### 1. Balance Fetching Logic (`WalletDropdown.tsx` - lines ~158-191)
```typescript
if (activeChain === 'ethereum') {
  // ✅ For embedded wallets, use EOA address (not smart account address)
  // For external wallets, use evmAddress (they're the same anyway)
  const addressToQuery = connectedWalletType === 'embedded' 
    ? (eoaAddress || evmAddress)  // Prefer EOA for embedded wallets
    : evmAddress;                  // Use evmAddress for external wallets
  
  if (addressToQuery) {
    console.log('🔍 Fetching balances for:', { 
      walletType: connectedWalletType, 
      address: addressToQuery,
      isEOA: connectedWalletType === 'embedded' && addressToQuery === eoaAddress
    });
    tokenBalances = await getTokenBalances(addressToQuery);
  }
}
```

### 2. Current Address Determination (lines ~76-83)
```typescript
// Determine current address based on active chain and wallet type
// For embedded wallets on Ethereum, use EOA address (not smart account)
const currentAddress = activeChain === 'ethereum' 
  ? (connectedWalletType === 'embedded' ? (eoaAddress || evmAddress) : evmAddress)
  : solanaAddress;
```

## How It Works Now

### For Embedded Wallets (CDP):
1. **Display Address**: Shows `eoaAddress` (the owner account)
2. **Balance Queries**: Uses `eoaAddress` to fetch token balances
3. **Send Tab**: Receives `eoaAddress` as the user's address
4. **Transaction Signing**: Uses EOA for signing (already implemented)

### For External Wallets (MetaMask, etc.):
1. **Display Address**: Shows `evmAddress` (same as EOA)
2. **Balance Queries**: Uses `evmAddress` to fetch token balances
3. **Send Tab**: Receives `evmAddress` as the user's address

## Testing
1. Connect with an embedded wallet
2. Verify the correct EOA address is displayed in the dropdown
3. Check that token balances appear in the Assets tab
4. Verify the Send tab works correctly with the EOA address
5. Console logs will show which address is being used for balance queries

## Related Files
- `/src/components/wallet/WalletDropdown.tsx` - Main fix location
- `/src/components/wallet/WalletProvider.tsx` - Provides `eoaAddress` context
- `/src/app/actions/token-balances.ts` - Server action that fetches balances (no changes needed)

## Debug Information
The fix includes console logging to help verify the correct address is being used:
```
🔍 Fetching balances for: {
  walletType: 'embedded',
  address: '0x...',
  isEOA: true
}
```
