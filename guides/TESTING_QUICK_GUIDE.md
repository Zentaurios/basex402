# Quick Testing Guide

## 🚀 Test the Fix (5 minutes)

### Step 1: Clear Browser Storage
Open DevTools Console (F12) and run:
```javascript
localStorage.clear();
sessionStorage.clear();
location.reload();
```

This ensures you get a fresh CDP wallet session.

### Step 2: Start the Development Server
```bash
cd /Users/Ryan/builds/x402-contract-deployer
npm run dev
```

### Step 3: Connect Wallet
1. Go to http://localhost:3000/mint
2. Click "Connect to Mint"
3. Enter your email
4. Check for verification code

### Step 4: Test Minting
1. Once connected, click "Mint 1 NFT"
2. Watch the console logs:
   - Should show EOA address being used ✅
   - Should show payment message with same EOA address ✅
   - Should successfully sign and submit payment ✅

### Expected Console Output

#### ✅ Good - Addresses Match
```
🔍 [useX402Signer] CDP signing typed data... {
  eoaAddress: '0x5E0008Fa547064BF1feCeF0FbF091e8Df40B59d4',
  smartAccount: undefined  // No smart account!
}

📋 Message to sign: {
  from: '0x5E0008Fa547064BF1feCeF0FbF091e8Df40B59d4',  // SAME ADDRESS ✅
  to: '0xe5b0...',
  value: '1000000',
}

✅ Signature received
✅ NFT minted successfully
```

#### ❌ Bad - Would indicate problem
```
from: '0x44F6Db8E90B5B97fa08668Bdb2E968ad9A42e9A9',  // Smart Account
eoaAddress: '0x5E0008Fa547064BF1feCeF0FbF091e8Df40B59d4',  // Different! ❌
```

### Step 5: Verify Success
After minting, you should see:
- ✅ "Successfully minted 1 NFT!"
- ✅ Transaction hash displayed
- ✅ Links to view on block explorer and OpenSea

## 🐛 Troubleshooting

### Issue: Still seeing Smart Account address
**Solution:** Make sure you cleared localStorage and got a NEW wallet session

### Issue: "property 'address' is missing"
**Solution:** Check that providers.tsx has `createOnLogin: "eoa"` (not "smart")

### Issue: Signature rejected
**Solution:** Make sure you're on the correct network (Base or Base Sepolia)

## 📊 What Changed?

| Before (Smart Account) | After (EOA Only) |
|------------------------|------------------|
| Created EOA + Smart Account | Creates only EOA |
| Payment from: Smart Account | Payment from: EOA |
| Signed by: EOA | Signed by: EOA |
| ❌ Addresses don't match | ✅ Addresses match |
| ❌ Signature verification failed | ✅ Signature verification succeeds |

## 🎯 Success Checklist

- [ ] Fresh wallet session (cleared storage)
- [ ] Connected with email
- [ ] Clicked "Mint 1 NFT"
- [ ] Saw consistent EOA address in logs
- [ ] Payment signature succeeded
- [ ] NFT minted successfully
- [ ] Transaction hash received
- [ ] No address mismatch errors

## Need Help?

Check the console for detailed logs:
- All log messages are prefixed with emojis for easy scanning
- 🔍 = Debug info
- ✅ = Success
- ❌ = Error
- 📋 = Data dump

Look for the `[useX402Signer]` and `[x402-client]` prefixes to track the payment flow.
