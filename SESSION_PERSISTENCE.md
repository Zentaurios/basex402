# CDP Embedded Wallet Session Persistence

## Overview
CDP Embedded Wallets automatically maintain user sessions across page refreshes using a dual-token system. This document explains how it works and what was implemented to ensure proper session persistence.

## How Session Persistence Works

### Automatic Token Management
CDP automatically handles session persistence through:
- **Access Token**: 15-minute lifespan, used for API requests
- **Refresh Token**: 7-day lifespan, automatically generates new access tokens
- **Storage**: Tokens are stored securely in the browser
- **Auto-Refresh**: The SDK automatically refreshes tokens without user intervention

### Session Duration
- **Maximum session**: 7 days
- **After 7 days**: User must re-authenticate
- **No user action required**: Sessions persist across:
  - Page refreshes
  - Browser restarts (within 7 days)
  - Tab closures

## Implementation

### 1. InitializedWrapper Component
Located: `/src/components/wallet/InitializedWrapper.tsx`

This component ensures the CDP SDK fully initializes and checks for existing sessions before rendering the app:

```tsx
import { useIsInitialized } from '@coinbase/cdp-hooks';

export function InitializedWrapper({ children }) {
  const { isInitialized } = useIsInitialized();

  if (!isInitialized) {
    return <LoadingScreen />;
  }

  return <>{children}</>;
}
```

**Why this is critical:**
- The SDK needs time to check for stored tokens
- Without this, the app renders before session restoration completes
- This causes the "disconnected on refresh" issue

### 2. Updated Providers
Location: `/src/app/providers.tsx`

The providers now wrap the app with `InitializedWrapper`:

```tsx
<CDPReactProvider config={cdpConfig} app={appConfig} theme={cdpTheme}>
  <InitializedWrapper>
    <WalletProvider>
      {/* App content */}
    </WalletProvider>
  </InitializedWrapper>
</CDPReactProvider>
```

### 3. Auth State Debugger (Development Only)
Location: `/src/components/wallet/AuthStateDebugger.tsx`

A floating debug panel that shows:
- Whether user is signed in
- User ID
- EVM and Solana addresses
- Number of accounts

**To use**: The debugger automatically appears in development mode. Click the button in the bottom-right corner to toggle the panel.

## How It Works in Practice

### First Visit
1. User authenticates with email/SMS OTP
2. CDP issues access and refresh tokens
3. Tokens are stored in browser
4. User can use wallet

### Page Refresh
1. App loads
2. `InitializedWrapper` waits for CDP to initialize
3. CDP automatically checks for stored tokens
4. If tokens are valid, user is automatically signed in
5. If tokens expired (after 7 days), user sees sign-in screen
6. App renders with correct auth state

### Token Refresh (Automatic)
- Every ~14 minutes, access token expires
- CDP automatically uses refresh token to get new access token
- User never notices this happening
- Works for up to 7 days

## Checking Auth State

### In Components
```tsx
import { useIsSignedIn, useCurrentUser, useEvmAddress } from '@coinbase/cdp-hooks';

function MyComponent() {
  const { isSignedIn } = useIsSignedIn();
  const { currentUser } = useCurrentUser();
  const { evmAddress } = useEvmAddress();

  if (!isSignedIn) {
    return <SignInPrompt />;
  }

  return <div>Welcome! Address: {evmAddress}</div>;
}
```

### Before Authentication Flow
Always check if user is already signed in before starting auth:

```tsx
const { isSignedIn } = useIsSignedIn();

if (isSignedIn) {
  // User already authenticated, don't show login
  return;
}

// Proceed with authentication
```

## Best Practices

### 1. Always Use InitializedWrapper
Never render auth-dependent components without waiting for initialization:
```tsx
// ✅ Good
<InitializedWrapper>
  <AuthDependentComponent />
</InitializedWrapper>

// ❌ Bad - will cause "disconnected" issues
<AuthDependentComponent />
```

### 2. Don't Manually Manage Sessions
The SDK handles everything automatically. You only need to:
- Check `isSignedIn` for conditional rendering
- Use `signOut()` when user wants to log out
- That's it! No manual token management needed.

### 3. Handle Session Expiration Gracefully
After 7 days, sessions expire. Your app should:
```tsx
import { useIsSignedIn } from '@coinbase/cdp-hooks';

function App() {
  const { isSignedIn } = useIsSignedIn();

  return isSignedIn ? <AuthenticatedApp /> : <SignInScreen />;
}
```

### 4. Use the Debug Tool in Development
The `AuthStateDebugger` helps you verify:
- Sessions are persisting correctly
- Tokens are being refreshed
- Auth state is correct after refresh

## Common Issues (Now Fixed)

### ❌ "Wallet disconnects on refresh"
**Cause**: App rendered before CDP checked for existing sessions
**Fixed by**: `InitializedWrapper` component

### ❌ "User has to log in every time"
**Cause**: Not waiting for SDK initialization
**Fixed by**: `useIsInitialized()` check

### ❌ "Inconsistent auth state"
**Cause**: Attempting to authenticate when already signed in
**Fixed by**: Always check `isSignedIn` before auth flows

## Session Lifecycle

```
Day 0: User authenticates
       ↓
       Access token issued (15 min)
       Refresh token issued (7 days)
       ↓
Day 0-7: User uses app
         - Access token auto-refreshes every 15 min
         - Refresh token stays valid
         - Sessions persist across refreshes
         ↓
Day 7: Refresh token expires
       ↓
       User must re-authenticate
```

## Testing Session Persistence

1. **Sign in to your app**
2. **Refresh the page** - you should remain signed in
3. **Close the browser and reopen** - still signed in
4. **Wait 7 days** (or manually clear browser storage) - requires re-auth

## Monitoring Sessions

### In Development
Use the `AuthStateDebugger` to monitor:
- Current auth status
- Active addresses
- Account information

### In Production
Listen for auth state changes:
```tsx
import { onAuthStateChange } from '@coinbase/cdp-core';

onAuthStateChange((user) => {
  if (user) {
    console.log('User signed in:', user.userId);
  } else {
    console.log('User signed out or session expired');
  }
});
```

## Additional Resources

- [CDP Authentication Docs](https://docs.cdp.coinbase.com/embedded-wallets/authentication)
- [CDP React Hooks](https://docs.cdp.coinbase.com/embedded-wallets/react-hooks)
- [Session Management Best Practices](https://docs.cdp.coinbase.com/embedded-wallets/authentication#session-management)
