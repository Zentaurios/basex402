# 🚀 Quick Test Checklist

## Pre-Test Setup
```bash
npm run dev
# Open http://localhost:3000/mint
# Open DevTools Console
```

## Test Flow

### 1️⃣ Connect Wallet
- [ ] Click "Connect Wallet"
- [ ] Sign in with email (CDP embedded wallet)
- [ ] Wait for wallet to initialize

### 2️⃣ Initiate Mint
- [ ] Click "Mint NFT" button
- [ ] Watch console output

### 3️⃣ Look for These Logs

#### ✅ SUCCESS - Look for ONE of these:
```
✅ [ATTEMPT 1] Success!        ← Best! Direct call works
✅ [ATTEMPT 2] Success!        ← Good! Wrapper format works
✅ [ATTEMPT 3] Success!        ← Good! Flat format works
⚠️ [ATTEMPT 4] Success with EOA!  ← Works but using fallback
```

#### ❌ FAILURE - You'll see:
```
❌ [ATTEMPT 1] Failed: ...
❌ [ATTEMPT 2] Failed: ...
❌ [ATTEMPT 3] Failed: ...
❌ [ATTEMPT 4] Failed: ...
❌ All CDP signing attempts failed
```

### 4️⃣ Sign Transaction
- [ ] Sign when prompted
- [ ] Wait for confirmation

### 5️⃣ Verify Success
- [ ] Toast shows "Successfully minted!"
- [ ] Success page displays
- [ ] Transaction link works

---

## 📊 What to Report Back

### If Successful ✅
```
✅ WORKED!
- Which attempt succeeded: ATTEMPT [1/2/3/4]
- Log snippet showing success
- NFT mint confirmed
```

### If Failed ❌
```
❌ FAILED
- Copy ALL 4 error messages from console
- Copy any network errors from DevTools
- Screenshot of final error message
```

---

## 🔧 Quick Fixes if Needed

### Error: "Wallet is still initializing"
→ Wait 5 seconds and try again

### Error: "Wrong network"
→ Should auto-switch to Base Sepolia

### All 4 attempts fail
→ Copy error messages and check:
1. CDP SDK version (`npm list @coinbase/cdp-hooks`)
2. Network requests in DevTools
3. Smart account has USDC balance

---

## 💡 Most Likely Outcome

**Prediction**: Attempt 1 or 2 will succeed  
**Reason**: These are the most common CDP patterns

If Attempt 4 succeeds (EOA fallback), that means smart account signing isn't supported, but the payment will still work since the EOA has USDC.

---

## 🎯 One-Line Test

```
Connect → Mint → Watch Console → Look for "✅ [ATTEMPT N] Success!" → Sign → Done
```

---

**Time estimate**: ~2 minutes  
**Risk level**: Low (fallbacks in place)
