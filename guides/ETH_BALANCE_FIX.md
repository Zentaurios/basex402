# Balance Display Fix - ETH & EOA Support

## Problem
After switching from Smart Wallet to EOA (Externally Owned Account) mode for the embedded wallet:
1. USDC balance was showing but ETH balance was missing
2. Token balances were not displaying correctly

## Root Causes

### Issue 1: Wrong Address for Balance Queries
The `WalletDropdown` component was using `evmAddress` from the CDP hook to fetch token balances, but after switching to EOA mode, it should use the EOA address instead.

### Issue 2: ETH Still on Smart Account
When using Smart Accounts, native ETH was stored on the Smart Account address. After switching to EOA mode:
- **ERC-20 tokens (USDC, etc.)**: Moved to or already on the EOA address ✅
- **Native ETH**: Still on the Smart Account address ❌

This is why USDC showed up but ETH didn't!

## Solution

### Part 1: Use EOA Address for Token Queries
Updated balance fetching to use `eoaAddress` from WalletProvider context for embedded wallets.

### Part 2: Check Both Addresses for Native ETH
For embedded wallets, the component now:
1. ✅ Fetches token balances (ERC-20 + ETH) from the EOA address
2. 🔥 **ALSO** checks the Smart Account address for native ETH
3. 💰 Combines ETH from both addresses into a single balance display

## Changes Made

### 1. New Server Action: `eth-balance.ts`
Created a helper function to fetch native ETH balance from any address:
```typescript
export async function getEthBalance(address: string): Promise<string>
```

### 2. Updated WalletDropdown Balance Fetching
The component now:
- Fetches ERC-20 tokens from EOA
- Fetches ETH from EOA (via `getTokenBalances`)
- **Additionally** fetches ETH from Smart Account
- Combines both ETH balances for display

```typescript
// Fetch token balances from EOA
tokenBalances = await getTokenBalances(addressToQuery);

// For embedded wallets, also check Smart Account for ETH
if (connectedWalletType === 'embedded' && smartAccountAddress && smartAccountAddress !== eoaAddress) {
  const smartAccountEth = await getEthBalance(smartAccountAddress);
  
  if (smartAccountEth && smartAccountEth !== '0') {
    // Combine with EOA ETH balance
    const totalEth = eoaEth + smartEth;
  }
}
```

### 3. Imports
Added import for the new ETH balance helper:
```typescript
import { getEthBalance } from '@/app/actions/eth-balance';
```

### 4. Dependencies
Added `smartAccountAddress` to the useEffect dependencies.

## How It Works Now

### For Embedded Wallets (CDP):
1. **ERC-20 Tokens (USDC, etc.)**: Fetched from EOA address ✅
2. **Native ETH**: 
   - Fetched from EOA address ✅
   - **ALSO** fetched from Smart Account address ✅
   - Both balances are **combined** and shown as one ETH balance 💰

### For External Wallets (MetaMask, etc.):
- All balances fetched from the single wallet address (no Smart Account)

## Why This Approach?

1. **Backward Compatible**: Users who had ETH on their Smart Account will see it
2. **Forward Compatible**: New ETH sent to EOA will also show up
3. **Clean UX**: Users see one combined ETH balance, not two separate ones
4. **Safe**: Only native ETH is checked on Smart Account (not tokens)

## Console Debug Output

You'll see logs like:
```
🔍 Fetching token balances for: {
  walletType: 'embedded',
  address: '0x...EOA...',
  isEOA: true
}

🔍 Also checking Smart Account for ETH: 0x...SmartAccount...

💰 Found ETH on Smart Account: 1000000000000000000

💰 Combined ETH balance: {
  eoaEth: '0',
  smartEth: '1000000000000000000',
  total: '1000000000000000000'
}
```

## Testing Checklist
1. ✅ Connect with embedded wallet
2. ✅ Check Assets tab - should see both USDC and ETH
3. ✅ ETH balance should be sum of EOA + Smart Account
4. ✅ Console should show which addresses are being queried
5. ✅ Send tab should work with EOA address

## Related Files
- `/src/components/wallet/WalletDropdown.tsx` - Main balance display logic
- `/src/app/actions/eth-balance.ts` - **NEW** - Helper to fetch ETH from any address
- `/src/app/actions/token-balances.ts` - Fetches ERC-20 + ETH from single address
- `/src/components/wallet/WalletProvider.tsx` - Provides EOA and Smart Account addresses

## Future Consideration
If you want users to transfer ETH from their Smart Account to their EOA, you could add a "Transfer" button in the UI. For now, the combined balance ensures they can see all their ETH regardless of where it's stored.
