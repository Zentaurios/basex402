# How to Debug CDP Balance Issue

## Quick Test

I've added comprehensive logging and a test function. Here's how to debug:

### Option 1: Use the Browser Console (Easiest)

1. **Open your app and connect your wallet**
2. **Open Browser DevTools Console** (F12)
3. **Look for these logs** when you open the wallet dropdown:

```
🔍 WalletDropdown: Wallet Type: {
  connectedWalletType: 'embedded',  // ← Should say 'embedded' for CDP wallet
  evmAddress: '0x...',
  eoaAddress: '0x...',              // ← Your EOA address
  smartAccountAddress: '0x...',     // ← Your Smart Account
}

📊 [getTokenBalances] Fetching balances for: 0x...
📊 [getTokenBalances] Using network: base-sepolia
📊 [getTokenBalances] CDP returned: {
  balanceCount: 2,
  tokens: ['USDC (1000000)', 'ETH (500000000000000)']  // ← Should see ETH here!
}
📊 [getTokenBalances] CDP included ETH? true
```

### Option 2: Add Test to a Page (For Deep Debugging)

If console logs aren't enough, add this to any page:

**In `/src/app/page.tsx`** (or any page):

```typescript
import { testCdpBalances } from '@/app/actions/test-cdp-balances';

// Inside your component, add a button:
<button onClick={async () => {
  const result = await testCdpBalances(
    '0xYOUR_EOA_ADDRESS_HERE',  // ← Your EOA address
    'base-sepolia'               // or 'base' for mainnet
  );
  console.log('Test result:', result);
}}>
  Test CDP Balance
</button>
```

This will show detailed output like:
```
🧪 === CDP BALANCE TEST ===
Address: 0x5b76f5B8fc9D700624F78208132f91AD4e61a1f0
Network: base-sepolia

✅ CDP Response:
Total balances found: 2

[0] USDC
  Amount: 1000000
  Decimals: 6
  Contract: 0x036CbD53842c5426634e7929541eC2318f3dCF7e
  Name: USD Coin

[1] ETH
  Amount: 500000000000000
  Decimals: 18
  Contract: 0x0000000000000000000000000000000000000000
  Name: Ethereum
  
💰 ETH Balance Found!
  Amount: 500000000000000
  In ETH: 0.000500

🧪 === END TEST ===
```

## What to Look For

### ✅ Success Case
```
📊 [getTokenBalances] CDP returned: {
  balanceCount: 2,
  tokens: ['USDC (1000000)', 'ETH (500000000000000)']
}
📊 [getTokenBalances] CDP included ETH? true
```
**Result**: ETH should show in your wallet! ✨

### ⚠️ CDP Doesn't Include ETH
```
📊 [getTokenBalances] CDP returned: {
  balanceCount: 1,
  tokens: ['USDC (1000000)']
}
📊 [getTokenBalances] CDP included ETH? false
⚠️ [getTokenBalances] CDP did not include ETH, fetching via viem...
📊 [getTokenBalances] Viem ETH balance: 500000000000000
```
**Result**: Falls back to viem, ETH should still show

### ❌ Error Cases

**Error 1: No balances returned**
```
📊 [getTokenBalances] CDP returned: {
  balanceCount: 0,
  tokens: []
}
```
**Cause**: Address has no tokens or CDP can't access it  
**Fix**: Check if address is correct

**Error 2: CDP Error**
```
❌ [getTokenBalances] Error fetching token balances: Error: ...
```
**Cause**: CDP API credentials or network issue  
**Fix**: Check environment variables:
- `CDP_API_KEY_ID`
- `CDP_API_KEY_SECRET`

**Error 3: Wrong wallet type**
```
🔍 WalletDropdown: Wallet Type: {
  connectedWalletType: 'external',  // ← Should be 'embedded'!
}
```
**Cause**: App thinks you're using MetaMask, not CDP  
**Fix**: Check WalletProvider logic

## Common Issues & Fixes

### Issue: "I see USDC but not ETH"

**Check 1**: Look at console logs
- Does CDP return ETH? Look for `'ETH (500000000000000)'` in tokens array
- If yes but not showing: Check spam filter in `filterTokens`

**Check 2**: Check your address
- Make sure you're querying your EOA address, not Smart Account
- Console should show: `Fetching balances for: 0xYOUR_EOA_ADDRESS`

**Check 3**: Check Smart Account
- ETH might still be on Smart Account
- Look for logs: `🔍 Also checking Smart Account for ETH:`
- Should combine balances from both addresses

### Issue: "No balances at all"

**Check CDP credentials**:
```bash
# In .env.local
CDP_API_KEY_ID=your_key_id
CDP_API_KEY_SECRET=your_secret
```

**Check network**:
- Make sure `NEXT_PUBLIC_ENABLE_MAINNET` matches where your ETH is
- Sepolia ETH won't show if you're on mainnet!

## Still Not Working?

**Share these console logs**:
1. The `🔍 WalletDropdown: Wallet Type:` log
2. The `📊 [getTokenBalances]` logs (all 3 lines)
3. Any error messages

This will tell us exactly what's happening!

## Files Changed
- ✅ `/src/app/actions/token-balances.ts` - Now uses CDP's ETH + adds logging
- ✅ `/src/app/actions/test-cdp-balances.ts` - New test function
- ✅ `/src/components/wallet/WalletDropdown.tsx` - Has debug logging

## Quick Checklist

- [ ] Open browser console
- [ ] Connect wallet
- [ ] Open wallet dropdown
- [ ] Check for `📊 [getTokenBalances]` logs
- [ ] See if CDP included ETH in response
- [ ] Check if balances show in UI
- [ ] Share console output if still not working
