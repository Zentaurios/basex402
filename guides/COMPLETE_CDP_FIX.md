# x402 CDP Embedded Wallet Integration - Complete Fix

## 🎯 Problem Summary

CDP embedded wallets were failing to sign x402 payment authorizations because:

1. **Wrong Hook Import**: Code tried to use `useWalletClient` from `@coinbase/cdp-react` (doesn't exist)
2. **Incorrect Architecture**: CDP wallets use a different signing model than external wallets
3. **Missing Integration**: No proper bridge between CDP's `useSignEvmTypedData` and x402 client

## ✅ Solution Implemented

### Architecture Overview

```
┌─────────────────────────────────────────────────────────────┐
│                    Mint Page (User Action)                   │
└─────────────────────┬───────────────────────────────────────┘
                      │
                      ▼
┌─────────────────────────────────────────────────────────────┐
│              useX402Signer Hook (New!)                       │
│  ┌──────────────────┐          ┌──────────────────┐         │
│  │ External Wallet  │          │  CDP Wallet      │         │
│  │ (wagmi)          │          │  (embedded)      │         │
│  │                  │          │                  │         │
│  │ useWalletClient()│          │ useSignEvm       │         │
│  │ from wagmi       │          │ TypedData()      │         │
│  │                  │          │ from cdp-hooks   │         │
│  └────────┬─────────┘          └────────┬─────────┘         │
│           │                             │                   │
│           └──────────┬──────────────────┘                   │
│                      ▼                                       │
│           Returns X402Signer Object                         │
│           {                                                 │
│             walletClient?: WalletClient                     │
│             signTypedData?: Function                        │
│             address: string                                 │
│           }                                                 │
└─────────────────────┬───────────────────────────────────────┘
                      │
                      ▼
┌─────────────────────────────────────────────────────────────┐
│              x402-client.ts (Updated)                        │
│                                                              │
│  Accepts X402Signer and calls:                              │
│  • walletClient.signTypedData() for external wallets        │
│  • signTypedData() function for CDP wallets                 │
│                                                              │
│  Creates EIP-3009 payment authorization signature           │
└─────────────────────────────────────────────────────────────┘
```

### Files Created/Modified

#### ✅ NEW: `/src/hooks/useX402Signer.ts`
Unified hook that provides signing capability for both wallet types:

```typescript
// For external wallets: Returns WalletClient
// For CDP wallets: Returns custom signTypedData function

export function useX402Signer(): X402SignerResult {
  // Detects wallet type and returns appropriate signer
}
```

**Key Features:**
- Auto-detects wallet type (embedded vs external)
- Returns appropriate signing method for each type
- Provides loading states and error handling

#### ✅ UPDATED: `/src/lib/x402-client.ts`
Modified to accept new `X402Signer` interface:

```typescript
export interface X402Signer {
  walletClient?: WalletClient | null;      // For external wallets
  signTypedData?: (...) => Promise<string>; // For CDP wallets
  address: string;                           // User's address
}
```

**Changes:**
- Accepts either `walletClient` OR `signTypedData` function
- Handles signing differently based on what's provided
- Maintains same x402 payment flow for both types

#### ✅ UPDATED: `/src/app/mint/page.tsx`
Now uses the new `useX402Signer` hook:

```typescript
const { walletClient, signTypedData, address, isLoading } = useX402Signer();

const signer: X402Signer = {
  walletClient: walletClient || undefined,
  signTypedData: signTypedData || undefined,
  address: address,
};

await makeX402Request(url, options, signer, callbacks);
```

#### ❌ DEPRECATED: `/src/hooks/useUnifiedWalletClient.ts`
**Please delete this file** - it's been replaced by `useX402Signer.ts`

## 🔧 How It Works

### For External Wallets (MetaMask, Rainbow, etc.)

1. `useX402Signer` calls wagmi's `useWalletClient()`
2. Returns the `WalletClient` object with `signTypedData()` method
3. x402-client uses `walletClient.signTypedData()` directly

### For CDP Embedded Wallets

1. `useX402Signer` calls `useSignEvmTypedData()` from `@coinbase/cdp-hooks`
2. Creates a custom `signTypedData()` wrapper function
3. This function calls CDP's `signEvmTypedData()` with proper parameters
4. Returns the signature in the expected format

## 🧪 Testing Instructions

### Test with CDP Embedded Wallet:
```bash
1. Connect with email authentication
2. Navigate to /mint
3. Click "Mint NFT" button
4. Should see signature prompt in CDP modal
5. Approve signature
6. x402 payment should complete
7. NFT should be minted
```

### Test with External Wallet:
```bash
1. Connect with MetaMask/Rainbow/etc
2. Navigate to /mint
3. Click "Mint NFT" button
4. Should see signature request in wallet extension
5. Approve signature
6. x402 payment should complete
7. NFT should be minted
```

## 📊 Expected Console Logs

### Successful Flow:
```
🔍 [useX402Signer] Using CDP embedded wallet
  OR
🔍 [useX402Signer] Using external wallet (wagmi)

✅ x402 Signer validation passed: {
  hasWalletClient: true/false,
  hasSignTypedData: true/false,
  walletType: 'embedded'/'external',
  address: '0x...'
}

🌐 [x402-client] Making x402 request...
📥 [x402-client] Response status: 402
💳 [x402-client] Got 402 Payment Required
✍️ [x402-client] Using CDP signTypedData
  OR
✍️ [x402-client] Using WalletClient signTypedData
✅ [x402-client] Signature received
✅ [x402-client] Payment authorization signed successfully
📥 [x402-client] Retry response status: 200
```

## 🚨 Common Issues & Solutions

### Issue: "useWalletClient is not exported"
**Solution**: Make sure you deleted the old `useUnifiedWalletClient.ts` file

### Issue: "Signature request timed out"
**Solution**: CDP wallet might not be properly initialized. Check:
- `useCurrentUser()` returns valid user
- `evmAddress` is not null
- User is signed in with CDP

### Issue: "Wallet does not support EIP-712 signatures"
**Solution**: Check that either:
- `walletClient.signTypedData` exists (external wallet)
- OR `signTypedData` function is provided (CDP wallet)

## 📚 Key CDP Hooks Used

```typescript
import {
  useSignEvmTypedData,  // For signing EIP-712 data
  useEvmAddress,        // Get user's EVM address
  useCurrentUser,       // Get current CDP user object
  useIsSignedIn         // Check if user is authenticated
} from '@coinbase/cdp-hooks';
```

## 🎉 Success Criteria

After implementing this fix, you should be able to:

1. ✅ Connect with CDP embedded wallet (email)
2. ✅ Connect with external wallets (MetaMask, Rainbow, etc.)
3. ✅ Sign x402 payment authorizations with both wallet types
4. ✅ Complete NFT mints with both wallet types
5. ✅ See proper signature prompts for each wallet type
6. ✅ No more "useWalletClient is not exported" errors
7. ✅ No more "is not a function" errors

## 📖 Documentation References

- [CDP React Hooks](https://docs.cdp.coinbase.com/embedded-wallets/react-hooks)
- [CDP EIP-712 Signing](https://docs.cdp.coinbase.com/embedded-wallets/evm-features/eip-712-signing)
- [x402 Protocol Docs](https://docs.x402.org/)
- [Wagmi useWalletClient](https://wagmi.sh/react/api/hooks/useWalletClient)

## 🔄 Migration Checklist

- [x] Create new `useX402Signer.ts` hook
- [x] Update `x402-client.ts` to accept `X402Signer` interface
- [x] Update `mint/page.tsx` to use new hook
- [ ] Delete old `useUnifiedWalletClient.ts` file
- [ ] Test with CDP embedded wallet
- [ ] Test with external wallet (MetaMask)
- [ ] Test with external wallet (Rainbow)
- [ ] Verify both wallets can complete x402 payments
- [ ] Verify NFT minting works with both wallet types

---

**Status**: ✅ Implementation Complete - Ready for Testing

**Next**: Delete the deprecated `useUnifiedWalletClient.ts` file and test both wallet types
