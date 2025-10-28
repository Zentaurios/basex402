# Adding Solana Support to Existing Accounts

## Overview
This document explains the temporary setup for adding Solana accounts to users who signed up before Solana support was enabled.

## What Was Changed

### 1. **Config Update** (`/src/app/providers.tsx`)
Added Solana account creation for new users:
```typescript
const cdpConfig: Config = {
  projectId: process.env.NEXT_PUBLIC_CDP_PROJECT_ID ?? "",
  solana: {
    createOnLogin: true  // ← New users now get Solana accounts automatically
  }
};
```

### 2. **Temporary Components Created**

#### `AddSolanaAccountButton.tsx`
- Shows purple warning button in bottom-right (above debug button)
- Only visible in development mode
- Only shows if user has 0 Solana accounts
- Automatically disappears once Solana account is created
- Located: `/src/components/wallet/AddSolanaAccountButton.tsx`

#### API Endpoint: `/api/wallet/add-solana`
- Server-side endpoint to create Solana accounts
- Uses CDP SDK with server API keys
- Validates user's access token
- Located: `/src/app/api/wallet/add-solana/route.ts`

## Testing Plan

### Step 1: Add Solana Account to Existing User (You)
1. **Start the dev server**
   ```bash
   npm run dev
   ```

2. **You should see two buttons in bottom-right:**
   - Purple "Add Solana Account" button (bottom)
   - Blue "Show Auth State" button (above it)

3. **Click "Add Solana Account"**
   - Button will show "Creating Solana Account..."
   - If successful: Shows green success message with new address
   - Page automatically refreshes after 2 seconds
   - After refresh, purple button should be gone (you now have Solana!)

4. **Verify in Auth State Debugger:**
   - Click "Show Auth State" button
   - Should now show:
     - `Solana Accounts: 1`
     - `Solana Address: [your new address]`

5. **Check Wallet Dropdown:**
   - Click wallet button in header
   - Should see ETH and Solana toggle buttons
   - Click Solana → Should show your Solana address

### Step 2: Test New User Signup
1. **Sign out** from your current account
2. **Sign up with a NEW email address**
3. **Check Auth State Debugger** immediately after signup:
   - Should show `EVM Accounts: 1` 
   - Should show `Solana Accounts: 1` ← **This confirms new users get both!**
4. **Purple "Add Solana Account" button should NOT appear** (new users already have it)

### Step 3: Cleanup After Testing
Once you've confirmed both scenarios work:

1. **Remove the temporary component import** from `/src/app/providers.tsx`:
   ```typescript
   // Remove this line:
   import { AddSolanaAccountButton } from '@/components/wallet/AddSolanaAccountButton';
   
   // Remove this line from the JSX:
   <AddSolanaAccountButton />
   ```

2. **Delete temporary files:**
   ```bash
   rm src/components/wallet/AddSolanaAccountButton.tsx
   rm -rf src/app/api/wallet/add-solana
   ```

3. **Delete this guide:**
   ```bash
   rm SOLANA_MIGRATION_GUIDE.md
   ```

## Troubleshooting

### Error: "CDP SDK method not available"
**Cause:** The CDP SDK version doesn't have the `createSolanaAccount` method yet.

**Fix Options:**
1. **Update CDP SDK:**
   ```bash
   npm install @coinbase/cdp-sdk@latest
   ```

2. **Alternative (if method still doesn't exist):**
   - The user will need to sign out and sign in again
   - The `solana.createOnLogin: true` config will create the Solana account on next login
   - Update the purple button to show: "Sign out and sign back in to get Solana account"

### Purple Button Not Showing
**Check:**
- Are you in development mode? (`NODE_ENV=development`)
- Are you signed in?
- Do you already have a Solana account? (Check debugger)
- Is the component imported in providers.tsx?

### API Returns 500 Error
**Check:**
- Are `CDP_API_KEY_ID` and `CDP_API_KEY_SECRET` set in `.env.local`?
- Are you using the correct CDP project that supports embedded wallets?

## Current State

✅ **What Works Now:**
- Config enables Solana for new signups
- Temporary button for existing users
- API endpoint ready (pending SDK method availability)

⚠️ **Still Testing:**
- Whether CDP SDK has `createSolanaAccount` method
- If not, fallback is: existing users sign out/in to get Solana account

🎯 **End Goal:**
- All users have both EVM and Solana accounts
- No temporary code remains in production
- Clean, automatic account creation for all new users

## Timeline

1. **Now:** Test adding Solana to your account
2. **Next:** Test new user signup gets Solana automatically  
3. **Then:** Remove temporary migration code
4. **Future:** All new users automatically get both wallet types

---

**Note:** The purple button and API endpoint are TEMPORARY and should be removed once all existing users have Solana accounts. New signups will get Solana accounts automatically thanks to the config change.
