# CDP x402 Signing Fix - EOA Mode

## Date: October 27, 2025

## Problem Summary

When using CDP embedded wallets with `createOnLogin: "smart"`, CDP creates:
1. **EOA (Externally Owned Account)** - e.g., `0x5E0008Fa547064BF1feCeF0FbF091e8Df40B59d4`
   - Has a private key and can sign transactions
   - Stored in `currentUser.evmAccounts[0]`

2. **Smart Account (ERC-4337)** - e.g., `0x44F6Db8E90B5B97fa08668Bdb2E968ad9A42e9A9`
   - Contract wallet owned by the EOA
   - Stored in `currentUser.evmSmartAccounts[0]`

### The Critical Issue

For EIP-3009 `transferWithAuthorization` (used by x402 for USDC payments):
- The `from` address in the payment message **MUST** equal the signer's address
- Our code was:
  - Setting `from: Smart Account (0x44F6...)`
  - But signing with `EOA (0x5E00...)`
  - Result: **Signature verification failed** ❌

### Error Symptoms
```
400 Bad Request
property "address" is missing
```

The actual issue was that the signature didn't match the `from` address, causing the server to reject the payment authorization.

## Solution Applied

### Change 1: `providers.tsx`
Changed CDP config from Smart Account mode to EOA-only mode:

```typescript
// BEFORE
ethereum: {
  createOnLogin: "smart", // Creates both EOA + Smart Account
  network: networkId,
}

// AFTER
ethereum: {
  createOnLogin: "eoa", // Creates only EOA
  network: networkId,
}
```

**Why this works:**
- Only creates an EOA (no Smart Account)
- The EOA address is both the signer AND the payer
- `from` address matches signer address ✅
- EIP-3009 signature verification succeeds ✅

### Change 2: `useX402Signer.ts`
Updated logging to use `eoaAddress` for clarity:

```typescript
// Better variable naming for clarity
const eoaAddress = currentUser.evmAccounts[0];

// Use EOA address for signing
const result = await cdpSignTypedData({
  address: eoaAddress, // ✅ Matches payment from address
  typedData: { ... }
});
```

## Testing Instructions

1. **Clear existing wallet session:**
   ```bash
   # In browser DevTools console
   localStorage.clear();
   sessionStorage.clear();
   # Refresh page
   ```

2. **Sign in with email:**
   - CDP will now create only an EOA (no Smart Account)

3. **Mint an NFT:**
   - Click "Mint 1 NFT"
   - Sign the payment authorization
   - Should work without address mismatch errors ✅

## Expected Behavior Now

### Console logs should show:
```javascript
// User address is EOA
User address: '0x5E00...'  // EOA

// Signing with same EOA
Calling CDP signEvmTypedData with EOA address: 0x5E00...

// Payment message from same EOA
Message from: '0x5E00...'  // MATCHES! ✅
```

### The flow:
1. User connects with email → CDP creates EOA
2. User clicks mint → Server returns 402 Payment Required
3. Client creates payment message with `from: EOA address`
4. Client signs message with EOA private key
5. Signature verification succeeds (addresses match) ✅
6. Server processes payment and mints NFT

## Trade-offs

### Lost (by removing Smart Accounts):
- Gas abstraction features
- Batch transactions
- Social recovery options
- Multi-sig capabilities

### Gained:
- **Working x402 payments** ✅
- Simpler wallet structure
- Direct EIP-3009 compatibility
- Faster signing (no smart contract interactions)

## Alternative Solutions (Future)

If we want to keep Smart Accounts, we could:

1. **Server-Side Signing:**
   - Move signing logic to server
   - Server controls the EOA and signs on behalf of user
   - Requires CDP API keys and different architecture

2. **ERC-1271 Smart Account Signing:**
   - Research if CDP smart accounts support ERC-1271
   - Would allow smart account to sign via contract
   - May require custom implementation

3. **Different Payment Method:**
   - Use ERC-4337 user operations instead of EIP-3009
   - More complex but native to smart accounts
   - Would require significant x402 protocol changes

## Files Modified

1. `/src/app/providers.tsx` - Changed `createOnLogin: "smart"` → `"eoa"`
2. `/src/hooks/useX402Signer.ts` - Updated logging and variable names

## Verification Checklist

- [x] CDP config changed to EOA-only mode
- [x] Logging updated for clarity
- [x] Smart Account references removed from critical path
- [ ] Tested with fresh wallet signup
- [ ] Verified payment signature succeeds
- [ ] Confirmed NFT mint completes

## Next Steps

1. Test the fix with a fresh wallet (clear localStorage)
2. Verify payment authorization succeeds
3. Confirm NFT minting works end-to-end
4. Monitor console logs for any remaining issues

## Success Criteria

✅ User can sign in with email
✅ User can mint NFT with USDC payment
✅ Payment signature verification succeeds
✅ No address mismatch errors
✅ Transaction completes successfully
