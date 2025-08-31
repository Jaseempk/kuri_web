# Authentication Bug Investigation - Failed Fix Attempts

## Bug Description
**Issue**: After successful Para Google login with passkey signing, user remains on `/onboarding` page showing "Connect with Email" button instead of being redirected to `/markets`. After refresh, user stays on `/onboarding` but sees profile creation form.

**Expected Behavior**: After successful login, user should be automatically redirected to `/markets` page.

**Symptoms**:
- Profile data loads successfully (confirmed in logs)
- Smart wallet address resolves correctly
- No redirect happens automatically
- Manual refresh changes UI state but still doesn't redirect

## Console Log Pattern
```
useUserProfile.ts:45 User profile data: undefined for address: null
useSmartWallet.ts:63 saathanam kayyilundo? 0x648e981b882b9f6f1ea56174a3e6bb2560bca791
useSmartWallet.ts:45 Fetched smart wallet address: 0xE2F6582823379e64bFddB84d874d904E860edcd4
useUserProfile.ts:45 User profile data: Object for address: 0xE2F6582823379e64bFddB84d874d904E860edcd4
useUserProfile.ts:45 User profile data: undefined for address: null
```

## Failed Fix Attempts

### Attempt 1: React Query Loading State Fix
**Date**: 2025-08-29
**Hypothesis**: Race condition between smart wallet resolution and profile loading
**Changes Made**:
- Added transition state tracking in `useUserProfile` hook
- Modified `isLoading` to include transition state: `isLoading || (isQueryEnabled && wasQueryDisabled.current)`
- Increased AuthGuard timeout from 100ms to 500ms

**Files Modified**:
- `src/hooks/useUserProfile.ts:16-25, 44, 112`
- `src/components/guards/AuthGuard.tsx:60`

**Result**: FAILED - Profile still loads successfully but no redirect happens
**Reason**: This addressed loading state timing but the real issue was elsewhere

### Attempt 2: Smart Wallet State Reset Fix  
**Date**: 2025-08-29
**Hypothesis**: Smart wallet address being reset to null after successful resolution
**Changes Made**:
- Modified useSmartWallet else condition from resetting on any falsy `embeddedAddress` to only reset when truly disconnected
- Changed condition to: `} else if (!account.isConnected && !account.isLoading) {`

**Files Modified**:
- `src/hooks/useSmartWallet.ts:65-69`

**Result**: FAILED - Same behavior persists
**Reason**: The state flipping may not be the root cause, or there's another factor

## Key Observations

### What Works
- Profile data loads correctly and consistently
- Smart wallet address resolves properly
- Authentication state is maintained
- **Navigation from Landing page**: When user goes to home page and clicks "Get Started" button, they are correctly routed to `/markets` (when already logged in)

### What Doesn't Work
- Automatic redirect from `/onboarding` to `/markets` after login
- Onboarding component state transitions
- **Refresh behavior**: User remains on `/onboarding` even after refresh when logged in
- **Bug persistence**: After logout and re-login, the bug reoccurs

### Critical Discovery
**Workaround Path**: Home → "Get Started" button → `/markets` (works correctly)
**Broken Path**: Login flow → stay on `/onboarding` → refresh → still on `/onboarding`

This suggests the issue is **specific to the `/onboarding` page's internal state management**, not global authentication state.

### Critical Code Paths to Investigate Further

1. **Onboarding Component State Logic** (`src/pages/Onboarding.tsx:50-65`):
   ```typescript
   if (account.isConnected && address && smartAddress && profile) {
     navigate(safeReturnUrl, { replace: true });
   }
   ```

2. **AuthGuard Navigation Logic** (`src/components/guards/AuthGuard.tsx:31-60`):
   - May be competing with Onboarding navigation
   - HasNavigated flag might be preventing proper routing

3. **Para SDK Account State** (`@getpara/react-sdk`):
   - `account.isConnected` may have timing issues
   - `account.embedded.wallets?.[0]?.address` dependency

4. **React Router State**:
   - Location state management
   - Replace vs push navigation behavior

## Potential Root Causes (Not Yet Tested)

1. **Onboarding Component State Isolation**: The `/onboarding` page may have isolated state that doesn't respond to global auth changes
2. **AuthGuard vs Landing Page Logic Difference**: Landing page's "Get Started" button uses different logic than AuthGuard
3. **Location State Interference**: `location.state?.returnUrl` or `location.state?.source` may be causing navigation issues
4. **authCheckComplete Flag**: May be preventing re-evaluation of auth state in Onboarding component
5. **React Strict Mode Double Execution**: useEffect may be running multiple times causing state conflicts
6. **Para SDK State Persistence**: Account state may have different behavior on `/onboarding` vs other pages

## New Investigation Focus

Since Landing → "Get Started" works but `/onboarding` internal logic fails:
1. **Compare Landing page logic** with Onboarding navigation logic
2. **Check if AuthGuard interferes** specifically on `/onboarding` route
3. **Investigate authCheckComplete flag** - may be blocking re-evaluation after login
4. **Examine location state handling** in Onboarding component

## Next Investigation Areas

1. **Log all state variables** in Onboarding component's useEffect to see which condition is failing
2. **Add detailed logging** to AuthGuard to see if it's interfering
3. **Check Para SDK documentation** for known issues with account state persistence
4. **Examine React Router history** to see if navigation calls are actually being made
5. **Test with different browsers/incognito** to rule out cache/storage issues

## Files Involved in Bug
- `src/pages/Onboarding.tsx` - Main component handling post-login flow
- `src/components/guards/AuthGuard.tsx` - Route protection logic
- `src/hooks/useUserProfile.ts` - Profile data fetching
- `src/hooks/useSmartWallet.ts` - Smart wallet resolution
- `src/providers/ParaWeb3Provider.tsx` - Para SDK configuration

## Environment Details
- Branch: gasless-tx
- Para SDK: v2.0.0-alpha.50
- React Router: v6+
- React Query: @tanstack/react-query