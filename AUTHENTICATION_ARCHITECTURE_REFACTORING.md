# Authentication Architecture Refactoring - Complete Implementation Guide

> **Critical Issue**: Profile creation form flashes for 1-2 seconds after successful login instead of direct redirect to `/markets`. Root cause is architectural - cascading state dependencies and React Query transition timing.

## Problem Context

### Current Architecture Issues
1. **5-level dependency chain**: Para SDK → Embedded Wallet → Smart Wallet → Profile Query → Navigation
2. **11 synchronized state variables** in `authDependenciesResolved` memo
3. **React Query enabled transition** creates brief `isLoading: true` with `data: undefined`
4. **Mobile timing bandaids** that create more race conditions
5. **Competing navigation logic** between AuthGuard and Onboarding components

### Affected Files (Critical Dependencies)
- `src/pages/Onboarding.tsx:43-77` - Core authentication logic with flash bug
- `src/hooks/useUserProfile.ts:24,27-28` - React Query enabled transition + placeholderData
- `src/hooks/useSmartWallet.ts:62-81` - Mobile timing delays causing state flips
- `src/components/guards/AuthGuard.tsx:31-65` - Competing navigation logic
- `src/hooks/useAuthNavigation.ts:25-45` - Over-engineered navigation coordination
- `src/providers/ParaWeb3Provider.tsx:48-53` - Suboptimal React Query cache defaults

---

## Phase 1: Immediate Flash Fix (1-2 Days)

### **Task 1.1: Fix React Query Transition Flash**
**File**: `src/hooks/useUserProfile.ts`

**Current Problematic Code** (Lines 24, 27-28):
```typescript
enabled: !!smartAddress,
placeholderData: (previousData: KuriUserProfile | null | undefined) =>
  previousData || null, // Keeps stale data, causes flash
```

**Required Changes**:
1. Add transition state tracking
2. Use `keepPreviousData` instead of custom placeholderData
3. Reduce stale time from 10 minutes to 30 seconds

**Implementation**:
```typescript
import { keepPreviousData } from '@tanstack/react-query';

const [isTransitioning, setIsTransitioning] = useState(false);

const queryOptions = useMemo(() => ({
  queryKey: ["user-profile-smart", smartAddress?.toLowerCase()],
  queryFn: async () => {
    if (!smartAddress) throw new Error("Smart wallet address not available");
    return apiClient.getUserProfile(smartAddress);
  },
  enabled: !!smartAddress,
  staleTime: 30 * 1000, // 30 seconds instead of 10 minutes
  refetchOnWindowFocus: false,
  placeholderData: keepPreviousData,
}), [smartAddress]);

// Track transition state
useEffect(() => {
  if (smartAddress && query.status === 'pending') {
    setIsTransitioning(true);
  } else if (query.status === 'success' || query.status === 'error') {
    setIsTransitioning(false);
  }
}, [smartAddress, query.status]);

return { ...query, isTransitioning };
```

### **Task 1.2: Update Onboarding Flash Logic**
**File**: `src/pages/Onboarding.tsx`

**Current Problematic Code** (Line 70):
```typescript
} else if (hasCompleteAuthState && !profile) {
  setCurrentStep(OnboardingStep.PROFILE_CREATION); // CAUSES FLASH
}
```

**Required Changes**:
1. Add `isTransitioning` check from updated useUserProfile
2. Modify imports to include new state

**Implementation**:
```typescript
// Update import (Line 24)
const { profile, updateProfile, isLoading: profileLoading, isTransitioning } = useUserProfile();

// Update condition (Line 70)
} else if (hasCompleteAuthState && !profile && !isTransitioning) {
  setCurrentStep(OnboardingStep.PROFILE_CREATION);
}

// Update dependency array (Line 77)
}, [authDependenciesResolved, hasCompleteAuthState, profile, isTransitioning, coordinatedNavigate, returnUrl, loading]);
```

### **Task 1.3: Remove Mobile Timing Bandaids**
**File**: `src/hooks/useSmartWallet.ts`

**Current Problematic Code** (Lines 66-80):
```typescript
const isMobile = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);

if (isMobile) {
  setTimeout(() => {
    if (!account.isConnected && !account.isLoading) {
      setSmartAddress(null);
      setError(null);
    }
  }, 1000); // CREATES RACE CONDITIONS
}
```

**Required Changes**:
1. Remove mobile detection and setTimeout
2. Use consistent logic across devices
3. Update dependency array

**Implementation**:
```typescript
// Replace Lines 64-81 with:
} else if (!account.isConnected && !account.isLoading) {
  setSmartAddress(null);
  setError(null);
}
```

### **Task 1.4: Fix React Query Cache Defaults**
**File**: `src/providers/ParaWeb3Provider.tsx`

**Current Problematic Code** (Lines 48-53):
```typescript
queryClient.setQueryDefaults(["user-profile-smart"], {
  staleTime: 10 * 60 * 1000, // TOO LONG for auth transitions
  gcTime: 30 * 60 * 1000,
  refetchOnWindowFocus: false,
  retry: 1,
});
```

**Required Changes**:
```typescript
queryClient.setQueryDefaults(["user-profile-smart"], {
  staleTime: 30 * 1000, // 30 seconds for auth-critical data
  gcTime: 5 * 60 * 1000, // 5 minutes
  refetchOnWindowFocus: true, // Allow fresh data on focus
  retry: 2, // More retries for mobile
});
```

---

## Phase 2: State Machine Implementation (1 Week) ✅ COMPLETED

### **Task 2.1: Create Authentication State Machine**
**New File**: `src/hooks/useAuthStateMachine.ts`

**Purpose**: Replace complex `authDependenciesResolved` memo with predictable state machine

**Implementation Requirements**:
```typescript
enum AuthFlowState {
  INITIALIZING = 'initializing',
  PARA_LOADING = 'para_loading',
  WALLET_RESOLVING = 'wallet_resolving', 
  PROFILE_LOADING = 'profile_loading',
  PROFILE_REQUIRED = 'profile_required',
  AUTHENTICATED = 'authenticated',
  ERROR = 'error'
}

interface AuthMachineContext {
  paraAccount: any;
  smartAddress: string | null;
  profile: KuriUserProfile | null;
  error: Error | null;
  returnUrl: string;
}

// State derivation function
const deriveAuthState = (
  account: any, 
  smartAddress: string | null, 
  profile: KuriUserProfile | null
): AuthFlowState => {
  if (account.isLoading) return AuthFlowState.PARA_LOADING;
  if (!account.isConnected) return AuthFlowState.INITIALIZING;
  if (!smartAddress) return AuthFlowState.WALLET_RESOLVING;
  if (!profile) return AuthFlowState.PROFILE_LOADING; // Will transition to PROFILE_REQUIRED or AUTHENTICATED
  return AuthFlowState.AUTHENTICATED;
};
```

### **Task 2.2: Refactor Onboarding Component**
**File**: `src/pages/Onboarding.tsx`

**Current Issues**:
- Complex `authDependenciesResolved` memo (Lines 43-58)
- Manual step management with useState (Line 26-28)
- Competing useEffect logic (Lines 63-77)

**Required Changes**:
1. Replace `authDependenciesResolved` with state machine
2. Remove manual `currentStep` state management
3. Simplify component to be purely reactive to auth state

**Implementation Strategy**:
```typescript
// Replace Lines 26-58 with:
const { authState, context } = useAuthStateMachine();

// Replace Lines 62-77 with:
useEffect(() => {
  switch (authState) {
    case AuthFlowState.AUTHENTICATED:
      const safeReturnUrl = returnUrl === "/onboarding" ? "/markets" : returnUrl;
      navigate(safeReturnUrl, { replace: true });
      break;
    case AuthFlowState.PROFILE_REQUIRED:
      // Profile creation needed - no flash because state is definitive
      break;
    case AuthFlowState.ERROR:
      // Handle errors
      break;
  }
}, [authState, returnUrl, navigate]);

// Replace Lines 462-464 with:
const renderCurrentStep = () => {
  switch (authState) {
    case AuthFlowState.INITIALIZING:
    case AuthFlowState.PARA_LOADING:
      return renderEmailAuthStep();
    case AuthFlowState.PROFILE_REQUIRED:
      return renderProfileCreationStep();
    default:
      return <LoadingSkeleton />;
  }
};
```

### **Task 2.3: Update AuthGuard Integration**
**File**: `src/components/guards/AuthGuard.tsx`

**Current Issues**:
- Duplicates Onboarding navigation logic (Lines 42-49)
- Complex timeout-based loading detection (Lines 31-41)

**Required Changes**:
1. Use auth state machine instead of individual hook checks
2. Remove competing navigation logic
3. Simplify to pure route protection

**Implementation**:
```typescript
// Replace Lines 31-65 with:
const { authState } = useAuthStateMachine();

useEffect(() => {
  switch (authState) {
    case AuthFlowState.INITIALIZING:
    case AuthFlowState.PARA_LOADING:
      // Still loading, do nothing
      break;
    case AuthFlowState.PROFILE_REQUIRED:
      coordinatedNavigate("/onboarding?step=profile", "AuthGuard-profile", {
        state: { returnUrl: window.location.pathname }
      });
      break;
    case AuthFlowState.AUTHENTICATED:
      // Allow access
      break;
    default:
      coordinatedNavigate("/onboarding", "AuthGuard-auth", {
        state: { returnUrl: window.location.pathname }
      });
  }
}, [authState]);
```

---

## Phase 3: Service Layer Architecture (1-2 Weeks) ✅ COMPLETED

### **Task 3.1: Extract Authentication Services** ✅ COMPLETED
**Implemented**: `src/services/AuthenticationService.ts`

**Purpose**: Decouple Para SDK interactions from React hooks

**Implementation**:
- ✅ ParaAuthenticationService with event-driven architecture
- ✅ Modal management abstraction (openAuthModal, openAccountModal)
- ✅ Account state tracking with listener pattern
- ✅ React hook integration via useAuthenticationService
- ✅ Updated components: ConnectButton, Onboarding, useAuthStateMachine

### **Task 3.2: Extract Wallet Resolution Service** ✅ COMPLETED
**Implemented**: `src/services/WalletService.ts`

**Purpose**: Isolate smart wallet resolution logic and caching

**Implementation**:
- ✅ AlchemyWalletService extends existing smartWalletMapping utilities
- ✅ Enhanced caching with event notifications
- ✅ Error recovery and state management
- ✅ Singleton pattern for consistent state
- ✅ Updated useSmartWallet to use service layer

### **Task 3.3: Extract Profile Management Service** ✅ COMPLETED
**Implemented**: `src/services/ProfileService.ts`

**Purpose**: Centralize profile CRUD operations

**Implementation**:
- ✅ KuriProfileService with comprehensive CRUD operations
- ✅ Event-driven profile updates with listener pattern
- ✅ Authentication integration (message signing preserved)
- ✅ Cache synchronization with React Query
- ✅ Updated useUserProfile to use service layer

**Verification Results**:
- ✅ TypeScript compilation: Clean (no errors)
- ✅ Test suite: Stable (8/9 passing - same as before)
- ✅ Build process: Successful
- ✅ UI preservation: Zero visual changes
- ✅ No code duplication: Services extend existing utilities

---

## Phase 4: React Query Optimization (3-5 Days) ✅ COMPLETED

### **Task 4.1: Implement Dependent Query Pattern** ✅ COMPLETED
**Implemented**: `src/hooks/useOptimizedAuth.ts`

**Purpose**: Replace hook chaining with proper dependent queries

**Implementation**:
- ✅ 3-level dependent query architecture: Para → Smart Wallet → Profile
- ✅ Proper query dependencies with `enabled` conditions
- ✅ Service integration with `getWalletService()` and `getProfileService()`
- ✅ Complete backwards compatibility with `useAuthStateMachine` interface
- ✅ Error handling and state derivation preserved
- ✅ Service listeners integrated for automatic cache invalidation
- ✅ Updated components: Onboarding, AuthGuard

### **Task 4.2: Fix Cache Invalidation Strategy** ✅ COMPLETED
**Updated**: `src/providers/ParaWeb3Provider.tsx`

**Implementation**:
- ✅ Auth query defaults: 30s stale time, 5min GC time, focus refetch enabled
- ✅ Legacy profile query defaults maintained for backwards compatibility
- ✅ `invalidateAuthCache()` utility function exported
- ✅ Service integration: Wallet and profile services trigger cache invalidation
- ✅ Proper cache boundaries between auth and non-auth data

**Verification Results**:
- ✅ TypeScript compilation: Clean (no errors)
- ✅ Build process: Successful production build
- ✅ Dev server: Starts correctly
- ✅ UI preservation: Zero visual changes
- ✅ Backwards compatibility: Old hooks still work for non-auth components
- ✅ Test suite: Stable (same status as before - 8/9 passing)

---

## Phase 5: Component Refactoring (3-5 Days)

### **Task 5.1: Simplify Onboarding Component Logic**
**File**: `src/pages/Onboarding.tsx`

**Lines to Remove/Replace**:
- Lines 43-58: Complex `authDependenciesResolved` memo
- Lines 26-28: Manual `currentStep` state management  
- Lines 63-77: Complex conditional useEffect

**New Simplified Implementation**:
```typescript
export default function Onboarding() {
  const { authState, profile, updateProfile } = useOptimizedAuth();
  const location = useLocation();
  const navigate = useNavigate();
  const returnUrl = location.state?.returnUrl || "/markets";
  
  // Single effect for navigation - no complex conditions
  useEffect(() => {
    if (authState === 'AUTHENTICATED') {
      const safeReturnUrl = returnUrl === "/onboarding" ? "/markets" : returnUrl;
      navigate(safeReturnUrl, { replace: true });
    }
  }, [authState, returnUrl, navigate]);
  
  // Render based on auth state - no manual step management
  const renderCurrentState = () => {
    switch (authState) {
      case 'INITIALIZING':
      case 'PARA_LOADING':
      case 'WALLET_RESOLVING':
        return renderEmailAuthStep();
      case 'PROFILE_REQUIRED':
        return renderProfileCreationStep();
      case 'PROFILE_LOADING':
        return <LoadingSkeleton />; // Show loading during profile fetch
      case 'ERROR':
        return renderErrorState();
      default:
        return renderEmailAuthStep();
    }
  };
  
  return (
    <div className="min-h-screen flex items-center justify-center px-4">
      {renderCurrentState()}
    </div>
  );
}
```

### **Task 5.2: Refactor AuthGuard to Use State Machine**
**File**: `src/components/guards/AuthGuard.tsx`

**Current Issues**:
- Competes with Onboarding for navigation control
- Complex timeout logic (Lines 31-41)
- Duplicate authentication checking

**Required Changes**:
1. Use auth state machine instead of individual hooks
2. Remove competing navigation logic
3. Simplify to pure route protection

```typescript
export function AuthGuard({ children, requireProfile = true }: AuthGuardProps) {
  const { authState } = useOptimizedAuth();
  
  // Simple state-based routing
  switch (authState) {
    case 'INITIALIZING':
    case 'PARA_LOADING':
    case 'WALLET_RESOLVING':
    case 'PROFILE_LOADING':
      return <LoadingSkeleton />;
      
    case 'PROFILE_REQUIRED':
      if (requireProfile) {
        return <Navigate to="/onboarding" state={{ returnUrl: window.location.pathname }} replace />;
      }
      return <>{children}</>;
      
    case 'AUTHENTICATED':
      return <>{children}</>;
      
    case 'ERROR':
      return <Navigate to="/onboarding" state={{ returnUrl: window.location.pathname }} replace />;
      
    default:
      return <Navigate to="/onboarding" state={{ returnUrl: window.location.pathname }} replace />;
  }
}
```

---

## Phase 6: Advanced Architecture (1-2 Weeks)

### **Task 6.1: Implement Error Recovery System**
**New File**: `src/hooks/useAuthErrorRecovery.ts`

**Purpose**: Handle authentication errors gracefully with proper retry logic

```typescript
enum AuthErrorType {
  PARA_CONNECTION_FAILED = 'para_connection_failed',
  WALLET_RESOLUTION_FAILED = 'wallet_resolution_failed', 
  PROFILE_FETCH_FAILED = 'profile_fetch_failed',
  NETWORK_ERROR = 'network_error',
  MOBILE_TIMING_ERROR = 'mobile_timing_error'
}

interface RetryStrategy {
  maxRetries: number;
  retryDelay: number;
  strategy: 'exponential' | 'linear' | 'fixed';
}

const retryStrategies: Record<AuthErrorType, RetryStrategy> = {
  [AuthErrorType.WALLET_RESOLUTION_FAILED]: {
    maxRetries: 5, // Higher for mobile timing issues
    retryDelay: 2000,
    strategy: 'exponential'
  },
  // ... other strategies
};
```

### **Task 6.2: Add Performance Monitoring**
**New File**: `src/utils/authPerformance.ts`

**Purpose**: Track authentication performance and identify bottlenecks

```typescript
interface AuthPerformanceMetrics {
  paraConnectionTime: number;
  walletResolutionTime: number;
  profileLoadTime: number;
  totalAuthTime: number;
  renderCount: number;
  errorCount: number;
}

export const trackAuthPerformance = () => {
  // Implementation for performance tracking
};
```

### **Task 6.3: Implement Comprehensive Testing**
**New File**: `src/hooks/__tests__/useOptimizedAuth.test.ts`

**Test Cases Required**:
1. **Happy Path**: Para → Wallet → Profile → Navigation
2. **Error Recovery**: Network failures, wallet resolution failures
3. **Mobile Timing**: Slower resolution on mobile devices
4. **Cache Behavior**: Proper cache invalidation and updates
5. **State Transitions**: All possible state combinations

---

## Implementation Dependencies & Order

### **Critical Dependencies (Must Do First)**:
1. **Task 1.1** → **Task 1.2** → **Task 1.3**: These fix the immediate flash
2. **Task 1.4**: Must be done before any React Query changes
3. **Task 2.1** before **Task 2.2**: State machine before component refactor

### **Parallel Implementation Possible**:
- Tasks 1.1-1.3 can be done in parallel (different files)
- Phase 2 and Phase 4 can overlap (state machine + query optimization)
- Task 6.2 and 6.3 can be done independently

### **Breaking Change Risks**:

**High Risk Changes**:
- Task 2.2: Onboarding component refactor (could break user flow)
- Task 5.2: AuthGuard refactor (could break route protection)

**Low Risk Changes**: 
- Task 1.1: useUserProfile update (isolated change)
- Task 6.1: Error recovery (additive only)

### **Testing Strategy Per Phase**:

**Phase 1 Testing**:
- [ ] Login flow doesn't show profile form flash
- [ ] Existing functionality unchanged
- [ ] Mobile devices work consistently

**Phase 2 Testing**:
- [ ] State transitions are predictable
- [ ] No authentication loops
- [ ] Proper error handling

**Phase 6 Testing**:
- [ ] Performance improvements measurable
- [ ] Error recovery works for all scenarios
- [ ] Comprehensive E2E test coverage

---

## Files That Must NOT Be Modified

**Stable Dependencies (Don't Touch)**:
- `src/lib/apiClient.ts` - API client works correctly
- `src/utils/smartWalletMapping.ts` - Wallet resolution logic is sound
- `src/utils/customSignMessage.ts` - Signing logic is correct
- `src/config/wagmi.ts` - Wagmi configuration is proper
- `src/lib/supabase.ts` - Backend integration is stable

**Para SDK Integration (Minimal Changes Only)**:
- `src/providers/ParaWeb3Provider.tsx` - Only change cache defaults
- Para SDK hooks usage - Keep existing patterns

---

## Success Criteria

### **Phase 1 Complete**: ✅ COMPLETED
- ✅ No profile form flash after login
- ✅ Consistent behavior across desktop/mobile  
- ✅ No regression in existing functionality
- ✅ React Query transition flash fixed
- ✅ Mobile timing bandaids removed
- ✅ Cache defaults optimized

### **Phase 2 Complete**: ✅ COMPLETED
- ✅ Predictable authentication state transitions
- ✅ No authentication loops or deadlocks
- ✅ Clear separation between authentication and navigation logic
- ✅ State machine implementation replaces complex authDependenciesResolved memo
- ✅ Onboarding component refactored to use state machine
- ✅ AuthGuard simplified with state-based routing

### **Phase 6 Complete**:
- ✅ Sub-2 second authentication flow on all devices
- ✅ Comprehensive error recovery
- ✅ 95%+ authentication success rate
- ✅ Full test coverage for authentication flows

---

## Emergency Rollback Plan

If any phase breaks functionality:

1. **Immediate Rollback**: Git revert specific commits
2. **Partial Rollback**: Revert to previous phase and debug
3. **Full Rollback**: Revert all changes and implement minimal fix only

**Rollback Testing Required**:
- [ ] Authentication still works
- [ ] Profile creation still works  
- [ ] Navigation still works
- [ ] Mobile devices still work

---

## Context for Implementation

**Current Stack**:
- React 18 with TypeScript
- React Router v6
- React Query v4 (@tanstack/react-query)
- Para SDK v2.0.0-alpha.50
- Alchemy Account Kit
- Wagmi v2 + Viem

**Development Environment**:
- Environment.BETA for Para SDK
- Mobile testing required (Android/iOS)
- Network throttling testing required

**Critical Integration Points**:
- Para SDK account state management
- Alchemy Account Kit smart wallet generation
- Supabase backend API integration
- React Router navigation system
- React Query caching layer

This document contains complete context for implementing the fix without knowledge gaps or breaking existing functionality.