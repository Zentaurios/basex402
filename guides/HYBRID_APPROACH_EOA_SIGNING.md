# 🔧 Hybrid Approach: Use EOA for Signing, Keep Smart Account

If you want to keep smart accounts but use the EOA for signing x402 payments, here's the exact code:

## The Approach

1. **Display address:** Smart account (`0x44F6...` from `useEvmAddress()`)
2. **Signing account:** EOA (`0x5E00...` from `currentUser.evmAccounts[0]`)
3. **Token holder:** Determine which account holds USDC

## Updated Code

Replace the `wrappedCdpSignTypedData` function in `/src/hooks/useX402Signer.ts`:

```typescript
const wrappedCdpSignTypedData = useCallback(
  async (args: TypedDataDefinition): Promise<SignTypedDataReturnType> => {
    if (!cdpAddress) {
      throw new Error('CDP address not available');
    }

    if (!cdpSignTypedData) {
      throw new Error('CDP signEvmTypedData not available');
    }

    // 🔥 HYBRID FIX: Use EOA for signing, but keep smart account as primary address
    const eoaAddress = currentUser?.evmAccounts?.[0];
    
    if (!eoaAddress) {
      console.error('❌ No EOA available for signing:', {
        hasCurrentUser: !!currentUser,
        evmAccountsCount: currentUser?.evmAccounts?.length || 0,
      });
      throw new Error(
        'EOA required for signing. Smart accounts cannot sign EIP-712 messages.\n\n' +
        'Please switch to EOA mode in your CDP configuration:\n' +
        'ethereum: { createOnLogin: "eoa" }'
      );
    }

    console.log('🔍 Hybrid signing approach:', {
      smartAccount: cdpAddress, // Primary address (display)
      eoaAddress,               // Signing address
      signingWith: 'EOA',
      primaryIs: 'Smart Account',
    });

    try {
      console.log('✍️ [useX402Signer] CDP signing with EOA...', {
        primaryType: args.primaryType,
        eoaAddress,
        smartAccount: cdpAddress,
      });

      // ⚠️ IMPORTANT: Determine which account holds the USDC
      // If the smart account holds USDC, the "from" should be the smart account
      // If the EOA holds USDC, the "from" should be the EOA
      
      // For now, we assume the message already has the correct "from" address
      // This should match whichever account holds the USDC
      
      console.log('🔍 === PRE-SIGN DEBUG START ===');
      console.log('🔍 Signing with EOA:', eoaAddress);
      console.log('🔍 Message from field:', (args.message as any)?.from);
      console.log('🔍 === PRE-SIGN DEBUG END ===');

      // 🔥 KEY: Sign with EOA, not smart account
      const result = await cdpSignTypedData({
        evmAccount: eoaAddress, // ✅ EOA can sign EIP-712
        typedData: {
          domain: args.domain as any,
          types: args.types as any,
          primaryType: args.primaryType as string,
          message: args.message as any, // Keep message as-is
        },
      });

      console.log('✅ [useX402Signer] EOA signature successful:', {
        signature: result.signature?.slice(0, 20) + '...',
      });

      return result.signature as `0x${string}`;
    } catch (error) {
      console.log('🔍 === ERROR DEBUG START ===');
      console.error('❌ [useX402Signer] CDP signing error:', {
        error,
        errorMessage: (error as any)?.message,
        errorStack: (error as any)?.stack?.split('\n').slice(0, 3).join('\n'),
        eoaAddress,
        smartAccount: cdpAddress,
      });
      console.log('🔍 === ERROR DEBUG END ===');
      throw error;
    }
  },
  [cdpAddress, cdpSignTypedData, currentUser]
);
```

## ⚠️ Critical Consideration: Token Holder

The "from" address in the transfer authorization must match **whichever account holds the USDC**:

### Case 1: EOA Holds USDC
```typescript
// The message should have EOA as "from"
message: {
  from: eoaAddress, // ← Token holder
  to: payTo,
  value: amount,
  ...
}
```

### Case 2: Smart Account Holds USDC
```typescript
// The message should have smart account as "from"
message: {
  from: cdpAddress, // ← Smart account (token holder)
  to: payTo,
  value: amount,
  ...
}
```

But if the smart account holds tokens, it **cannot sign** the authorization. This creates a chicken-and-egg problem.

## 🎯 Recommendation

**For x402 payments, use EOA mode** because:

1. The EOA needs to both:
   - ✅ Hold the USDC tokens
   - ✅ Sign the transfer authorization

2. Smart accounts create complications:
   - ❌ Can't sign EIP-712
   - ❌ Would need tokens transferred to EOA first
   - ❌ Adds complexity and gas costs

## Alternative: Keep Smart Accounts, Update x402 Flow

If you must keep smart accounts, consider:

1. **Use ERC-4337 UserOperations** instead of EIP-3009
2. **Use Paymaster** for gas sponsorship
3. **Direct USDC transfer** from smart account instead of meta-transaction

But this requires changing your x402 implementation significantly.

## My Recommendation

**Switch to EOA mode** (`createOnLogin: "eoa"`) for x402 compatibility. It's:
- ✅ Simpler
- ✅ More compatible with x402/EIP-3009
- ✅ No additional complexity

Save smart accounts for a future feature when you need:
- Account abstraction
- Batched transactions
- Gasless transactions via paymaster

---

## If You Still Want Hybrid

Use the code above, but be aware:
1. Only works if EOA holds the USDC
2. Adds complexity
3. May confuse users (smart account shown, but EOA signing)

Let me know which approach you prefer! 🚀
