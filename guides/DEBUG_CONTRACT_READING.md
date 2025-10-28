# 🔍 Contract Reading Debug Guide

## Issue: Showing "0 minted out of 402" instead of actual count

This issue is **NOT related to the wallet client fix** - that only affects signing, not contract reading.

---

## Quick Fixes (Try These First)

### 1. Restart Dev Server with Clean Cache
```bash
# Stop the dev server (Ctrl+C)
rm -rf .next
npm run dev
```

### 2. Check Server Logs
When you load the mint page, check your **terminal** (where `npm run dev` is running) for these logs:

**Expected logs:**
```
📊 [contract-stats] Configuration: {
  isMainnet: true,
  rpcUrl: 'https://api.developer.coinbase.com/rpc/v1/base/...',
  contractAddress: '0x362EbDDb00933852D80eBDCc8fA6c969dAE5268C',
  chain: 'Base Mainnet (8453)'
}
📡 [contract-stats] Reading totalSupply from contract...
✅ [contract-stats] Got totalSupply: 5
📊 [contract-stats] Stats: { supply: 5, remaining: 397, nextTokenId: 6 }
```

**If you see an error:**
```
❌ [contract-stats] Error fetching contract stats: [error details]
```

---

## Diagnosis Steps

### Check 1: Environment Variables
Verify your `.env.local` has these set:

```bash
cat .env.local | grep -E "ENABLE_MAINNET|NFT_CONTRACT|BASE_MAINNET_RPC"
```

**Should show:**
```
NEXT_PUBLIC_ENABLE_MAINNET=true
NEXT_PUBLIC_NFT_CONTRACT_ADDRESS=0x362EbDDb00933852D80eBDCc8fA6c969dAE5268C
NEXT_PUBLIC_BASE_MAINNET_RPC=https://api.developer.coinbase.com/rpc/v1/base/56fd1494-84cd-4757-8d5f-825b610598a9
```

### Check 2: Test Contract Directly
Run the test script:

```bash
npx tsx test-contract-read.ts
```

**Expected output:**
```
✅ Success! Total Supply: 5
```

**If it shows 0:**
- Contract address might be wrong
- RPC might be rate-limited
- Wrong network

### Check 3: Verify Contract on Explorer
Go to: https://basescan.org/address/0x362EbDDb00933852D80eBDCc8fA6c969dAE5268C

- Does the contract exist?
- Does it have a `totalSupply` function?
- What does the function return when you call it?

---

## Common Causes

### 1. Server-Side Environment Variables Not Loaded
**Problem:** Next.js server actions use `process.env`, not `process.env.NEXT_PUBLIC_*` for server-side values.

**Solution:** Make sure `.env.local` has BOTH:
```bash
NFT_CONTRACT_ADDRESS=0x362EbDDb00933852D80eBDCc8fA6c969dAE5268C
NEXT_PUBLIC_NFT_CONTRACT_ADDRESS=0x362EbDDb00933852D80eBDCc8fA6c969dAE5268C
```

**Fix the contract-stats.ts to use server-side env var:**

```typescript
// OLD (only works client-side):
const CONTRACT_ADDRESS = isMainnet 
  ? (process.env.NEXT_PUBLIC_NFT_CONTRACT_ADDRESS as `0x${string}`)
  : ...;

// NEW (works server-side):
const CONTRACT_ADDRESS = isMainnet 
  ? (process.env.NFT_CONTRACT_ADDRESS as `0x${string}`) || '0x362EbDDb00933852D80eBDCc8fA6c969dAE5268C' as `0x${string}`
  : ...;
```

### 2. RPC Rate Limiting
**Problem:** The Coinbase RPC might be rate-limited.

**Solution:** Try using Base's public RPC temporarily:
```bash
NEXT_PUBLIC_BASE_MAINNET_RPC=https://mainnet.base.org
```

### 3. Wrong Network
**Problem:** Reading from testnet instead of mainnet.

**Check:**
```bash
echo $NEXT_PUBLIC_ENABLE_MAINNET
# Should output: true
```

### 4. Contract Address Mismatch
**Problem:** The contract address variable name is inconsistent.

**Check `.env.local`:**
```bash
# You might have both of these:
NFT_CONTRACT_ADDRESS=0x362EbDDb00933852D80eBDCc8fA6c969dAE5268C
NEXT_PUBLIC_NFT_CONTRACT_ADDRESS=0x362EbDDb00933852D80eBDCc8fA6c969dAE5268C
```

The server action needs the non-NEXT_PUBLIC version!

---

## Immediate Fix

### Update contract-stats.ts to use correct env var:

```typescript
// At the top of the file, change this:
const CONTRACT_ADDRESS = isMainnet 
  ? (process.env.NFT_CONTRACT_ADDRESS as `0x${string}`) || (process.env.NEXT_PUBLIC_NFT_CONTRACT_ADDRESS as `0x${string}`) || '0x362EbDDb00933852D80eBDCc8fA6c969dAE5268C' as `0x${string}`
  : (process.env.NFT_CONTRACT_ADDRESS_TESTNET as `0x${string}`) || (process.env.NEXT_PUBLIC_NFT_CONTRACT_ADDRESS_TESTNET as `0x${string}`);
```

This will check both server-side and client-side env vars.

---

## Step-by-Step Debug Process

1. **Stop dev server** (Ctrl+C)

2. **Clear cache:**
   ```bash
   rm -rf .next
   ```

3. **Verify env vars:**
   ```bash
   cat .env.local | grep NFT_CONTRACT
   ```

4. **Restart server:**
   ```bash
   npm run dev
   ```

5. **Check terminal logs** when loading `/mint` page

6. **Look for:**
   - Is `isMainnet: true`?
   - Is `contractAddress` set correctly?
   - Is there an error message?

---

## Expected vs Actual

### What SHOULD Happen:
```
1. Load /mint page
2. Server action getContractStats() runs
3. Reads contract on Base Mainnet
4. Returns totalSupply: 5
5. Page shows "5 minted out of 402"
```

### What's ACTUALLY Happening:
```
1. Load /mint page
2. Server action getContractStats() runs
3. ??? (Check server logs)
4. Returns totalSupply: 0 (fallback data)
5. Page shows "0 minted out of 402"
```

The question is: What's happening in step 3?

---

## Quick Test Script

Create `debug-env.ts`:

```typescript
console.log('Environment Variables Check:');
console.log('='.repeat(50));
console.log('NEXT_PUBLIC_ENABLE_MAINNET:', process.env.NEXT_PUBLIC_ENABLE_MAINNET);
console.log('NFT_CONTRACT_ADDRESS:', process.env.NFT_CONTRACT_ADDRESS);
console.log('NEXT_PUBLIC_NFT_CONTRACT_ADDRESS:', process.env.NEXT_PUBLIC_NFT_CONTRACT_ADDRESS);
console.log('NEXT_PUBLIC_BASE_MAINNET_RPC:', process.env.NEXT_PUBLIC_BASE_MAINNET_RPC);
console.log('='.repeat(50));

const isMainnet = process.env.NEXT_PUBLIC_ENABLE_MAINNET === 'true';
const contractAddress = isMainnet 
  ? process.env.NFT_CONTRACT_ADDRESS || process.env.NEXT_PUBLIC_NFT_CONTRACT_ADDRESS
  : null;

console.log('\nComputed Values:');
console.log('isMainnet:', isMainnet);
console.log('contractAddress:', contractAddress);
```

Run with:
```bash
npx tsx debug-env.ts
```

---

## Need Help?

If none of these work, share:
1. The terminal output when loading the mint page
2. Output of `cat .env.local | grep NFT_CONTRACT`
3. Output of `npx tsx debug-env.ts`

---

**Most Likely Fix:** The server action is using `process.env.NEXT_PUBLIC_NFT_CONTRACT_ADDRESS` which might not be available server-side. Add `NFT_CONTRACT_ADDRESS` (without NEXT_PUBLIC) to `.env.local`.
