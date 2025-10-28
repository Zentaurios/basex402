# CDP Embedded Wallet x402 Signing - FIXED ✅

## The Problem

The original implementation tried to use `useWalletClient` from `@coinbase/cdp-react`, but **this hook doesn't exist**. CDP embedded wallets use a completely different architecture than external wallets:

- **External wallets (wagmi)**: Provide a `WalletClient` with `signTypedData()` method
- **CDP embedded wallets**: Use `useSignEvmTypedData()` hook from `@coinbase/cdp-hooks`

### Error Messages
```
Attempted import error: 'useWalletClient' is not exported from '@coinbase/cdp-react'
TypeError: (0 , _coinbase_cdp_react__WEBPACK_IMPORTED_MODULE_2__.useWalletClient) is not a function
```

## The Solution

Created a unified signing interface that works for both wallet types:

### 1. New Hook: `useX402Signer`

Located at: `/src/hooks/useX402Signer.ts`

This hook provides a unified interface for x402 signing:

```typescript
export interface X402SignerResult {
  // For external wallets - provides full WalletClient
  walletClient: WalletClient | null;
  
  // For CDP embedded wallets - provides signing function
  signTypedData: ((params: {
    domain: any;
    types: any;
    primaryType: string;
    message: any;
  }) => Promise<string>) | null;
  
  // Common properties
  address: string | undefined;
  isLoading: boolean;
  walletType: 'embedded' | 'external' | null;
}
```

**How it works:**
- **External wallets**: Returns wagmi's `useWalletClient()` which includes `signTypedData()`
- **CDP embedded wallets**: Creates a custom `signTypedData()` function using `useSignEvmTypedData()` from `@coinbase/cdp-hooks`

### 2. Updated x402 Client: `x402-client.ts`

Located at: `/src/lib/x402-client.ts`

The x402 client now accepts an `X402Signer` interface instead of just a `WalletClient`:

```typescript
export interface X402Signer {
  walletClient?: WalletClient | null;
  signTypedData?: ((params: {...}) => Promise<string>) | null;
  address: string;
}
```

**Signing logic:**
- If `signTypedData` function is provided (CDP embedded wallet), use it directly
- If `walletClient` is provided (external wallet), use `walletClient.signTypedData()`

### 3. Updated Mint Page: `mint/page.tsx`

Located at: `/src/app/mint/page.tsx`

Now uses the new `useX402Signer` hook:

```typescript
// Use x402 signer that works for both embedded (CDP) and external (wagmi) wallets
const { 
  walletClient, 
  signTypedData, 
  address: signerAddress, 
  isLoading: isWalletClientLoading, 
  walletType: signerWalletType 
} = useX402Signer();

// Create signer object for x402 payment
const signer: X402Signer = {
  walletClient: walletClient || undefined,
  signTypedData: signTypedData || undefined,
  address: signerAddress,
};

// Make x402 request with unified signer
await makeX402Request(url, options, signer, callbacks);
```

## How CDP Signing Works

The CDP hooks from `@coinbase/cdp-hooks` provide:

```typescript
import { useSignEvmTypedData, useEvmAddress, useCurrentUser } from '@coinbase/cdp-hooks';

const { signEvmTypedData } = useSignEvmTypedData();
const { evmAddress } = useEvmAddress();

// To sign EIP-712 typed data:
const result = await signEvmTypedData({
  evmAddress: evmAddress,
  typedData: {
    domain: { ... },
    types: { ... },
    primaryType: 'TransferWithAuthorization',
    message: { ... }
  }
});

// Returns: { signature: '0x...' }
```

## Testing

To test the fix:

1. **With CDP Embedded Wallet:**
   - Connect with email
   - Navigate to mint page
   - Click "Mint" button
   - Should see signature prompt
   - x402 payment should complete successfully

2. **With External Wallet:**
   - Connect with MetaMask/Rainbow/etc
   - Navigate to mint page
   - Click "Mint" button
   - Should see signature prompt in wallet extension
   - x402 payment should complete successfully

## Files Changed

1. ✅ Created: `/src/hooks/useX402Signer.ts` - New unified signing hook
2. ✅ Updated: `/src/lib/x402-client.ts` - Support for both wallet types
3. ✅ Updated: `/src/app/mint/page.tsx` - Use new signer hook
4. ❌ Deprecated: `/src/hooks/useUnifiedWalletClient.ts` - Can be deleted

## Key Takeaways

1. **CDP embedded wallets don't provide a `useWalletClient` hook** - they use separate hooks for different operations
2. **Use `useSignEvmTypedData` from `@coinbase/cdp-hooks`** for EIP-712 signing with CDP wallets
3. **The unified signer interface** makes x402 payments work seamlessly with both wallet types
4. **CDP wallets can sign for any chain** - they don't need to be "on" a specific chain like external wallets

## Next Steps

If you encounter any issues:

1. Check console logs - both hooks log their state
2. Verify CDP wallet is properly initialized with `useCurrentUser()`
3. Ensure `evmAddress` exists before attempting to sign
4. Check that CDP hooks are wrapped in `CDPHooksProvider` in your providers

## References

- [CDP Hooks Documentation](https://docs.cdp.coinbase.com/embedded-wallets/react-hooks)
- [CDP EIP-712 Signing](https://docs.cdp.coinbase.com/embedded-wallets/evm-features/eip-712-signing)
- [x402 Protocol](https://docs.x402.org/)
