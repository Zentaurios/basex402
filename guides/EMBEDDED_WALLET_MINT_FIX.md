# Embedded Wallet Minting Fix

## Problem

When attempting to mint with an embedded wallet, the transaction was failing with:

```
POST https://mainnet.base.org/ 403 (Forbidden)
Request body: {"method":"eth_signTypedData_v4",...}
Details: {"code":-32601,"message":"rpc method is unsupported"}
```

## Root Cause

The issue was in `/src/hooks/useUnifiedWalletClient.ts`. When creating the wallet client for embedded wallets, we were using `transport: http()` which defaults to using the chain's RPC URL (`https://mainnet.base.org`).

When viem's wallet client tried to sign typed data for the x402 payment authorization, it attempted to call `eth_signTypedData_v4` on the Base public RPC endpoint. However:

1. **Public RPC endpoints don't support wallet-specific methods** like `eth_signTypedData_v4` - these are wallet methods, not node methods
2. **CDP accounts have their own signing infrastructure** - they sign locally through CDP's system, not through RPC calls

The wallet client was incorrectly trying to route signing operations through the RPC endpoint instead of using the CDP account's native signing methods.

## Solution

Created a **custom transport** for embedded wallets that prevents any RPC calls:

```typescript
function createEmbeddedWalletTransport() {
  return custom({
    async request() {
      throw new Error(
        'Embedded wallet transport should not make RPC calls. ' +
        'All signing operations should go through the CDP account methods.'
      );
    },
  });
}
```

Then updated the wallet client creation to use this transport:

```typescript
const client = createWalletClient({
  account: viemAccount,
  chain,
  transport: createEmbeddedWalletTransport(), // ← Custom transport
});
```

## Why This Works

1. **CDP Account Methods**: The custom viem account (`createCdpViemAccount`) already wraps CDP's native signing methods:
   - `signMessage()`
   - `signTypedData()` 
   - `signTransaction()`

2. **No RPC Needed**: These methods handle signing through CDP's infrastructure directly - they don't need to make RPC calls

3. **Transport Safety**: The custom transport ensures that if viem tries to make an RPC call for any reason, it will fail fast with a clear error message instead of sending invalid requests to public RPCs

## Testing

After this fix:

1. **Stop the dev server**: `Ctrl+C` or `Cmd+C`
2. **Clear the build cache**: `rm -rf .next`
3. **Restart**: `npm run dev`
4. **Test embedded wallet minting**: The signing operations should now go through CDP's infrastructure without attempting RPC calls

## Files Changed

- `/src/hooks/useUnifiedWalletClient.ts`:
  - Added `custom` import from viem
  - Created `createEmbeddedWalletTransport()` function
  - Changed `transport: http()` to `transport: createEmbeddedWalletTransport()`

## Key Takeaway

When working with embedded wallets in viem:
- ✅ **DO** wrap the wallet's native signing methods in a custom account
- ❌ **DON'T** use HTTP transports that will try to make RPC calls for signing operations
- 💡 **Signing happens through the wallet provider's infrastructure, not through RPC endpoints**
