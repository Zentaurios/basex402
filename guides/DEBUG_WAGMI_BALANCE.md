# Debug: Wagmi Balance Not Showing

## Issue
User has 0.0005 ETH showing on Basescan but it's not appearing in the WalletDropdown.

## Debug Changes Added

### 1. Added Chain ID to useBalance
The `useBalance` hook needs the `chainId` parameter to query the correct network:

```typescript
const isMainnet = process.env.NEXT_PUBLIC_ENABLE_MAINNET === 'true';
const chainId = isMainnet ? base.id : baseSepolia.id;

const { data: wagmiBalance, isLoading: wagmiBalanceLoading, error: wagmiBalanceError } = useBalance({
  address: (connectedWalletType === 'external' && activeChain === 'ethereum' && evmAddress) 
    ? evmAddress as `0x${string}` 
    : undefined,
  chainId: chainId,  // ✅ This is required!
});
```

### 2. Added Wallet Type Debugging
Logs wallet information on component mount:

```typescript
useEffect(() => {
  console.log('🔍 WalletDropdown: Wallet Type:', {
    connectedWalletType,  // Should be 'external' for MetaMask
    evmAddress,           // Your wallet address
    eoaAddress,           // EOA address (for embedded)
    smartAccountAddress,  // Smart account (for embedded)
    walletAddress,        // Active wallet address
  });
}, [connectedWalletType, evmAddress, eoaAddress, smartAccountAddress, walletAddress]);
```

### 3. Added Wagmi Balance Debugging
Logs wagmi balance fetch status:

```typescript
useEffect(() => {
  if (connectedWalletType === 'external' && activeChain === 'ethereum') {
    console.log('📊 Wagmi Balance Debug:', {
      address: evmAddress,
      chainId,              // Should be 8453 (mainnet) or 84532 (sepolia)
      balance: wagmiBalance,
      loading: wagmiBalanceLoading,
      error: wagmiBalanceError,  // Will show if RPC fails
    });
  }
}, [wagmiBalance, wagmiBalanceLoading, wagmiBalanceError, ...]);
```

## What to Check

### 1. Open Browser Console
Look for these logs after connecting your wallet:

```
🔍 WalletDropdown: Wallet Type: {
  connectedWalletType: 'external',  // ✅ Should be 'external' for MetaMask
  evmAddress: '0x...',               // ✅ Should be your address
  walletAddress: '0x...',            // ✅ Should match evmAddress
  ...
}

📊 Wagmi Balance Debug: {
  address: '0x...',
  chainId: 84532,                    // ✅ 84532 = Base Sepolia, 8453 = Base Mainnet
  balance: {
    value: 500000000000000n,         // ✅ 0.0005 ETH in wei
    decimals: 18,
    symbol: 'ETH',
    formatted: '0.0005'
  },
  loading: false,
  error: null                         // ✅ Should be null
}
```

### 2. Check for Issues

| Problem | Solution |
|---------|----------|
| `connectedWalletType` is NOT 'external' | Check WalletProvider - might be detecting embedded wallet |
| `chainId` doesn't match network | Check NEXT_PUBLIC_ENABLE_MAINNET env variable |
| `error` is not null | RPC endpoint issue - check wagmi-config.ts RPC URLs |
| `balance` is null/undefined | useBalance hook not working - check wagmi version |
| `evmAddress` is undefined | Wallet not connected properly via wagmi |

### 3. Verify Environment Variables

Check `.env.local`:
```bash
# For mainnet:
NEXT_PUBLIC_ENABLE_MAINNET=true
NEXT_PUBLIC_BASE_MAINNET_RPC=https://mainnet.base.org
# OR use Coinbase Cloud RPC:
# https://api.developer.coinbase.com/rpc/v1/base/YOUR_KEY

# For testnet:
NEXT_PUBLIC_ENABLE_MAINNET=false  
NEXT_PUBLIC_BASE_SEPOLIA_RPC=https://sepolia.base.org
```

### 4. Check wagmi Config

In `/src/lib/wagmi-config.ts`, verify:
- Chains match your environment (base or baseSepolia)
- RPC transport is configured correctly
- HTTP timeouts aren't too aggressive

## Expected Behavior

After these fixes, when you connect with MetaMask (or another external wallet):

1. Console shows wallet type as `'external'`
2. Console shows wagmi balance with your 0.0005 ETH
3. Assets tab displays ETH balance
4. Balance updates automatically when chain changes

## Testing Steps

1. Clear browser cache
2. Reload the page
3. Connect with MetaMask
4. Open wallet dropdown
5. Check Assets tab
6. Look at console logs

## Troubleshooting

If balance still doesn't show:

### Issue: "connectedWalletType is 'embedded' but I'm using MetaMask"
**Fix**: Check WalletProvider logic - it might be prioritizing CDP wallet detection

### Issue: "wagmiBalance is null"
**Fix**: 
1. Check if wagmi is properly configured in providers
2. Verify RPC endpoint is accessible
3. Try using public RPC: `https://mainnet.base.org`

### Issue: "chainId is wrong"
**Fix**: Check `NEXT_PUBLIC_ENABLE_MAINNET` environment variable

### Issue: "RPC error"
**Fix**: 
1. Check RPC URL in wagmi-config.ts
2. Try public endpoints
3. Check network connectivity

## Next Steps

Once console logging reveals the issue, we can:
1. Fix the wallet type detection if needed
2. Adjust RPC configuration if needed
3. Fix chain ID configuration if needed

The debug logs will tell us exactly what's happening!
