# 🔧 Alternative CDP Signing Approach

Based on the error "EVM account not found", here are alternative approaches to try if clearing cache doesn't work:

## Option 1: Wait for CDP to be Fully Ready

The error might be because CDP isn't fully initialized. Try this modification:

### In `/src/hooks/useX402Signer.ts`

Replace the `wrappedCdpSignTypedData` function with this version that checks for CDP readiness:

```typescript
const wrappedCdpSignTypedData = useCallback(
  async (args: TypedDataDefinition): Promise<SignTypedDataReturnType> => {
    // Wait for CDP to be ready
    if (!cdpAddress) {
      throw new Error('CDP address not available');
    }

    if (!cdpSignTypedData) {
      throw new Error('CDP signEvmTypedData not available');
    }

    // Add a small delay to ensure CDP is fully initialized
    await new Promise(resolve => setTimeout(resolve, 100));

    try {
      console.log('✍️ [useX402Signer] CDP signing typed data...');
      
      // Try signing with error handling
      const result = await cdpSignTypedData({
        evmAccount: cdpAddress,
        typedData: {
          domain: args.domain as any,
          types: args.types as any,
          primaryType: args.primaryType as string,
          message: args.message as any,
        },
      });

      console.log('✅ [useX402Signer] CDP signature successful');
      return result.signature as `0x${string}`;
    } catch (error: any) {
      console.error('❌ [useX402Signer] CDP signing error:', error);
      
      // If it's an authentication error, give specific guidance
      if (error?.message?.includes('not authenticated') || error?.message?.includes('not found')) {
        throw new Error(
          'CDP wallet not fully initialized. Please:\n' +
          '1. Refresh the page\n' +
          '2. Ensure you are signed in to your Coinbase account\n' +
          '3. Try again'
        );
      }
      
      throw error;
    }
  },
  [cdpAddress, cdpSignTypedData]
);
```

## Option 2: Use CDP's Lower-Level API

If the hooks aren't working, we might need to use CDP's core API directly:

```typescript
import { getCurrentUser } from '@coinbase/cdp-core';

const wrappedCdpSignTypedData = useCallback(
  async (args: TypedDataDefinition): Promise<SignTypedDataReturnType> => {
    try {
      console.log('🔍 Getting current CDP user...');
      
      // Get the current user directly from CDP
      const user = await getCurrentUser();
      console.log('🔍 CDP User:', {
        hasUser: !!user,
        evmAccounts: user?.evmAccounts?.length,
      });

      if (!user?.evmAccounts?.[0]) {
        throw new Error('No CDP account available. Please sign in again.');
      }

      const evmAccount = user.evmAccounts[0];
      console.log('🔍 Using EVM account:', evmAccount);

      // Sign with the account object
      const result = await cdpSignTypedData({
        evmAccount: evmAccount, // Pass the account object instead of address string
        typedData: {
          domain: args.domain as any,
          types: args.types as any,
          primaryType: args.primaryType as string,
          message: args.message as any,
        },
      });

      console.log('✅ CDP signature successful');
      return result.signature as `0x${string}`;
    } catch (error) {
      console.error('❌ CDP signing error:', error);
      throw error;
    }
  },
  [cdpSignTypedData]
);
```

## Option 3: Check if `evmAccount` Needs Different Format

Maybe CDP expects the account in a different format. Try these variations:

```typescript
// Try different formats
const accountFormats = {
  direct: cdpAddress,
  object: { address: cdpAddress },
  lowercase: cdpAddress?.toLowerCase(),
};

for (const [format, value] of Object.entries(accountFormats)) {
  try {
    console.log(`🔍 Trying format: ${format}`);
    const result = await cdpSignTypedData({
      evmAccount: value as any,
      typedData: { ... }
    });
    console.log(`✅ Success with format: ${format}`);
    return result.signature;
  } catch (error) {
    console.log(`❌ Failed with format: ${format}`, error.message);
  }
}
```

## Next Steps

1. **First**: Clear cache and get full debug output (see GET_FULL_DEBUG_OUTPUT.md)
2. **If still failing**: Try Option 1 (add initialization delay)
3. **If still failing**: Try Option 2 (use getCurrentUser)
4. **If still failing**: Share the FULL console output with all debug logs

The full debug output will tell us exactly which approach to use! 🎯
