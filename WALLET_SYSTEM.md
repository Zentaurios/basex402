# Wallet System Architecture

## Overview

The wallet system has been refactored to be globally accessible and properly positioned. It now uses a Provider pattern with Portal rendering for modals.

## Components

### 1. **WalletProvider** (`/components/wallet/WalletProvider.tsx`)
Context provider that manages wallet connection state globally.

```tsx
import { WalletProvider } from '@/components/wallet/WalletProvider';

// Already included in providers.tsx - no need to add again
```

### 2. **GlobalWalletModal** (`/components/wallet/GlobalWalletModal.tsx`)
The login modal that renders via React Portal at the root level. Handles both embedded and external wallet connections.

```tsx
import { GlobalWalletModal } from '@/components/wallet/GlobalWalletModal';

// Already included in providers.tsx - renders globally
```

### 3. **ConnectedWallet** (`/components/wallet/ConnectedWallet.tsx`)
Displays wallet info when connected, shows login button when not. Used in the Header.

```tsx
import { ConnectedWallet } from '@/components/wallet/ConnectedWallet';

// Used in Header.tsx via EmbeddedWalletHeader
```

### 4. **WalletButton** (`/components/wallet/WalletButton.tsx`)
Reusable button to trigger the wallet modal. Can be used anywhere in your app.

```tsx
import { WalletButton } from '@/components/wallet/WalletButton';

// Default usage
<WalletButton />

// With custom text
<WalletButton>Connect Your Wallet</WalletButton>

// Different variants
<WalletButton variant="outline" />
<WalletButton variant="minimal" />

// Different sizes
<WalletButton size="sm" />
<WalletButton size="lg" />

// With custom className
<WalletButton className="w-full" />
```

### 5. **useWallet Hook**
Access wallet state from anywhere in your app.

```tsx
import { useWallet } from '@/components/wallet/WalletProvider';

function MyComponent() {
  const { 
    isConnected,      // boolean - is any wallet connected?
    address,          // string | undefined - wallet address
    walletType,       // 'embedded' | 'external' | null
    openModal,        // function - open login modal
    closeModal        // function - close login modal
  } = useWallet();

  return (
    <div>
      {isConnected ? (
        <p>Connected: {address}</p>
      ) : (
        <button onClick={openModal}>Connect</button>
      )}
    </div>
  );
}
```

## Usage Examples

### In the Mint Page

Replace the existing wallet connection check with the new `useWallet` hook:

```tsx
'use client';

import { useWallet } from '@/components/wallet/WalletProvider';
import { WalletButton } from '@/components/wallet/WalletButton';

export default function MintPage() {
  const { isConnected, address } = useWallet();

  return (
    <div>
      {!isConnected ? (
        <div className="text-center py-12">
          <h2 className="text-2xl font-bold mb-4">Connect to Mint</h2>
          <p className="mb-6">Connect your wallet to mint NFT #{NEXT_TOKEN_ID}</p>
          <WalletButton size="lg">
            Connect Wallet to Mint
          </WalletButton>
        </div>
      ) : (
        <div>
          {/* Existing mint UI */}
          <p>Connected: {address}</p>
          <button onClick={handleMint}>Mint NFT</button>
        </div>
      )}
    </div>
  );
}
```

### In Any Component

```tsx
import { useWallet } from '@/components/wallet/WalletProvider';
import { WalletButton } from '@/components/wallet/WalletButton';

function MyFeature() {
  const { isConnected, address } = useWallet();

  if (!isConnected) {
    return (
      <div>
        <p>This feature requires a wallet connection</p>
        <WalletButton>Connect to Continue</WalletButton>
      </div>
    );
  }

  return <div>Feature content for {address}</div>;
}
```

### Programmatic Modal Control

```tsx
import { useWallet } from '@/components/wallet/WalletProvider';

function CustomButton() {
  const { openModal } = useWallet();

  return (
    <button 
      onClick={openModal}
      className="custom-button-styles"
    >
      Custom Login Button
    </button>
  );
}
```

## Benefits of New Architecture

1. **Global Positioning**: Modal renders via Portal at root level, never constrained by parent containers
2. **Reusable**: WalletButton can be used anywhere in the app
3. **Type-Safe**: Full TypeScript support with proper types
4. **State Management**: Centralized wallet state via Context API
5. **Flexible**: Multiple button variants and sizes
6. **Clean Separation**: Modal logic separated from UI components

## Migration from Old System

### Before
```tsx
// Header had UnifiedWalletModal embedded
<UnifiedWalletModal />
```

### After
```tsx
// Header uses ConnectedWallet (shows button or wallet info)
<ConnectedWallet />

// Modal is global, accessible from anywhere
<WalletButton /> // Can be used anywhere
```

## Files to Update

If you want to use the new wallet system in the mint page:

1. Import the hook and button:
```tsx
import { useWallet } from '@/components/wallet/WalletProvider';
import { WalletButton } from '@/components/wallet/WalletButton';
```

2. Replace `useIsSignedIn()` and `useEvmAddress()` checks with `useWallet()`:
```tsx
const { isConnected, address } = useWallet();
```

3. Use `WalletButton` instead of `WalletConnectionCard`:
```tsx
<WalletButton size="lg">Connect to Mint</WalletButton>
```

## Styling

The modal automatically uses your app's theme variables:
- `--card`: Modal background
- `--card-border`: Borders
- `--text-primary`: Primary text
- `--text-secondary`: Secondary text
- `--base-blue`: Brand color
- `--surface`: Button backgrounds

All OnchainKit wallet components use the custom theme defined in `/src/styles/onchainkit-theme.css`.
