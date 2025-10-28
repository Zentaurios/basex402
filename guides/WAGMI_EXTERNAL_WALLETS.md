# Using Wagmi Hooks for External Wallets

## Overview
Updated the `WalletDropdown` component to use **wagmi hooks directly** for external wallet connections (MetaMask, Coinbase Wallet, etc.) instead of server actions. This is simpler, faster, and follows best practices.

## Why Use Wagmi for External Wallets?

### Benefits:
1. **✅ Client-side**: No server round-trip needed
2. **✅ Real-time**: Automatic updates when balance changes
3. **✅ Standard**: Follows wagmi's best practices
4. **✅ Simpler**: Less code, no server actions needed
5. **✅ Type-safe**: Full TypeScript support from wagmi

### When to Use What:
- **External Wallets** (MetaMask, etc.): Use wagmi hooks ✅
- **Embedded Wallets** (CDP): Use server actions (required for CDP SDK) ✅

## Changes Made

### 1. Added `useBalance` Hook
```typescript
import { useDisconnect, useBalance } from 'wagmi';

// Use wagmi's useBalance for external wallets
const { data: wagmiBalance } = useBalance({
  address: (connectedWalletType === 'external' && activeChain === 'ethereum' && evmAddress) 
    ? evmAddress as `0x${string}` 
    : undefined,
});
```

### 2. Updated Balance Fetching Logic
```typescript
if (connectedWalletType === 'external' && wagmiBalance) {
  // Use wagmi balance directly (client-side)
  console.log('🔍 Using wagmi balance for external wallet:', evmAddress);
  
  tokenBalances = [{
    amount: {
      amount: wagmiBalance.value.toString(),
      decimals: wagmiBalance.decimals,
    },
    token: {
      network: network,
      symbol: wagmiBalance.symbol,
      name: 'Ethereum',
      contractAddress: '0x0000000000000000000000000000000000000000',
    },
  }];
}
else if (connectedWalletType === 'embedded') {
  // Use server actions for embedded wallets (CDP)
  tokenBalances = await getTokenBalances(addressToQuery);
  // ... also check Smart Account for ETH
}
```

## Example: Wagmi Hooks in Action

Based on your example, here are the key wagmi hooks we can use:

### For Balance (Already Implemented)
```typescript
const { data: balance } = useBalance({
  address: '0x...',
});
// Returns: { value: BigInt, decimals: number, symbol: string, formatted: string }
```

### For Sending Transactions (Can be Added)
```typescript
const { data: hash, sendTransaction, isPending } = useSendTransaction();

sendTransaction({
  to: '0x...',
  value: parseEther('0.01'),
});
```

### For Transaction Receipts (Can be Added)
```typescript
const { isLoading, isSuccess } = useWaitForTransactionReceipt({
  hash,
});
```

## Current Implementation

### External Wallets (MetaMask, etc.):
- ✅ Balance: Using `useBalance` hook (client-side)
- 📝 TODO: Could add `useSendTransaction` for sending (currently uses server action)
- 📝 TODO: Could fetch ERC-20 tokens via CDP API or other methods

### Embedded Wallets (CDP):
- ✅ Balance: Using server actions with CDP SDK
- ✅ Combines EOA + Smart Account ETH
- ✅ Fetches all ERC-20 tokens from CDP API
- ✅ Uses CDP hooks for transactions

## Benefits Realized

1. **Faster Balance Updates**: External wallets now show balance instantly via wagmi
2. **No Server Load**: Balance checks for external wallets don't hit your server
3. **Auto-refresh**: wagmi automatically refetches when blocks change
4. **Better UX**: No loading spinner for external wallet balances

## Future Enhancements

### Add ERC-20 Token Support for External Wallets
Currently external wallets only show ETH. Could add:
- CDP API for token balances
- Alchemy/Infura token APIs
- Or other token balance services

### Use Wagmi for Sending (External Wallets)
The `SendTab` component could use `useSendTransaction` for external wallets:
```typescript
if (walletType === 'external') {
  // Use wagmi
  sendTransaction({ to, value });
} else {
  // Use CDP hooks
  sendUserOperation({ ... });
}
```

## Testing
1. Connect with MetaMask (external wallet)
2. Check Assets tab - ETH should load instantly
3. Console shows: `🔍 Using wagmi balance for external wallet: 0x...`
4. No server round-trip needed!

## Related Files
- `/src/components/wallet/WalletDropdown.tsx` - Updated to use wagmi
- `/src/components/wallet/SendTab.tsx` - Could be updated to use wagmi for external wallets
- `/src/app/actions/token-balances.ts` - Still used for embedded wallets
- `/src/app/actions/eth-balance.ts` - Still used for Smart Account ETH check

## Documentation References
- [Wagmi Hooks](https://wagmi.sh/react/hooks/useBalance)
- [useSendTransaction Example](https://wagmi.sh/react/hooks/useSendTransaction)
- [useWaitForTransactionReceipt](https://wagmi.sh/react/hooks/useWaitForTransactionReceipt)
