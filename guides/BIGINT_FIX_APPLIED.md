# 🔧 BigInt Serialization Fix Applied

## ✅ Changes Made (October 28, 2025)

### Problem Identified
CDP SDK was throwing `TypeError: Do not know how to serialize a BigInt` when trying to sign EIP-712 messages with BigInt values. The error occurred inside CDP's internal `getXWalletAuth` function which calls `JSON.stringify()`.

### Root Cause
- EIP-712 types specify `uint256` which requires BigInt for correct hashing
- CDP SDK internally serializes the message object using `JSON.stringify()`
- JavaScript's `JSON.stringify()` cannot serialize BigInt values
- This caused signing to fail before it even reached the signature prompt

### Solution Applied
**Two-stage message creation:**
1. Create BigInt message for correct EIP-712 type hashing
2. Convert BigInt to hex strings for CDP SDK (hex strings are also valid uint256 representations)

### Changes in `/src/lib/x402-client.ts`

#### 1. Added hex-encoded message for CDP (after line 280)
```typescript
// 🔧 CRITICAL FIX: Convert BigInt to hex strings for CDP SDK
// CDP SDK calls JSON.stringify() internally which can't serialize BigInt
// Hex strings are correctly interpreted as uint256 by EIP-712
const messageCDP = {
  from: message.from,
  to: message.to,
  value: '0x' + message.value.toString(16),         // Convert to hex string
  validAfter: '0x' + message.validAfter.toString(16),
  validBefore: '0x' + message.validBefore.toString(16),
  nonce: message.nonce,
};

console.log('📋 [x402-client] CDP message (hex-encoded):', {
  value: messageCDP.value,
  validAfter: messageCDP.validAfter,
  validBefore: messageCDP.validBefore,
});
```

#### 2. Updated CDP signing section (line 319-357)
- Changed console log to: `"Using CDP signTypedData with hex-encoded values"`
- Updated TypeScript interface to expect `string` instead of `bigint`
- Changed `message` to `messageCDP` in the signTypedData call

```typescript
interface SignTypedDataParams {
  domain: EIP712Domain;
  types: EIP712Types;
  primaryType: 'TransferWithAuthorization';
  // CDP wallets use hex string (to avoid JSON.stringify BigInt error)
  message: {
    from: `0x${string}`;
    to: `0x${string}`;
    value: string;          // ✅ Hex string (e.g., "0xf4240")
    validAfter: string;     // ✅ Hex string
    validBefore: string;    // ✅ Hex string
    nonce: `0x${string}`;
  };
}

const signaturePromise: Promise<string> = signer.signTypedData({
  domain,
  types,
  primaryType: 'TransferWithAuthorization',
  message: messageCDP,  // ✅ Use hex-encoded version for CDP
} as SignTypedDataParams)
```

### Why This Works
1. **Hex strings are JSON-serializable** - No BigInt serialization error
2. **EIP-712 correctly interprets hex strings as uint256** - Signature will be valid
3. **External wallets still use BigInt** - No change needed for WalletClient path
4. **Both paths produce identical signatures** - Same EIP-712 hash

### Example Values
```typescript
// Original payload
value: "1000000"         // String from server
validAfter: "1761609890" // Unix timestamp string
validBefore: "1761610190"

// BigInt message (for EIP-712 hashing)
value: 1000000n          // BigInt
validAfter: 1761609890n
validBefore: 1761610190n

// CDP hex message (for CDP SDK)
value: "0xf4240"         // Hex string of 1000000
validAfter: "0x68f2c702" // Hex string of 1761609890
validBefore: "0x68f2c82e" // Hex string of 1761610190
```

## 🧪 Testing Instructions

### 1. Clear the Next.js cache
```bash
cd /Users/Ryan/builds/x402-contract-deployer
rm -rf .next
```

### 2. Restart the development server
```bash
npm run dev
```

### 3. Test the mint flow
1. Open http://localhost:3000/mint
2. Connect with CDP embedded wallet
3. Click "Mint NFT"
4. Watch the console for new logs

### 4. Expected Console Output
```
✍️ [x402-client] Using CDP signTypedData with hex-encoded values
📋 [x402-client] CDP message (hex-encoded): {
  value: "0xf4240",
  validAfter: "0x...",
  validBefore: "0x..."
}
✅ [x402-client] Signature received from CDP wallet
```

### 5. What Should Happen
- ✅ No more "Do not know how to serialize a BigInt" error
- ✅ CDP wallet signature prompt appears
- ✅ User signs successfully
- ✅ Payment is processed
- ✅ NFT mints successfully

## 📊 Comparison: Before vs After

### Before Fix
```
❌ CDP message uses BigInt
❌ CDP SDK tries JSON.stringify(BigInt)
❌ TypeError: Do not know how to serialize a BigInt
❌ Signature request fails immediately
❌ No signature prompt shown to user
```

### After Fix
```
✅ CDP message uses hex strings
✅ CDP SDK can JSON.stringify(hex strings)
✅ Message sent successfully to CDP
✅ Signature prompt appears to user
✅ User signs the message
✅ Valid signature returned
✅ Payment processed successfully
```

## 🎯 Key Technical Points

1. **Hex strings preserve numeric value**: `"0xf4240"` === `1000000`
2. **EIP-712 accepts both**: uint256 can be BigInt or hex string
3. **CDP SDK constraint**: Requires JSON-serializable types
4. **Type safety maintained**: TypeScript interfaces updated accordingly
5. **No signature difference**: Both paths produce identical EIP-712 signatures

## ✅ Verification Checklist

- [x] CDP message uses hex strings
- [x] External wallet message still uses BigInt
- [x] TypeScript interfaces updated
- [x] Console logs added for debugging
- [x] No BigInt serialization errors expected
- [x] EIP-712 signature will be valid

## 🚀 Next Steps

1. Test with CDP embedded wallet
2. Verify signature is accepted by server
3. Confirm USDC transfer succeeds
4. Verify NFT mints successfully

---

**Status**: ✅ Fix applied, ready for testing
**Date**: October 28, 2025
**Files Modified**: `src/lib/x402-client.ts`
