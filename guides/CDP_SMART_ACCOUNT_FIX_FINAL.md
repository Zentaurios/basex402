# CDP Smart Account Signing Fix - FINAL SOLUTION ✅

## Problem Summary

The `useX402Signer` hook was trying to use `useEvmAccounts()` which doesn't exist in `@coinbase/cdp-hooks` v0.0.43. This caused a TypeScript error: "Module '@coinbase/cdp-hooks' has no exported member 'useEvmAccounts'".

Additionally, `signEvmTypedData` requires an `evmAccount` parameter of type `EvmAccount` (an object with signing capabilities), not just an address string.

## The Solution

**Use `currentUser.evmAccounts` from the `useCurrentUser()` hook instead of the non-existent `useEvmAccounts()` hook.**

### What Changed

```typescript
// ❌ BEFORE (doesn't exist)
import { useEvmAccounts } from '@coinbase/cdp-hooks';
const { evmAccounts } = useEvmAccounts();

// ✅ AFTER (correct approach)
import { useCurrentUser } from '@coinbase/cdp-hooks';
const { currentUser } = useCurrentUser();
const evmAccounts = currentUser?.evmAccounts || [];
```

### Why This Works

According to the CDP documentation and type definitions:

1. **`useCurrentUser()` returns the authenticated user** which includes:
   - `evmAccounts[]` - Array of EVM account objects (EOAs)
   - `evmSmartAccounts[]` - Array of smart account objects

2. **`evmAccounts[0]` is an `EvmAccount` object** with these properties:
   - `address` - The account's address
   - `sign()` - Sign a hash
   - `signMessage()` - Sign a message
   - `signTransaction()` - Sign a transaction
   - `signTypedData()` - Sign typed data (EIP-712)
   - `policies` - Optional policy IDs

3. **For signing operations, we need the EOA account** (not the smart account) because:
   - Smart accounts don't sign directly
   - The EOA (owner) signs on behalf of the smart account
   - The `signEvmTypedData` hook expects an `EvmAccount` parameter

## Code Changes

### File: `/src/hooks/useX402Signer.ts`

**Key changes:**
1. Replaced `useEvmAccounts` import with `useCurrentUser`
2. Extract `evmAccounts` from `currentUser.evmAccounts`
3. Pass `evmAccounts[0]` (the first EOA account object) to `signEvmTypedData`

```typescript
// Import useCurrentUser instead of non-existent useEvmAccounts
import { useSignEvmTypedData, useEvmAddress, useCurrentUser } from '@coinbase/cdp-hooks';

// Get the current user and their accounts
const { currentUser } = useCurrentUser();
const evmAccounts = currentUser?.evmAccounts || [];

// Use the first account object when signing
const evmAccount = evmAccounts[0];
const result = await cdpSignTypedData({
  evmAccount, // ✅ Pass the account object
  typedData: {
    domain: args.domain as any,
    types: args.types as any,
    primaryType: args.primaryType as string,
    message: args.message as any,
  },
});
```

## What This Enables

With this fix, the embedded wallet mint flow will now work correctly:

1. ✅ User signs in with CDP embedded wallet
2. ✅ CDP creates both an EOA and a Smart Account
3. ✅ When minting, the x402 payment signature is created by the EOA
4. ✅ The signature is valid for ERC-1271 verification
5. ✅ Server can process the payment and mint the NFT

## Testing Instructions

### 1. Start the Development Server
```bash
npm run dev
```

### 2. Test the Mint Flow
1. Go to `http://localhost:3000/mint`
2. Click "Connect to Mint"
3. Sign in with an email (creates embedded wallet)
4. Wait for wallet to initialize
5. Click "Mint 1 NFT (1 USDC)"

### 3. Expected Console Logs

You should see these logs in the browser console:

```
🔍 [useX402Signer] Using CDP embedded wallet {
  walletType: 'embedded',
  address: '0x...',
  cdpAddress: '0x...',
  evmAccountsCount: 1,
  hasCurrentUser: true,
  hasWalletClient: false,
  isLoading: false
}

✍️ [useX402Signer] CDP signing typed data... {
  primaryType: 'x402Permit',
  domain: { name: 'x402', version: '1', chainId: 84532, ... },
  cdpAddress: '0x...',
  accountsAvailable: 1
}

🔍 [useX402Signer] Using account from currentUser.evmAccounts: {
  accountType: 'object',
  accountKeys: ['address', 'sign', 'signMessage', 'signTransaction', 'signTypedData', ...],
  isObject: true,
  accountAddress: '0x...'
}

✅ [useX402Signer] CDP signature successful: {
  signature: '0x1234567890abcdef...'
}
```

### 4. Success Criteria

✅ No TypeScript errors
✅ No "useEvmAccounts" import errors
✅ No "EVM account not found" runtime errors
✅ Account object is logged with correct properties
✅ Signature is generated successfully
✅ Mint completes and NFT is minted

### 5. Common Issues to Watch For

❌ **"No EVM accounts available from currentUser"**
- User might not be fully signed in yet
- Try refreshing the page after signing in

❌ **"CDP signEvmTypedData not available"**
- The CDP hooks might not be initialized
- Check that `CDPHooksProvider` is wrapping your app

❌ **"evmAccount" is undefined**
- `currentUser` might be null
- Add additional null checks if needed

## Architecture Overview

```
┌─────────────────────────────────────────────────────────────┐
│                    Mint Page (/mint/page.tsx)               │
│                                                              │
│  1. User clicks "Mint 1 NFT"                                │
│  2. handleMint() is called                                  │
│  3. Gets signer from useX402Signer()                        │
│  4. Calls makeX402Request() with signer                     │
└──────────────────────┬──────────────────────────────────────┘
                       │
                       ▼
┌─────────────────────────────────────────────────────────────┐
│              useX402Signer Hook (FIXED!)                     │
│                                                              │
│  • Uses useCurrentUser() to get currentUser                 │
│  • Extracts evmAccounts from currentUser.evmAccounts        │
│  • Returns signer with signTypedData() function             │
│                                                              │
│  wrappedCdpSignTypedData():                                 │
│    1. Gets evmAccount object from evmAccounts[0]           │
│    2. Calls cdpSignTypedData({ evmAccount, typedData })    │
│    3. Returns the signature                                 │
└──────────────────────┬──────────────────────────────────────┘
                       │
                       ▼
┌─────────────────────────────────────────────────────────────┐
│                  x402-client.ts                              │
│                                                              │
│  makeX402Request():                                         │
│    1. Makes initial request to /api/mint                    │
│    2. If 402 Payment Required, parses x402 data            │
│    3. Calls signer.signTypedData() with permit data        │
│    4. Retries request with Authorization header            │
└──────────────────────┬──────────────────────────────────────┘
                       │
                       ▼
┌─────────────────────────────────────────────────────────────┐
│              /api/mint/route.ts (Server)                     │
│                                                              │
│  1. Validates signature using ERC-1271 verification         │
│  2. Processes payment (transfers USDC)                      │
│  3. Mints NFT to user's wallet                              │
│  4. Returns success with transaction hash                   │
└─────────────────────────────────────────────────────────────┘
```

## Key Insights from CDP Documentation

From the Smart Accounts docs (Document 2):

```typescript
// Getting the current user
const { currentUser } = useCurrentUser();

// Accessing accounts
const eoaAddress = currentUser?.evmAccounts?.[0];  // EOA account object
const smartAccount = currentUser?.evmSmartAccounts?.[0];  // Smart account object

// For signing operations, use the EOA (owner)
// For user operations, use the smart account
```

## Type Definitions (from Document 1)

```typescript
type EvmAccount = {
  address: Address;
  policies?: string[];
  sign: (parameters: { hash: Hash }) => Promise<Hex>;
  signMessage: (parameters: { message: SignableMessage }) => Promise<Hex>;
  signTransaction: (transaction: TransactionSerializable) => Promise<Hex>;
  signTypedData: <typedData, primaryType>(
    parameters: TypedDataDefinition<typedData, primaryType>
  ) => Promise<Hex>;
};
```

This is the type of object we get from `currentUser.evmAccounts[0]` and what we pass to `signEvmTypedData()`.

## What's Next

1. **Test the mint flow** to ensure everything works
2. **Monitor the console logs** to verify account object structure
3. **Check transaction on Base Sepolia** to confirm successful mint

If you encounter any errors, the enhanced logging will show:
- Account type and keys
- Account address
- Error messages with stack traces

## Status

✅ **IMPLEMENTED AND READY TO TEST**

The fix has been applied to `/src/hooks/useX402Signer.ts`. The embedded wallet mint functionality should now work correctly with CDP Smart Accounts.

## Related Files

- `/src/hooks/useX402Signer.ts` - Fixed CDP signer hook
- `/src/app/mint/page.tsx` - Mint page that uses the signer
- `/src/lib/x402-client.ts` - x402 request handler
- `/src/app/api/mint/route.ts` - Server-side mint endpoint

## References

- [CDP Smart Accounts Documentation](https://docs.cdp.coinbase.com/embedded-wallets/docs/smart-accounts)
- [CDP Hooks Reference](https://github.com/coinbase/cdp-web/blob/main/packages/hooks/README.md)
- [ERC-1271 Standard](https://eips.ethereum.org/EIPS/eip-1271)
