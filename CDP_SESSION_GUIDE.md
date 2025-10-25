# CDP Embedded Wallet Session Persistence Guide

## ✅ Fixed Issues

### 1. Removed Global "Initializing Wallet" Screen
**Problem:** The app was showing an "Initializing wallet..." loading screen on every page load, even for public pages. This was:
- Bad UX - users saw unnecessary loading
- Bad for SEO - content wasn't immediately available to crawlers
- Confusing - made the app feel slow

**Solution:** Removed the blocking loading state from `InitializedWrapper`. CDP now initializes silently in the background.

### 2. Session Persistence Now Works Automatically
**How it works:**
1. When a user signs in with CDP embedded wallet, a session token is stored
2. On page refresh, CDP SDK automatically:
   - Checks for existing session token
   - Validates the token
   - Restores wallet state (address, isSignedIn, etc.)
3. Components using CDP hooks (`useIsSignedIn`, `useEvmAddress`, etc.) automatically re-render with restored state
4. All of this happens in the background without blocking UI

## How Session Persistence Works

### CDP SDK Behavior
```typescript
// CDP automatically handles session persistence via:
// 1. Session tokens stored in secure storage
// 2. Automatic validation on app load
// 3. Silent restoration of wallet state

// Your components just need to use the hooks:
const { isSignedIn } = useIsSignedIn();
const { evmAddress } = useEvmAddress();

// These hooks will:
// - Return false/null initially
// - Update automatically when CDP restores session
// - Trigger re-renders with correct state
```

### The Flow
```
Page Load
    ↓
CDP SDK initializes (background)
    ↓
Checks for session token
    ↓
    ├─→ Token exists → Validates → Restores state → Hooks update
    └─→ No token → Hooks remain in signed-out state
    ↓
App renders immediately (no waiting)
```

## Migration from Old Approach

### Before (❌ Bad)
```typescript
// Old InitializedWrapper blocked ALL content
if (!isInitialized) {
  return <LoadingScreen>Initializing wallet...</LoadingScreen>
}
```

### After (✅ Good)
```typescript
// New InitializedWrapper - no blocking
export function InitializedWrapper({ children }: InitializedWrapperProps) {
  return <>{children}</>;
}
```

## For Authenticated Routes

If you have routes that **require** authentication, add the loading check at the **PAGE level**, not globally:

```typescript
'use client';

import { useIsSignedIn } from '@coinbase/cdp-hooks';
import { useRouter } from 'next/navigation';
import { useEffect } from 'react';

export default function AuthenticatedPage() {
  const { isSignedIn, isLoading } = useIsSignedIn();
  const router = useRouter();

  // Only show loading for authenticated routes
  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-base-blue mb-4" />
          <p className="text-sm text-gray-600">Loading...</p>
        </div>
      </div>
    );
  }

  // Redirect if not signed in
  useEffect(() => {
    if (!isLoading && !isSignedIn) {
      router.push('/');
    }
  }, [isSignedIn, isLoading, router]);

  if (!isSignedIn) {
    return null;
  }

  return (
    <div>
      {/* Your authenticated content */}
    </div>
  );
}
```

## Current Implementation

### ✅ Public Pages (Home, About, etc.)
- Render immediately
- No loading screens
- CDP restores session in background
- Wallet button updates automatically when session restored

### ✅ Mint Page
- Renders immediately
- Shows "Connect Wallet" step if not connected
- Automatically updates to "Mint" step when CDP restores session
- No unnecessary loading screens

### ✅ SEO Friendly
- Content available immediately for crawlers
- No JavaScript-dependent loading states blocking content
- Progressive enhancement - works even if JS is slow to load

## Testing Session Persistence

1. **Sign in** with your email using the embedded wallet
2. **Navigate** around the app
3. **Refresh** the page
4. **Result:** You should stay signed in without seeing "Initializing wallet..." screen

## Benefits

✅ **Better UX** - No unnecessary loading screens  
✅ **Better SEO** - Content immediately available to crawlers  
✅ **Faster perceived performance** - App feels instant  
✅ **Automatic session restoration** - Users stay signed in across refreshes  
✅ **Progressive enhancement** - Core content loads even if JS is delayed

## Troubleshooting

### Users aren't staying signed in
- Check that CDP_PROJECT_ID is set correctly in environment variables
- Verify no browser extensions are clearing storage
- Check browser console for CDP SDK errors

### Wallet state seems delayed after refresh
- This is normal! CDP validates the session which takes ~100-500ms
- Components will re-render automatically when state updates
- Don't show loading screens for this - it's too fast to notice

### Need to clear session for testing
```typescript
// In browser console:
localStorage.clear();
sessionStorage.clear();
// Then refresh
```
