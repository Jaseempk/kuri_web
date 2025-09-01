# Infinite Loop Bug Analysis - Authentication Flow

## Bug Description

**Symptom**: When clicking "Get Started" button from landing page, the app navigates to `/onboarding` but gets stuck in infinite render loop, causing:
- Browser becomes unresponsive 
- Thousands of console logs per second
- Rate limit exhaustion (429 Too Many Requests)
- UI never renders onboarding component despite URL change

## Console Logs Pattern

```
useOptimizedAuth.ts:99 🔍 Fetching profile for address: 0x1534232988049c32e836825353eca9cffb198f8e
ProfileService.ts:28 🔍 PROFILE SERVICE: Fetching profile for address: 0x1534232988049c32e836825353eca9cffb198f8e
workbox-41f5f610.js:44 workbox No route found for: http://localhost:3001/api/users/profile/0x1534232988049c32e836825353eca9cffb198f8e
[Repeats thousands of times per second]
```

## Bug Characteristics

**Inconsistent Behavior:**
- Sometimes works fine (when profile exists in cache or backend down)
- Sometimes infinite loops (when backend responsive but no profile exists)
- Cache clearing sometimes "fixes" temporarily

**Rate Limiting Evidence:**
```bash
curl -I http://localhost:3001/api/users/profile/0x1534232988049c32e836825353eca9cffb198f8e
HTTP/1.1 429 Too Many Requests
RateLimit-Remaining: 0
```

## Initial Diagnosis (Incorrect)

**What We Thought**: 404 errors from backend for non-existent profiles triggered infinite cache invalidation.

**Root Cause Theory**: ProfileService error handler calls `notifyListeners()` on 404s → React Query invalidation → restart cycle.

## Fix Attempts Made

### Attempt 1: Handle 404s as Expected Responses
**Changes Made:**
- Modified `ProfileService.fetchProfile()` to not notify listeners on 404 errors
- Updated React Query to treat 404s as successful null responses

**Files Modified:**
- `src/services/ProfileService.ts:55-60`
- `src/hooks/useOptimizedAuth.ts:111-120`

**Result**: ❌ Still infinite looping

### Attempt 2: Remove Immediate Listener Callback
**Changes Made:**
- Removed immediate `callback(this.currentProfile)` call from `ProfileService.onProfileChange()`
- Added `fetchProfileSilent()` method for React Query operations
- Updated all React Query hooks to use silent fetch

**Files Modified:**
- `src/services/ProfileService.ts:116-126` (removed immediate callback)
- `src/services/ProfileService.ts:68-84` (added fetchProfileSilent)
- `src/hooks/useOptimizedAuth.ts:102-110` (use silent fetch)
- `src/hooks/useUserProfile.ts:15` (use silent fetch)

**Result**: ❌ Still infinite looping

## Current Investigation Status

**Key Observations:**
1. HTTP requests are being fired but **never complete** (no success/error logs appear)
2. Requests are being **cancelled before completion** by something in the frontend
3. Rate limiting confirms massive request volume (1000+ requests in minutes)
4. Backend data exists in Supabase for the test address

**Possible Alternative Root Causes:**

### Theory 1: React Query Configuration Issues
- `staleTime: 30 * 1000` too aggressive for invalidation patterns
- `enabled: !!walletQuery.data?.address` might be flickering
- `placeholderData: keepPreviousData` causing state conflicts

### Theory 2: useEffect Dependency Array Issues
```typescript
// useOptimizedAuth.ts:167
}, [queryClient, walletService, profileService]);
```
- Services are singletons but React tracks them as dependencies
- Might be causing listener re-registration

### Theory 3: Component Mount/Unmount Cycle
- Onboarding component might be mounting/unmounting rapidly
- AuthGuard redirects causing navigation loops
- Router state conflicts

### Theory 4: Para SDK Integration Issues
- Para account state changes causing wallet query invalidation
- Smart wallet resolution triggering cascading invalidations
- Multiple Para hooks causing state conflicts

### Theory 5: React Strict Mode
- Development mode double-mounting components
- useEffect cleanup/setup causing listener issues

## Next Investigation Steps

1. **Add component mount/unmount logging** to track render cycles
2. **Add React Query status logging** to understand query lifecycle
3. **Check Para SDK account state changes** during navigation
4. **Verify AuthGuard navigation logic** for redirect loops
5. **Test in production build** to eliminate Strict Mode effects
6. **Add request cancellation logging** to understand what's cancelling HTTP calls

## Code Locations of Interest

**Primary Suspects:**
- `src/hooks/useOptimizedAuth.ts:92-167` - Main auth hook with React Query
- `src/pages/Onboarding.tsx:1-300` - Component that triggers the issue
- `src/components/guards/AuthGuard.tsx` - Route protection logic
- `src/providers/ParaWeb3Provider.tsx` - Para SDK integration

**Additional Investigation Points:**
- Service worker (workbox) interaction with API calls
- React Router navigation state during transitions
- Memory leaks causing accumulated listeners

## Architecture Questions

1. **Is the issue with ProfileService listener pattern fundamentally incompatible with React Query?**
2. **Should we eliminate service-based reactivity entirely in favor of React Query?**
3. **Are there multiple sources of truth causing state conflicts?**
4. **Is this related to Para SDK's embedded wallet state management?**

## Current Status

**Bug Status**: ❌ UNRESOLVED
**Impact**: Critical - New user onboarding completely broken
**Urgency**: High - Affects core user acquisition flow

**Next Actions**: Need deeper investigation into alternative root causes beyond ProfileService listener conflicts.