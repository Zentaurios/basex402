# Quick Testing Guide - Smart Account Version

## 🚀 Test the Smart Account Fix (5 minutes)

### What Changed?
We're now signing with the **smart account address** instead of the EOA. This means:
- ✅ Smart account features retained (gas abstraction, etc.)
- ✅ USDC stays in smart account
- ✅ Signature matches payment source
- ✅ x402 payments work!

### Step 1: Test with Existing Wallet (Recommended)
If you already have a CDP wallet connected:
```bash
# Just refresh the page - no need to clear storage!
# Your existing smart account should work now
```

### Step 2: OR Start Fresh (If Issues)
To test with a brand new wallet:
```javascript
// In browser DevTools Console (F12)
localStorage.clear();
sessionStorage.clear();
location.reload();
```

### Step 3: Start Development Server
```bash
cd /Users/Ryan/builds/x402-contract-deployer
npm run dev
```

### Step 4: Connect & Test
1. Go to http://localhost:3000/mint
2. Click "Connect to Mint"
3. Sign in with email
4. Click "Mint 1 NFT"
5. Approve the signature request

## 📊 Expected Console Output

### ✅ Success Pattern

```javascript
// Step 1: Wallet Detection
🔍 [useX402Signer] Using CDP smart account wallet {
  walletType: 'embedded',
  address: '0x44F6Db8E90B5B97fa08668Bdb2E968ad9A42e9A9',  // Smart Account!
  smartAccountAddress: '0x44F6Db8E90B5B97fa08668Bdb2E968ad9A42e9A9',
  eoaAddress: '0x5E0008Fa547064BF1feCeF0FbF091e8Df40B59d4',  // (internal)
  hasSignTypedData: true
}

// Step 2: Creating Payment Message
📋 [x402-client] Message to sign: {
  from: '0x44F6Db8E90B5B97fa08668Bdb2E968ad9A42e9A9',  // Smart Account
  to: '0xe5b0...',
  value: '1000000',
}

// Step 3: Signing with Smart Account
✍️ [useX402Signer] CDP smart account signing typed data...
🔍 [useX402Signer] Calling CDP signEvmTypedData with SMART ACCOUNT address: 0x44F6...

// Step 4: Success!
✅ [x402-client] Signature received
✅ [x402-client] Payment authorization signed successfully
✅ [x402-client] Payment accepted, calling onMinting callback...
🎉 Successfully minted 1 NFT!
```

### Key Things to Verify

1. **Address Consistency:**
   ```javascript
   // All should be the SAME address (smart account):
   address: '0x44F6...'
   from: '0x44F6...'
   smartAccountAddress: '0x44F6...'
   ```

2. **Signing Method:**
   ```javascript
   // Should say "SMART ACCOUNT address", not "EOA address":
   🔍 Calling CDP signEvmTypedData with SMART ACCOUNT address: 0x44F6...
   ✅ Correct!
   
   // NOT this:
   🔍 Calling CDP signEvmTypedData with address: 0x5E00...
   ❌ Wrong!
   ```

3. **No Errors:**
   - No "property 'address' is missing"
   - No "address mismatch"
   - No 400 Bad Request

## 🐛 Troubleshooting

### Issue: Still seeing EOA address in signing logs
**Symptom:**
```javascript
Calling CDP signEvmTypedData with address: 0x5E00...  // EOA
```

**Solution:** 
- Make sure you pulled the latest code
- Check that `useX402Signer.ts` has `address: cdpAddress` in the signing call
- Restart dev server

### Issue: "property 'address' is missing"
**Symptom:**
```
400 Bad Request
property "address" is missing
```

**Root Cause:** Signature doesn't match the `from` address

**Solution:**
- Verify logs show same address throughout
- Clear browser cache and reconnect
- Check that smart account is being used for signing

### Issue: Signature rejected by user
**Symptom:**
```
❌ User rejected the signature request
```

**Solution:**
- This is normal if you canceled the signature
- Try again and approve the signature request
- Make sure wallet popup isn't hidden

## 🎯 Verification Checklist

After successful mint, verify:

- [ ] Console shows "Using CDP smart account wallet"
- [ ] Smart account address used throughout (not EOA)
- [ ] `from` address matches smart account address
- [ ] Signature succeeds
- [ ] Payment accepted
- [ ] NFT minted successfully
- [ ] Transaction hash received
- [ ] Can view NFT on OpenSea

## 📱 What You Should See

### In the Browser
1. **Connect wallet** → Email verification → Connected!
2. **Mint button** → Click → Signature popup appears
3. **Approve signature** → "Minting..." → Success message!
4. **View NFT** → Links to block explorer & OpenSea work

### In the Console (DevTools)
1. Blue 🔍 logs showing wallet detection
2. Yellow ✍️ logs showing signing process
3. Green ✅ logs showing success
4. No red ❌ errors

## 🎓 Understanding the Flow

```
┌─────────────────────────────────────────────┐
│ 1. User signs in with email                │
│    → CDP creates Smart Account (0x44F6...) │
│    → (Also creates EOA 0x5E00... internal) │
└─────────────────────────────────────────────┘
                    ↓
┌─────────────────────────────────────────────┐
│ 2. User clicks "Mint NFT"                   │
│    → App requests payment of 1 USDC         │
│    → From: Smart Account (0x44F6...)        │
└─────────────────────────────────────────────┘
                    ↓
┌─────────────────────────────────────────────┐
│ 3. Create payment authorization             │
│    → Message: "Pay from 0x44F6..."          │
│    → Sign with: 0x44F6... (Smart Account!)  │
└─────────────────────────────────────────────┘
                    ↓
┌─────────────────────────────────────────────┐
│ 4. CDP signs with smart account             │
│    → Uses passkey/auth method               │
│    → Generates valid EIP-712 signature      │
│    → Signature cryptographically valid ✅   │
└─────────────────────────────────────────────┘
                    ↓
┌─────────────────────────────────────────────┐
│ 5. Server verifies signature                │
│    → Checks: signature from 0x44F6...? ✅   │
│    → Addresses match ✅                      │
│    → Executes USDC transfer ✅              │
│    → Mints NFT ✅                            │
└─────────────────────────────────────────────┘
```

## 🔍 Debug Commands

If you need to inspect the wallet state:

```javascript
// In browser console:

// Check CDP wallet info
console.log('Smart Account:', window.localStorage.getItem('cdp-smart-account'));

// Check what's in the context
console.log('All localStorage:', {...localStorage});

// Force reconnect (if needed)
localStorage.removeItem('wagmi.store');
sessionStorage.clear();
location.reload();
```

## 💡 Key Insights

1. **Smart accounts CAN sign EIP-712 messages** 
   - Via CDP's infrastructure
   - Using your passkey/authentication
   - No need for private key management

2. **USDC stays in smart account**
   - Not moved to EOA
   - Direct payment from smart account
   - Better UX!

3. **Addresses must match**
   - Signer address = Payment from address
   - Both are the smart account
   - This is what makes it work ✅

## 🎉 Success!

When you see:
```
🎉 Successfully minted 1 NFT!
```

You've successfully:
- ✅ Used a smart account wallet
- ✅ Signed an EIP-3009 authorization
- ✅ Paid with USDC from smart account
- ✅ Minted an NFT via x402 protocol
- ✅ Experienced seamless crypto payments!

Welcome to the future of Web3 UX! 🚀
