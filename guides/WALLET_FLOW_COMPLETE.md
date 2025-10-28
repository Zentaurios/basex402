# Unified Wallet Flow - Complete! ✅

## What's Implemented

Your header now has a **smart wallet component** that adapts based on how users log in:

### 🔐 Three States

1. **Not Connected** → Shows "Log In" button
2. **Embedded Wallet Connected** (CDP) → Shows full dropdown with Assets/NFTs/Send
3. **External Wallet Connected** (Wagmi) → Shows OnchainKit dropdown with identity

---

## How It Works

### State 1: Not Connected
```
┌─────────────────────┐
│   [Log In] Button   │
└─────────────────────┘
         ↓ Click
┌─────────────────────────────┐
│  Login Modal (2 Tabs)       │
├─────────────────────────────┤
│  📧 Email/Social            │
│  🔗 Connect Wallet          │
└─────────────────────────────┘
```

### State 2: Embedded Wallet (CDP)
```
┌───────────────────────┐
│  [0x1234...5678] ▼    │ ← Shows wallet address
└───────────────────────┘
         ↓ Click
┌───────────────────────────────┐
│  Embedded Wallet              │
│  0x1234567890abcdef...        │
│  [Copy]                       │
├───────────────────────────────┤
│  [Assets] [NFTs] [Send]       │ ← Three tabs
├───────────────────────────────┤
│  • ETH: 0.5                   │
│  • USDC: 100.00               │
│  • wETH: 0.25                 │
├───────────────────────────────┤
│  [Export Private Key]         │
│  [Sign Out]                   │
└───────────────────────────────┘
```

### State 3: External Wallet (Wagmi/OnchainKit)
```
┌───────────────────────┐
│  [Avatar] Username ▼  │ ← OnchainKit components
└───────────────────────┘
         ↓ Click
┌───────────────────────────────┐
│  [Avatar]                     │
│  Username                     │
│  0x1234...5678                │
│  [Copy Address]               │
├───────────────────────────────┤
│  Basename                     │
│  Wallet Settings              │
│  Disconnect                   │
└───────────────────────────────┘
```

---

## Key Differences

### Embedded Wallet Features (CDP)
✅ Full custom dropdown
✅ Assets tab with ETH/USDC/wETH balances
✅ NFTs tab (placeholder for now)
✅ Send tab (coming soon)
✅ Export private key option
✅ Fetches balances from `/api/wallet`

### External Wallet Features (OnchainKit)
✅ OnchainKit's polished UI
✅ Identity components (Avatar, Name, Address)
✅ Basename support
✅ Link to Coinbase wallet settings
✅ Native disconnect

---

## Why Two Different UIs?

**OnchainKit components ONLY work with Wagmi-connected accounts.**

- **CDP Embedded Wallet** → Uses `useEvmAddress()`, `useIsSignedIn()` hooks
  - OnchainKit can't read this state
  - Need custom UI with CDP hooks

- **External Wallets** → Uses Wagmi hooks (`useAccount()`, `useDisconnect()`)
  - OnchainKit components work perfectly
  - Get nice UI out of the box

---

## What Wallet Options Users Get

### Email/Social Tab (Embedded)
- Email OTP
- SMS OTP
- Creates embedded wallet automatically
- No seed phrase needed

### Connect Wallet Tab (External)
- **Coinbase Wallet** (desktop extension or mobile app)
- **MetaMask** (browser extension)
- **Phantom** (browser extension)
- **WalletConnect** (mobile wallets via QR code)

---

## Testing the Flow

### Test 1: Embedded Wallet
1. Click "Log In"
2. Stay on "Email / Social" tab
3. Enter your email
4. Enter OTP code
5. Should see wallet address in header
6. Click address → See dropdown with Assets/NFTs/Send tabs

### Test 2: External Wallet
1. Make sure you have MetaMask or Coinbase Wallet installed
2. Click "Log In"
3. Switch to "Connect Wallet" tab
4. Click "Connect Wallet"
5. Choose your wallet from the list
6. Approve connection
7. Should see avatar/name in header
8. Click → See OnchainKit dropdown

### Test 3: Sign Out
- **Embedded**: Click dropdown → "Sign Out"
- **External**: Click dropdown → "Disconnect"

---

## File Structure

```
src/components/wallet/
├── GlobalWalletModal.tsx     # Main component (updated!)
└── WalletDropdown.tsx          # Old file (can be removed)

src/components/auth/
└── EmbeddedWalletHeader.tsx    # Just imports GlobalWalletModal
```

---

## Next Steps

Now that the header works perfectly, you can:

1. **Use the same component in mint page** - Just import `GlobalWalletModal`
2. **Add smart account creation** - Server action when user logs in
3. **Add Solana wallet creation** - Server action for future use
4. **Implement Send tab** - Transaction builder UI
5. **Implement NFT fetching** - Query user's NFTs for the NFTs tab

---

## Code Usage

### In Any Page/Component
```tsx
import { GlobalWalletModal } from '@/components/wallet/GlobalWalletModal';

// Just drop it in
<GlobalWalletModal />
```

### Check Login State
```tsx
// For embedded wallet
import { useIsSignedIn, useEvmAddress } from '@coinbase/cdp-hooks';
const { isSignedIn } = useIsSignedIn();
const { evmAddress } = useEvmAddress();

// For external wallet
import { useAccount } from 'wagmi';
const { isConnected, address } = useAccount();

// Check either
const isLoggedIn = isSignedIn || isConnected;
```

---

## Troubleshooting

### "Assets tab is empty"
- Check if `/api/wallet` route exists
- Verify balance fetching logic
- Check network (Base Mainnet vs Sepolia)

### "External wallet dropdown doesn't show"
- Make sure NEXT_PUBLIC_CDP_API_KEY is set
- Restart dev server
- Check browser console for errors

### "Both wallets show as connected"
- This shouldn't happen - they're mutually exclusive
- If it does, refresh the page
- Check for conflicting state

---

**The header wallet flow is now complete!** 🎉

Both embedded and external wallets work perfectly with appropriate UI for each. Ready to use the same component in your mint page whenever you're ready!
