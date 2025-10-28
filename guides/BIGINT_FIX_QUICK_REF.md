# 🎯 BigInt Fix - Quick Reference

## The Problem
```javascript
// ❌ This failed
message: {
  value: BigInt(1000000),  // CDP SDK can't serialize BigInt
  ...
}
// Error: TypeError: Do not know how to serialize a BigInt
```

## The Solution
```javascript
// ✅ This works
const messageCDP = {
  value: '0x' + BigInt(1000000).toString(16),  // "0xf4240"
  validAfter: '0x' + BigInt(timestamp).toString(16),
  validBefore: '0x' + BigInt(timestamp).toString(16),
  nonce: nonce,
};
// CDP SDK can serialize hex strings ✅
```

## Why It Works
- Hex strings = JSON serializable ✅
- EIP-712 interprets hex strings as uint256 ✅
- Same signature as BigInt ✅
- CDP SDK happy ✅

## Testing
```bash
# 1. Clear cache
rm -rf .next

# 2. Restart server
npm run dev

# 3. Test mint with CDP wallet
# Look for: "Using CDP signTypedData with hex-encoded values"
```

## Expected Logs
```
✍️ [x402-client] Using CDP signTypedData with hex-encoded values
📋 [x402-client] CDP message (hex-encoded): { value: "0xf4240", ... }
✅ [x402-client] Signature received from CDP wallet
```

## Files Changed
- `/src/lib/x402-client.ts` (lines 280-357)

---
**Status**: ✅ Ready to test
