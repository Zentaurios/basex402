# BigInt Serialization Fix for CDP Wallet Signing

## 🐛 The Problem

CDP embedded wallets were failing to sign x402 payment authorizations with this error:

```
TypeError: Do not know how to serialize a BigInt
at JSON.stringify (<anonymous>)
```

### Root Cause

The CDP SDK internally uses `JSON.stringify()` to serialize the typed data message before sending it to their API. However, JavaScript's native `JSON.stringify()` cannot serialize `BigInt` values:

```javascript
// This fails:
JSON.stringify({ value: 1000000n })
// TypeError: Do not know how to serialize a BigInt

// This works:
JSON.stringify({ value: "1000000" })
// {"value":"1000000"}
```

### Why This Happened

The EIP-712 typed data spec uses `uint256` types, which we correctly represented as `BigInt` in JavaScript for external wallets (viem requires BigInt). However, CDP's SDK expects these values as **strings** instead.

**Our original code:**
```typescript
message: {
  from: '0x...',
  to: '0x...',
  value: BigInt('1000000'),      // ❌ CDP can't serialize this
  validAfter: BigInt('1234567'), // ❌ CDP can't serialize this
  validBefore: BigInt('2345678'), // ❌ CDP can't serialize this
  nonce: '0x...',
}
```

## ✅ The Solution

Added a `BigInt` to `string` converter in the `useX402Signer` hook that runs before passing data to CDP's `signEvmTypedData()`:

```typescript
// Convert message BigInt values to strings for CDP
const convertBigIntToString = (obj: any): any => {
  if (typeof obj === 'bigint') {
    return obj.toString();
  }
  if (typeof obj === 'object' && obj !== null) {
    const newObj: any = Array.isArray(obj) ? [] : {};
    for (const key in obj) {
      newObj[key] = convertBigIntToString(obj[key]);
    }
    return newObj;
  }
  return obj;
};

const cdpMessage = convertBigIntToString(params.message);
```

This recursively converts all `BigInt` values to strings while preserving the object structure.

**After conversion:**
```typescript
message: {
  from: '0x...',
  to: '0x...',
  value: "1000000",      // ✅ CDP can serialize this
  validAfter: "1234567", // ✅ CDP can serialize this
  validBefore: "2345678", // ✅ CDP can serialize this
  nonce: '0x...',
}
```

## 🔧 Implementation Details

### File Modified
`/src/hooks/useX402Signer.ts`

### Key Changes
1. Added `convertBigIntToString()` helper function
2. Converts message before passing to `signEvmTypedData()`
3. Only affects CDP wallets - external wallets still use BigInt

### Why This Works
- **External wallets (wagmi/viem)**: Still receive `BigInt` values as expected
- **CDP embedded wallets**: Receive `string` values that CDP can serialize
- **EIP-712 signature**: Identical regardless of whether we use BigInt or string internally

The EIP-712 signing algorithm produces the same signature whether you pass `BigInt(1000000)` or `"1000000"` because it converts both to the same byte representation.

## 🧪 Testing

### Expected Console Logs (Success)
```
✍️ [useX402Signer] CDP signing typed data...
📝 [useX402Signer] Converted message for CDP: {
  from: '0x...',
  to: '0x...',
  value: "1000000",
  validAfter: "1761550582",
  validBefore: "1761550882",
  nonce: '0x...'
}
✅ [useX402Signer] CDP signature received
✅ [x402-client] Signature received: 0x...
✅ [x402-client] Payment authorization signed successfully
```

### Testing Steps
1. Connect with CDP embedded wallet (email)
2. Navigate to mint page
3. Click "Mint NFT"
4. Should see signature prompt in CDP modal
5. Approve signature
6. x402 payment should complete successfully
7. NFT should be minted

## 📊 Technical Comparison

| Wallet Type | Value Type | Works? | Reason |
|-------------|-----------|--------|--------|
| External (wagmi) | `BigInt` | ✅ Yes | Viem natively handles BigInt |
| CDP (before fix) | `BigInt` | ❌ No | CDP uses JSON.stringify internally |
| CDP (after fix) | `string` | ✅ Yes | JSON.stringify works with strings |

## 🎯 Key Takeaways

1. **BigInt is not JSON-serializable** - Always convert to string when using APIs that serialize internally
2. **Different wallet SDKs have different requirements** - External wallet libraries (viem) use BigInt, CDP uses strings
3. **EIP-712 signatures are the same** - Both BigInt and string produce identical signatures for uint256 types
4. **Recursive conversion is important** - The converter handles nested objects and arrays

## 📚 Related Documentation

- [JSON.stringify BigInt Issue](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/BigInt#use_within_json)
- [EIP-712 Typed Data](https://eips.ethereum.org/EIPS/eip-712)
- [CDP Sign Typed Data](https://docs.cdp.coinbase.com/embedded-wallets/evm-features/eip-712-signing)

## ✅ Status

**Fixed and Ready for Testing**

The CDP wallet should now successfully sign x402 payment authorizations without the BigInt serialization error.

---

**Previous Issue**: `useWalletClient` not exported from `@coinbase/cdp-react`  
**Status**: ✅ Fixed - Using `useSignEvmTypedData` from `@coinbase/cdp-hooks`

**Current Issue**: BigInt serialization error  
**Status**: ✅ Fixed - Converting BigInt to string for CDP wallets
