# FIXED: ETH Balance Not Showing - Native Token Recognition

## The Problem (Identified from Console Logs)

Your console showed:
```
Token check: ETH {
  contractAddress: '0xEeeeeEeeeEeEeeEeEeEeeEEEeeeeEeeeeeeeEEeE',
  isNative: false,        ← WRONG!
  isVerified: false,      ← Because isNative was false
  isSpam: false
}

WalletDropdown filtering: {
  filtered: 1,   ← Only USDC showing
  hidden: 2      ← ETH was hidden!
}
```

## Root Cause

CDP's `listTokenBalances` API returns native ETH with a special placeholder contract address:
```
0xEeeeeEeeeEeEeeEeEeEeeEEEeeeeEeeeeeeeEEeE
```

This is a standard placeholder used by many APIs (ERC-7528 standard) to represent native ETH.

Our `isNativeToken()` function was checking:
```typescript
// OLD CODE (BROKEN)
if (address) return false; // ❌ ETH has an address, so it said "not native"
```

This caused:
1. ETH marked as `isNative: false`
2. ETH marked as `isVerified: false` (because it wasn't recognized as native)
3. Token filter **hid ETH** because it wasn't verified
4. Only USDC showed up (the one verified token)

## The Fix

Updated `isNativeToken()` to recognize common native ETH placeholder addresses:

```typescript
const NATIVE_ETH_ADDRESSES = [
  '0x0000000000000000000000000000000000000000', // Zero address
  '0xeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeee', // ERC-7528 standard
  '0xEeeeeEeeeEeEeeEeEeEeeEEEeeeeEeeeeeeeEEeE', // Mixed case (CDP uses this!)
  'native',                                      // Explicit 'native' string
].map(addr => addr.toLowerCase());

export function isNativeToken(symbol?: string, address?: string): boolean {
  const isNativeSymbol = symbol === 'ETH' || symbol === 'SOL' || ...;
  
  if (!address) return isNativeSymbol;
  
  // ✅ NEW: Check if address is a known native token placeholder
  const normalizedAddress = address.toLowerCase();
  const isNativeAddress = NATIVE_ETH_ADDRESSES.includes(normalizedAddress);
  
  return isNativeAddress || (isNativeSymbol && !address);
}
```

## Expected Behavior After Fix

When you reload and open the wallet dropdown, console should show:

```
Token check: ETH {
  contractAddress: '0xEeeeeEeeeEeEeeEeEeEeeEEEeeeeEeeeeeeeEEeE',
  isNative: true,         ✅ FIXED!
  isVerified: true,       ✅ Now verified because it's native
  isSpam: false
}

WalletDropdown filtering: {
  filtered: 2,   ✅ Now showing USDC + ETH
  hidden: 1      ✅ Only spam token hidden
}
```

And your Assets tab should show:
- ✅ **ETH** - 0.0005 ETH
- ✅ **USDC** - (your balance)

## Why This Happened

Different APIs use different conventions for native tokens:
- **Viem/Ethers**: No address or `0x0000...0000`
- **CDP SDK**: `0xEeee...EEeE` (ERC-7528 standard)
- **Some APIs**: `"native"` string
- **Others**: All zeros `0x0000...0000`

Our code now recognizes **all common formats** so ETH shows up regardless of which API format is used.

## Files Changed
- ✅ `/src/lib/tokens/allowlist.ts` - Fixed `isNativeToken()` function

## Testing
1. Clear browser cache
2. Reload the app
3. Open wallet dropdown
4. Check console for new logs showing `isNative: true`
5. ETH should now appear in Assets tab! 🎉

## Technical Reference

**ERC-7528**: This is an Ethereum standard that defines `0xEeee...EEeE` as the canonical address for representing native ETH in token lists and APIs. Many DeFi protocols and APIs use this convention.
