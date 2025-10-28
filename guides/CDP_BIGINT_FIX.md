# CDP BigInt Serialization Fix 🔥

## The Problem

CDP's `signEvmTypedData` SDK internally calls `JSON.stringify()` which **cannot serialize BigInt values**:

```
TypeError: Do not know how to serialize a BigInt
    at JSON.stringify (<anonymous>)
    at p.getXWalletAuth (index.web7.js:114:62)
```

## The Root Cause

In `/src/lib/x402-client.ts` around line 266, the message object uses BigInt:

```typescript
// ❌ CURRENT CODE (BROKEN for CDP wallets)
const message = {
  from: paymentPayload.from as `0x${string}`,
  to: paymentPayload.to as `0x${string}`,
  value: BigInt(paymentPayload.value),        // ← BigInt!
  validAfter: BigInt(paymentPayload.validAfter),  // ← BigInt!
  validBefore: BigInt(paymentPayload.validBefore), // ← BigInt!
  nonce: paymentPayload.nonce as `0x${string}`,
};
```

## The Solution

Create **different message formats** for CDP wallets (strings) vs external wallets (BigInt):

### Find This Code (around line 266):

```typescript
  // Message to sign
  const message = {
    from: paymentPayload.from as `0x${string}`,
    to: paymentPayload.to as `0x${string}`,
    value: BigInt(paymentPayload.value),
    validAfter: BigInt(paymentPayload.validAfter),
    validBefore: BigInt(paymentPayload.validBefore),
    nonce: paymentPayload.nonce as `0x${string}`,
  };
```

### Replace With This:

```typescript
  // 🔥 CRITICAL FIX: CDP SDK can't serialize BigInt values (JSON.stringify issue)
  // Create different message formats for CDP wallets (strings) vs external wallets (BigInt)
  const message = isCdpWallet ? {
    // CDP wallets: Use strings to avoid JSON.stringify BigInt error
    from: paymentPayload.from as `0x${string}`,
    to: paymentPayload.to as `0x${string}`,
    value: paymentPayload.value, // String
    validAfter: paymentPayload.validAfter, // String
    validBefore: paymentPayload.validBefore, // String
    nonce: paymentPayload.nonce as `0x${string}`,
  } : {
    // External wallets: Use BigInt (native viem format)
    from: paymentPayload.from as `0x${string}`,
    to: paymentPayload.to as `0x${string}`,
    value: BigInt(paymentPayload.value), // BigInt
    validAfter: BigInt(paymentPayload.validAfter), // BigInt
    validBefore: BigInt(paymentPayload.validBefore), // BigInt
    nonce: paymentPayload.nonce as `0x${string}`,
  };
```

## Why This Works

1. **CDP Wallets (Embedded)**
   - CDP SDK internally calls `JSON.stringify` on the message
   - BigInt values cause: `TypeError: Do not know how to serialize a BigInt`
   - **Solution**: Use string values that can be serialized
   - The EIP-712 type definition (`uint256`) handles the conversion

2. **External Wallets (MetaMask, Coinbase Wallet, etc.)**
   - Viem's `signTypedData` expects BigInt for `uint256` types
   - These wallets handle BigInt natively
   - **Solution**: Use BigInt values as expected by viem

## Apply The Fix

### Option 1: Manual Edit (Recommended)

1. Open `/Users/Ryan/builds/x402-contract-deployer/src/lib/x402-client.ts`
2. Find line 266 (search for `const message = {`)
3. Replace the entire `const message = { ... };` block with the fixed version above
4. Save the file

### Option 2: Using sed (Quick but less safe)

```bash
cd /Users/Ryan/builds/x402-contract-deployer

# Backup the file first
cp src/lib/x402-client.ts src/lib/x402-client.ts.backup

# This is complex, manual edit is safer!
```

## After Applying The Fix

1. **Restart dev server:**
   ```bash
   npm run dev
   ```

2. **Test in incognito window:**
   - Go to `http://localhost:3000/mint`
   - Sign in with email (embedded wallet)
   - Click "Mint 1 NFT"

3. **Expected console logs:**
   ```
   ✍️ [useX402Signer] CDP signing typed data...
   🔍 [useX402Signer] Calling CDP signEvmTypedData (auto-using current account)...
   ✅ [useX402Signer] CDP signature successful: { signature: '0x123...' }
   ✅ [x402-client] Signature received from CDP wallet
   🎉 Successfully minted 1 NFT!
   ```

4. **No more errors:**
   - ❌ ~~`TypeError: Do not know how to serialize a BigInt`~~
   - ✅ Signature succeeds
   - ✅ Payment processed
   - ✅ NFT minted

## Understanding The Technical Details

### EIP-712 Type System

The EIP-712 types define `uint256`:

```typescript
const types = {
  TransferWithAuthorization: [
    { name: 'value', type: 'uint256' },      // ← Type says uint256
    { name: 'validAfter', type: 'uint256' },
    { name: 'validBefore', type: 'uint256' },
  ],
};
```

### How Values Are Processed

```typescript
// String "1000000" → Encoded as uint256 → Signed
//    ↓
// CDP SDK sees: { value: "1000000" }
//    ↓
// Type definition: { name: 'value', type: 'uint256' }
//    ↓
// SDK converts: "1000000" → 0x00000...0f4240 (uint256 encoding)
//    ↓
// Hash is created and signed ✅
```

vs

```typescript
// BigInt 1000000n → JSON.stringify FAILS ❌
//    ↓
// TypeError: Do not know how to serialize a BigInt
```

### Why External Wallets Need BigInt

External wallets using viem expect JavaScript BigInt for uint256:

```typescript
// Viem expects:
{ value: 1000000n }  // BigInt

// Viem does NOT use JSON.stringify internally
// It handles BigInt natively
```

## Testing Both Wallet Types

After the fix, test both:

### 1. CDP Embedded Wallet (Email sign-in)
```
✅ Should work now (was broken before)
```

### 2. External Wallet (MetaMask, Coinbase Wallet)
```
✅ Should still work (already worked)
```

## Files Modified

- ✅ `/src/hooks/useX402Signer.ts` - Fixed to call without evmAccount parameter
- 🔧 `/src/lib/x402-client.ts` - **NEEDS THIS FIX** - Use strings for CDP wallets

## Complete Flow After Fix

```
User clicks "Mint 1 NFT"
    ↓
makeX402Request() called
    ↓
Server returns 402 Payment Required
    ↓
createPaymentHeader() builds message
    ↓
isCdpWallet? 
    ↓ YES
    message = { value: "1000000", ... }  // Strings ✅
    ↓
    CDP signEvmTypedData()
    ↓
    CDP SDK: JSON.stringify(message) ✅  // Works!
    ↓
    Signature created ✅
    ↓
    Payment submitted ✅
    ↓
    NFT minted ✅
```

## Status

⏳ **WAITING FOR YOUR MANUAL FIX**

Please open `/src/lib/x402-client.ts`, find line ~266, and apply the fix above.

## Support

If you have any issues:
1. Make sure you're editing the right file: `/src/lib/x402-client.ts`
2. Find the exact line with `const message = {`
3. Replace the entire block (including the closing `};`)
4. Save and restart the dev server

Let me know when you've applied the fix and I'll help you test it! 🚀
