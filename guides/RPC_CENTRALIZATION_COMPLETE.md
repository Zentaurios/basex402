# ✅ RPC Centralization Complete

## Overview
All server-side blockchain RPC calls now use the centralized `rpc-config.ts` module. This ensures:
- **Single source of truth** for RPC URLs
- **Consistent retry logic** across all blockchain calls
- **Easier maintenance** - update RPC URLs in one place
- **Better debugging** - centralized logging and error handling

## Files Updated

### ✅ Core RPC Configuration
- `/src/lib/rpc-config.ts` - **Central configuration module**
  - Exports `createPublicRpcClient()` function with retry logic
  - Exports `RPC_CONFIG` object with chain info
  - Automatically switches between mainnet/testnet based on env

### ✅ API Routes
1. `/src/app/api/mint/route.ts`
   - Removed duplicate chain definitions
   - Now uses `createPublicRpcClient()`
   
2. `/src/app/api/metadata/[tokenId]/route.ts`
   - Removed duplicate viem client creation
   - Now uses `createPublicRpcClient()`

### ✅ Server Actions
1. `/src/app/actions/contract-stats.ts` (already updated in previous session)
   - Uses `createPublicRpcClient()`
   
2. `/src/app/actions/nft-balances.ts`
   - Removed chain imports
   - Now uses `createPublicRpcClient()`
   
3. `/src/app/actions/eth-balance.ts`
   - Removed chain imports
   - Now uses `createPublicRpcClient()`

## Not Changed (By Design)

### `/src/lib/wagmi-config.ts`
- **Intentionally kept separate** - wagmi has different requirements
- Used for client-side wallet interactions (not server-side contract reads)
- Has wagmi-specific features like batching, wallet connectors
- Uses same RPC URLs but with wagmi's own transport configuration

## Benefits

### Before (Decentralized)
```typescript
// Each file had its own:
const baseMainnetChain = { ... }
const baseSepoliaChain = { ... }
const client = createPublicClient({ 
  chain: isMainnet ? base : baseSepolia,
  transport: http()
})
```

### After (Centralized)
```typescript
// All files now use:
import { createPublicRpcClient } from '@/lib/rpc-config';
const client = createPublicRpcClient();
```

## RPC Configuration Details

```typescript
// /src/lib/rpc-config.ts
export const RPC_CONFIG = {
  isMainnet,
  chain: getCurrentChain(),        // base or baseSepolia
  rpcUrl: getPublicRpcUrl(),       // public RPC endpoint
  chainId: isMainnet ? 8453 : 84532,
  explorerUrl: isMainnet 
    ? 'https://basescan.org' 
    : 'https://sepolia.basescan.org',
}

// With built-in retry logic:
export function createPublicRpcClient() {
  return createPublicClient({
    chain: getCurrentChain(),
    transport: http(getPublicRpcUrl(), {
      retryCount: 3,
      retryDelay: 1000,
    })
  });
}
```

## Testing
To verify everything works:
1. Check contract stats load correctly
2. Try minting an NFT
3. Check NFT metadata API endpoints
4. Verify ETH and NFT balances display

## Next Steps
- ✅ RPC centralization complete
- 🔍 Now investigating: Payment/charging issues before NFT receipt
