# ⚠️ DEPRECATED FILE - PLEASE DELETE

This file has been replaced by `/src/hooks/useX402Signer.ts`

## Why it's deprecated

This file tried to import `useWalletClient` from `@coinbase/cdp-react`, which doesn't exist.
The new `useX402Signer` hook properly handles both:
- External wallets (via wagmi's useWalletClient)
- CDP embedded wallets (via useSignEvmTypedData from @coinbase/cdp-hooks)

## Action Required

Please delete this file:
```bash
rm /Users/Ryan/builds/x402-contract-deployer/src/hooks/useUnifiedWalletClient.ts
```

Or manually delete it from your IDE/file explorer.
