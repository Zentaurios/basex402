# 🧪 Quick Testing Guide - EOA Wallet Mode

## Prerequisites
✅ CDP configuration changed to `createOnLogin: "eoa"`
✅ Dev server restarted
✅ Browser cache cleared

## 🚀 Testing Steps

### Step 1: Clear Everything
```bash
# Clear cache
rm -rf .next node_modules/.cache

# Restart dev server
npm run dev
```

In browser console:
```javascript
localStorage.clear();
sessionStorage.clear();
// Then refresh the page
location.reload();
```

### Step 2: Connect Wallet
1. Go to mint page: `http://localhost:3000/mint`
2. Click "Connect to Mint"
3. Enter your email
4. Complete CDP authentication

**Expected Console Output:**
```
🔍 [useX402Signer] Using CDP smart account wallet {
  walletType: 'embedded',
  address: '0x...',
  smartAccountAddress: '0x...',
  eoaAddress: '0x...',  // ← Should be present!
  signerAddress: '0x...',  // ← Should match eoaAddress
}
```

### Step 3: Start Mint
1. Select quantity (1-5 NFTs)
2. Click "Mint X NFT(s)"

**Expected Toast Messages:**
```
📡 Step 1: Requesting mint from server...
💳 Step 2: Payment required - X.00 USDC
✍️ Step 3: Please sign the payment authorization...
📤 Step 4: Submitting payment to server...
🎨 Step 5: Minting your NFT(s) on-chain...
🎉 Successfully minted X NFT(s)!
```

### Step 4: Check Signature Flow

**Expected Console Logs:**
```
✍️ [x402-client] Requesting signature...
🔐 [useX402Signer] Signing with EOA... {
  eoaAddress: '0x...',
  smartAccount: '0x...',
  messageFrom: '0x...'
}
✅ [useX402Signer] CDP signature successful
✅ [x402-client] Signature received
```

### Step 5: Verify Success
1. Check for success screen
2. Verify transaction on explorer
3. Check NFT on OpenSea

## ❌ Common Issues & Solutions

### Issue 1: "CDP EOA address not found"
**Cause:** Smart account mode still active OR wallet not fully initialized

**Solution:**
```javascript
// 1. Clear everything
localStorage.clear();
sessionStorage.clear();

// 2. Check providers.tsx
// Should be: createOnLogin: "eoa"

// 3. Restart dev server
// 4. Reconnect wallet
```

### Issue 2: "Security error: Address mismatch"
**Cause:** Cached smart account data conflicting with new EOA

**Solution:**
```javascript
// Clear CDP specific storage
Object.keys(localStorage).forEach(key => {
  if (key.includes('cdp') || key.includes('CDP')) {
    localStorage.removeItem(key);
  }
});

// Refresh and reconnect
location.reload();
```

### Issue 3: Signature Timeout
**Cause:** Wallet popup hidden or not responding

**Solution:**
- Check for hidden wallet popup window
- Refresh page and try again
- Check browser console for errors

### Issue 4: "Smart account cannot sign"
**Cause:** `createOnLogin` is still set to "smart"

**Solution:**
1. Verify `src/app/providers.tsx` line 39
2. Should be: `createOnLogin: "eoa"`
3. Restart dev server: `npm run dev`
4. Clear cache and reconnect

## ✅ Success Indicators

### Console Logs Should Show:
- ✅ `eoaAddress: '0x...'` in useX402Signer output
- ✅ `Signing with EOA...` in signature flow
- ✅ `CDP signature successful` after signing
- ✅ All 5 toast steps completing

### UI Should Show:
- ✅ Wallet connects successfully
- ✅ Mint button becomes active
- ✅ Signature request appears (email or popup)
- ✅ Success screen with NFT details
- ✅ Transaction link works

### Network Tab Should Show:
- ✅ POST to `/api/mint` with 402 response
- ✅ Second POST to `/api/mint` with `X-PAYMENT` header
- ✅ 200 OK with transaction details

## 🔍 Debug Commands

### Check Wallet Type:
```javascript
// In browser console
const walletType = localStorage.getItem('CDP:lastWalletType');
console.log('Wallet Type:', walletType); // Should show "embedded"
```

### Check CDP Config:
```javascript
// In providers.tsx, temporarily add:
console.log('CDP Config:', {
  createOnLogin: cdpConfig.ethereum.createOnLogin // Should be "eoa"
});
```

### Check Current User:
```javascript
// In useX402Signer.ts or WalletProvider.tsx, temporarily add:
console.log('Current User:', {
  evmAccounts: currentUser?.evmAccounts,
  evmSmartAccounts: currentUser?.evmSmartAccounts,
  eoaAddress: currentUser?.evmAccounts?.[0],
  smartAccountAddress: currentUser?.evmSmartAccounts?.[0]
});
```

## 🎯 Testing Checklist

- [ ] Clear cache and storage
- [ ] Restart dev server
- [ ] Connect wallet with email
- [ ] Verify eoaAddress in console
- [ ] Start mint process
- [ ] See all 5 toast steps
- [ ] Approve signature request
- [ ] Verify signature in console
- [ ] See success screen
- [ ] Check transaction on explorer
- [ ] Verify NFT on OpenSea

## 📊 Expected vs Actual

### Before (Smart Account Mode):
```
❌ createOnLogin: "smart"
❌ No eoaAddress available
❌ "Smart accounts cannot sign EIP-712" error
❌ Mint fails at signature step
```

### After (EOA Mode):
```
✅ createOnLogin: "eoa"
✅ eoaAddress present and used for signing
✅ EIP-712 signature successful
✅ x402 payment completes
✅ NFT minted successfully
```

## 🚨 Emergency Reset

If nothing works, do a complete reset:

```bash
# 1. Clear all caches
rm -rf .next
rm -rf node_modules/.cache
rm -rf .turbo

# 2. Clear CDP data
# In browser console:
localStorage.clear();
sessionStorage.clear();
Object.keys(localStorage).forEach(key => localStorage.removeItem(key));

# 3. Reinstall dependencies (if needed)
npm install

# 4. Restart dev server
npm run dev

# 5. Reconnect wallet
# Go to /mint and connect fresh
```

## 📝 Notes

- **First-time users:** Will automatically get EOA
- **Existing users:** Need to disconnect and reconnect
- **Smart account data:** Still present but unused
- **Future migration:** Can switch back to smart accounts if needed

---

**Last Updated:** 2025-10-27  
**Status:** Ready to Test
