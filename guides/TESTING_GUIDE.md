# 🧪 Testing Guide: Embedded Wallet Fix

## Quick Start Testing

### 1️⃣ Start the Development Server
```bash
cd /Users/Ryan/builds/x402-contract-deployer
npm run dev
```

### 2️⃣ Test Embedded Wallet Flow

#### Step A: Sign In
1. Navigate to http://localhost:3000
2. Click "Connect Wallet"
3. Choose "Sign in with email"
4. Enter your email
5. Complete verification

**Expected Console Output:**
```
🔍 [useUnifiedWalletClient] Wallet state: {
  walletType: 'embedded',
  address: '0x44F6Db8E90B5B97fa08668Bdb2E968ad9A42e9A9',
  hasAddress: true
}
🔄 Creating wallet client for embedded wallet...
📍 Address from WalletProvider: 0x44F6...
🔧 Creating custom viem account from CDP account...
✅ Custom viem account created: {
  address: '0x44F6Db8E90B5B97fa08668Bdb2E968ad9A42e9A9',
  type: 'local',
  source: 'custom',
  hasSignTypedData: true,
  hasSignMessage: true,
  hasSignTransaction: true
}
✅ Created wallet client for embedded wallet
```

#### Step B: Navigate to Mint Page
1. Click "Mint NFT" or go to `/mint`
2. Should see your wallet address in the header
3. Should see "Mint 1 NFT (1 USDC)" button (NOT "Wallet client not available")

**Expected Console Output:**
```
🔍 useUnifiedWalletClient: {
  walletType: 'embedded',
  hasWalletClient: true,
  isLoading: false,
  address: '0x44F6...'
}
```

#### Step C: Mint NFT
1. Click "Mint 1 NFT (1 USDC)"
2. Watch the toast messages progress through steps
3. Approve the signature request when prompted

**Expected Toast Flow:**
```
📡 Step 1: Requesting mint from server...
💳 Step 2: Payment required - 1.00 USDC
✍️ Step 3: Please sign the payment authorization...
📤 Step 4: Submitting payment to server...
🎨 Step 5: Minting your NFT(s) on-chain...
🎉 Successfully minted 1 NFT!
```

**Expected Console Output:**
```
🌐 [x402-client] Making x402 request to: /api/mint
🔑 [x402-client] Wallet available: true
💳 [x402-client] Got 402 Payment Required
🔐 [x402-client] Creating payment header...
📝 [CDP Account] Signing typed data...
✅ [CDP Account] Typed data signed
✅ [x402-client] Payment header created
🎨 [x402-client] Payment accepted, calling onMinting callback...
✅ NFT(s) minted successfully
```

### 3️⃣ Test External Wallet Flow (Sanity Check)

1. Disconnect embedded wallet
2. Connect MetaMask or other external wallet
3. Try minting again

**Expected:** Should work exactly as before - no regressions

## 🔍 What to Look For

### ✅ Success Indicators

| Check | Expected Result |
|-------|----------------|
| Wallet address appears | ✅ Shows `0x...` address |
| Mint button enabled | ✅ "Mint X NFT(s)" button clickable |
| Wallet client created | ✅ Console shows "Created wallet client" |
| Custom account created | ✅ Console shows "Custom viem account created" |
| Signing works | ✅ Signature prompt appears |
| Transaction completes | ✅ Success message and transaction hash |

### ❌ Failure Indicators (Should NOT happen)

| Issue | What It Means |
|-------|---------------|
| "Wallet client not available" | Fix didn't work - account creation failed |
| `address: undefined` in console | Still using old buggy code |
| No signature prompt | Signing methods not properly wrapped |
| "Failed to sign payment" error | CDP signing method signature mismatch |

## 🐛 Debugging Tips

### If wallet client is not created:

```bash
# Check console for these errors:
❌ No CDP user found
❌ No EVM account found for user
❌ Failed to create embedded wallet client

# Solution:
1. Clear browser cache and cookies
2. Sign out and sign in again
3. Check that CDP_PROJECT_ID is correct in .env.local
```

### If signing fails:

```bash
# Check console for:
❌ [CDP Account] Failed to sign typed data

# This means the CDP account's signTypedData signature might be different
# Check CDP docs for the correct method signature
```

### If you see `toViemAccount` in the console:

```bash
# The old code is still running!
# Clear Next.js cache:
rm -rf .next
npm run dev
```

## 📊 Performance Metrics

The fix should have no performance impact:

| Metric | Expected |
|--------|----------|
| Wallet client creation | < 1 second |
| Signature request | < 5 seconds (user dependent) |
| Full mint flow | < 30 seconds |

## 🎯 Acceptance Criteria

All of these must pass:

- [ ] Embedded wallet connects successfully
- [ ] Address appears correctly in UI
- [ ] Wallet client is created (check console)
- [ ] Mint button is enabled
- [ ] Payment signature request appears
- [ ] User can approve signature
- [ ] NFT mints successfully
- [ ] External wallets still work
- [ ] No new errors in console

## 🚨 Rollback Plan

If the fix causes issues:

1. **Revert the file:**
   ```bash
   git checkout HEAD -- src/hooks/useUnifiedWalletClient.ts
   ```

2. **Restart dev server:**
   ```bash
   npm run dev
   ```

3. **Report the issue with:**
   - Console logs
   - Error messages
   - What step failed

## 📞 Support

If you encounter issues:

1. Check the console logs
2. Compare with expected outputs above
3. Review SOLUTION.md for technical details
4. Share full console output for debugging

---

**Last Updated:** Oct 26, 2025
**Status:** Ready for Testing ✅
