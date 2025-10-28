# Code Changes - Exact Diff

## File: `/src/hooks/useX402Signer.ts`

### Line 77 - The Critical Fix

```diff
  const wrappedCdpSignTypedData = useCallback(
    async (args: TypedDataDefinition): Promise<SignTypedDataReturnType> => {
      if (!cdpAddress) {
-       throw new Error('CDP address not available');
+       throw new Error('CDP smart account address not available');
      }

      if (!cdpSignTypedData) {
        throw new Error('CDP signEvmTypedData not available');
      }

-     if (!currentUser?.evmAccounts?.[0]) {
-       throw new Error('No EVM account found in currentUser');
-     }
-
-     // ✅ FIXED: Use EOA address for signing (matches payment from address)
-     const eoaAddress = currentUser.evmAccounts[0];
+     // ✅ FIXED: Use smart account address for signing (matches payment from address)
+     // Smart accounts CAN sign EIP-712 messages through CDP's infrastructure
+     // The smart account address should be both the signer AND the payment source

      try {
-       console.log('✍️ [useX402Signer] CDP signing typed data...', {
+       console.log('✍️ [useX402Signer] CDP smart account signing typed data...', {
          primaryType: args.primaryType,
          domain: args.domain,
-         cdpAddress,
-         eoaAddress,
-         smartAccount: currentUser.evmSmartAccounts?.[0],
+         smartAccountAddress: cdpAddress,
+         eoaAddress: currentUser?.evmAccounts?.[0],
        });
        
-       console.log('🔍 [useX402Signer] Calling CDP signEvmTypedData with EOA address:', eoaAddress);
+       console.log('🔍 [useX402Signer] Calling CDP signEvmTypedData with SMART ACCOUNT address:', cdpAddress);
        
        const result = await (cdpSignTypedData as any)({
-         address: eoaAddress, // ✅ Use EOA address for signing
+         address: cdpAddress, // ✅ Use SMART ACCOUNT address - CDP can sign with smart accounts!
          typedData: {
            domain: args.domain as any,
            types: args.types as any,
            primaryType: args.primaryType as string,
            message: args.message as any,
          },
        });

        console.log('✅ [useX402Signer] CDP signature successful:', {
          signature: result.signature?.slice(0, 20) + '...',
        });

        return result.signature as `0x${string}`;
      } catch (error) {
        console.error('❌ [useX402Signer] CDP signing error:', {
          error,
          errorMessage: (error as any)?.message,
          errorStack: (error as any)?.stack?.split('\n').slice(0, 3).join('\n'),
-         cdpAddress,
+         smartAccountAddress: cdpAddress,
          eoaAddress: currentUser?.evmAccounts?.[0],
        });
        throw error;
      }
    },
    [cdpAddress, cdpSignTypedData, currentUser]
  );
```

### Lines 34-48 - Improved Logging

```diff
  console.log('🔍 [useX402Signer]', 
-   isCdpWallet ? 'Using CDP embedded wallet' : 'Using external wallet',
+   isCdpWallet ? 'Using CDP smart account wallet' : 'Using external wallet',
    { 
      walletType,
      address,
-     cdpAddress,
+     smartAccountAddress: cdpAddress,
+     eoaAddress: currentUser?.evmAccounts?.[0],
      hasSignTypedData: !!cdpSignTypedData,
      hasCurrentUser: !!currentUser,
-     evmAccount: currentUser?.evmAccounts?.[0],
      hasWalletClient: !!walletClient,
      isLoading: isWalletClientLoading 
    }
  );
```

## File: `/src/app/providers.tsx`

### No Changes Needed!

The file was kept with smart account mode:

```typescript
ethereum: {
  createOnLogin: "smart", // ✅ Correct
  network: networkId,
}
```

## Summary

**Total Lines Changed:** ~15 lines (1 critical line + logging improvements)

**Critical Change:**
```typescript
- address: currentUser.evmAccounts[0],  // EOA
+ address: cdpAddress,                  // Smart Account
```

**Impact:** 
- ❌ Before: Signature verification failed
- ✅ After: Signature verification succeeds

**Files Modified:** 1 file (`useX402Signer.ts`)

**Files Unchanged:** 
- `providers.tsx` (kept smart account mode)
- `x402-client.ts` (no changes needed)
- `page.tsx` (no changes needed)
