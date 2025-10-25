# Send Feature Fixes - Chain Switching

## Issues Fixed ✅

### 1. **EVM Account Not Found Error**
**Problem**: Server actions can't access user-specific embedded wallets  
**Solution**: Moved to client-side wallet interactions using `window.ethereum`

### 2. **Wrong Chain Error**
**Problem**: Wallet on Ethereum mainnet (chain ID 1) trying to send on Base (chain ID 8453)  
**Solution**: Added automatic chain switching before transactions

---

## Implementation Details

### Client-Side Architecture

The Send feature now uses **client-side** wallet interactions:

```typescript
// EVM: Uses window.ethereum (injected by CDP)
const walletClient = createWalletClient({
  chain: chainConfig,
  transport: custom(window.ethereum),
});

// Solana: Uses window.solana (injected by CDP)
const provider = window.solana;
```

### Automatic Chain Switching

Before sending any EVM transaction, the code now:

1. **Checks current chain**
```typescript
const currentChainId = await window.ethereum.request({ 
  method: 'eth_chainId' 
});
```

2. **Compares with target chain**
```typescript
const targetChainId = `0x${chainConfig.id.toString(16)}`;
// Base = 0x2105 (8453)
// Base Sepolia = 0x14a34 (84532)
```

3. **Switches if needed**
```typescript
if (currentChainId !== targetChainId) {
  await window.ethereum.request({
    method: 'wallet_switchEthereumChain',
    params: [{ chainId: targetChainId }],
  });
}
```

---

## How It Works Now

### EVM Transaction Flow

```
User clicks "Confirm Send"
        ↓
Check current chain
        ↓
Chain mismatch detected?
    ↓           ↓
   YES         NO
    ↓           ↓
Switch chain  Continue
    ↓           ↓
CDP wallet prompts:
"Switch to Base?"
        ↓
User approves switch
        ↓
Create transaction
        ↓
CDP wallet prompts:
"Sign transaction?"
        ↓
User signs
        ↓
Transaction sent! 🎉
```

### What Users See

1. **First Send (Wrong Chain)**:
   - Click "Confirm Send"
   - CDP wallet: "Switch to Base?" → User clicks "Switch"
   - CDP wallet: "Sign transaction?" → User clicks "Sign"
   - Success!

2. **Subsequent Sends (Correct Chain)**:
   - Click "Confirm Send"
   - CDP wallet: "Sign transaction?" → User clicks "Sign"
   - Success!

---

## Key Changes Made

### SendTab.tsx

**Before** (Server Actions):
```typescript
const result = await sendEvmTransaction({
  fromAddress: userAddress,
  toAddress: recipientAddress,
  amount,
  // ...
});
```

**After** (Client-Side):
```typescript
const sendEvmTransaction = async () => {
  // Check and switch chain
  const currentChainId = await window.ethereum.request({ 
    method: 'eth_chainId' 
  });
  
  if (currentChainId !== targetChainId) {
    await window.ethereum.request({
      method: 'wallet_switchEthereumChain',
      params: [{ chainId: targetChainId }],
    });
  }
  
  // Send transaction
  const hash = await walletClient.sendTransaction({
    account: evmAddress,
    to: recipientAddress,
    value: amountInSmallestUnit,
  });
};
```

---

## Error Handling

### Chain Not Added (4902)
If user doesn't have Base in their wallet:
```typescript
catch (switchError) {
  if (switchError.code === 4902) {
    throw new Error('Please add Base to your wallet first');
  }
}
```

### User Rejects Switch
If user cancels the chain switch:
```typescript
// Error caught and displayed in UI
// User can try again
```

---

## Network Configuration

From `providers.tsx`:
```typescript
const isMainnet = process.env.NEXT_PUBLIC_ENABLE_MAINNET === 'true';
const chain = isMainnet ? base : baseSepolia;
```

### Chain IDs
- **Base Mainnet**: 8453 (0x2105)
- **Base Sepolia**: 84532 (0x14a34)
- **Ethereum Mainnet**: 1 (0x1)

---

## Testing Checklist

- [x] ✅ Fixed "EVM account not found" error
- [x] ✅ Added automatic chain switching
- [x] ✅ Added TypeScript declarations for window.ethereum
- [ ] ⚠️ Test EVM send on correct chain
- [ ] ⚠️ Test EVM send on wrong chain (auto-switch)
- [ ] ⚠️ Test user rejecting chain switch
- [ ] ⚠️ Test Solana send (separate issue)

---

## Next Steps

### For EVM ✅
Should work now! Test by:
1. Make sure wallet is on Ethereum mainnet (chain ID 1)
2. Try to send USDC on Base Sepolia
3. Wallet should prompt to switch chains
4. Approve switch
5. Transaction should go through

### For Solana ⚠️
Still needs investigation:
- Need to verify how CDP exposes Solana wallet in `window.solana`
- May need different approach for Solana transactions
- Will debug based on actual error messages

---

## Why This Approach?

### CDP Embedded Wallets
- **User-specific**: Each user has their own wallet
- **Client-side**: Wallets exist in browser, not on server
- **Server credentials**: CDP API keys are for project-level operations only
- **Solution**: Use client-side `window.ethereum` and `window.solana`

### Benefits
- ✅ Works with embedded wallets
- ✅ Users maintain control (approve each action)
- ✅ Automatic chain switching
- ✅ No "account not found" errors
- ✅ Proper wallet integration

---

## Common Issues & Solutions

### Issue: "Account not found"
**Cause**: Trying to use server actions with user wallets  
**Solution**: Use client-side wallet providers

### Issue: "Wrong chain"
**Cause**: Wallet on different network  
**Solution**: Auto-switch before sending (implemented!)

### Issue: "User rejected"
**Cause**: User canceled chain switch or signature  
**Solution**: Show error, allow retry

---

## Summary

**Status**: ✅ EVM transactions should work now!

**What we did**:
1. Moved from server actions to client-side
2. Added automatic chain switching
3. Proper error handling

**Try it**: Send a transaction and it should automatically switch to Base! 🚀
