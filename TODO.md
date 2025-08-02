# 🎯 **Kuri Web Application: Comprehensive Testing Implementation Plan**

## 📋 **Project Overview**

This document outlines the comprehensive testing implementation plan for the Kuri Web3 savings circles application. The plan is structured in phases to ensure all crucial user flows are thoroughly tested, from basic unit tests to complete end-to-end user journeys.

**Current Testing Status**: ~5% coverage (basic UI component tests only)
**Target Testing Coverage**: 85%+ for critical flows
**Testing Framework**: Vitest + React Testing Library + Custom Web3 mocks

---

## 🏗️ **Codebase Architecture Context**

### **Tech Stack**
- **Frontend**: React 18 + TypeScript + Vite
- **Web3**: Wagmi + Viem + ConnectKit
- **State Management**: TanStack Query + React Hooks
- **Database**: Supabase (profiles/metadata)
- **GraphQL**: Apollo Client (market data)
- **UI**: Tailwind CSS + Radix UI primitives
- **Testing**: Vitest + React Testing Library + jsdom

### **Current Application Structure**
```
src/
├── pages/                    # Route components
│   ├── Landing.tsx          # Marketing/landing page
│   ├── Onboarding.tsx       # Profile creation
│   ├── MarketList.tsx       # Browse circles
│   ├── MarketDetail.tsx     # Circle details/interactions
│   └── UserDashboard.tsx    # User activity dashboard
├── components/
│   ├── markets/             # Circle-related components
│   ├── ui/                  # Reusable UI components
│   └── modals/              # Modal dialogs
├── hooks/
│   ├── contracts/           # Smart contract interactions
│   ├── useUserProfile.ts    # Profile management
│   └── use*.ts              # Various data hooks
├── providers/               # Context providers
└── utils/                   # Utility functions
```

### **Crucial User Flows Identified**
**Tier 1 (App-Breaking)**: Wallet connection, Circle creation, Deposits, Payouts
**Tier 2 (Feature-Breaking)**: Onboarding, Market discovery, Data loading, Balance management
**Tier 3 (UX-Breaking)**: Transaction tracking, Error handling, State management

---

## 🧪 **Testing Architecture Setup**

### **Current Test Infrastructure**
✅ **Vitest** with jsdom environment
✅ **React Testing Library** configured
✅ **Basic mocking** for wagmi, supabase, apollo
✅ **Provider wrapper** (`renderWithProviders`)
✅ **Mock data** (basic market/user objects)

### **Required Test Infrastructure Enhancements**

#### **Enhanced Mock Setup**
```typescript
// src/test/mocks/web3Mocks.ts - NEEDS CREATION
export const mockWalletStates = {
  connected: { address: "0x123...", isConnected: true },
  disconnected: { address: undefined, isConnected: false },
  connecting: { address: undefined, isConnecting: true },
};

export const mockContractInteractions = {
  success: { data: mockResult, error: null, isPending: false },
  pending: { data: null, error: null, isPending: true },
  error: { data: null, error: new Error("Contract error"), isPending: false },
};
```

#### **Test Data Fixtures**
```typescript
// src/test/fixtures/marketData.ts - NEEDS CREATION
export const marketFixtures = {
  inLaunch: { state: 0, activeParticipants: 3, totalParticipants: 10 },
  active: { state: 2, activeParticipants: 10, totalParticipants: 10 },
  completed: { state: 3, raffleWinners: ["0x123", "0x456"] },
};
```

---

## 🚀 **Phase 1: Critical Flow Foundation Tests**
**Priority**: CRITICAL | **Duration**: 5-7 days | **Coverage Target**: Tier 1 Flows

### **Phase 1A: Wallet Connection & Authentication Tests**

#### **1A.1: Basic Wallet Connection**
- [ ] **File**: `src/components/ui/__tests__/ConnectButton.test.tsx` *(ENHANCE EXISTING)*

**Core Test Requirements:**
1. **Mock Setup**: Mock `useAccount` from wagmi and `ConnectKitButton` from connectkit
2. **Test Data**: Use realistic Ethereum addresses (42 chars, 0x prefix)
3. **Key Scenarios**: Disconnected, connected, connecting, edge cases

**Test: "shows connect prompt when wallet disconnected"**
- **Mock State**: `useAccount` returns `{ address: undefined, isConnected: false }`
- **Expected Behavior**: Button displays "Connect Wallet", is clickable, triggers show() function
- **Key Assertions**: Button text, not disabled, click handler works
- **Watch For**: Component might crash with undefined address, styling issues

**Test: "shows wallet address when connected"**  
- **Mock State**: `useAccount` returns valid address, `isConnected: true`
- **Expected Behavior**: Shows truncated address (0x1234...7890 format), clickable for account options
- **Key Assertions**: Correct truncation logic, full address not exposed, proper formatting
- **Watch For**: Address truncation bugs, security issues showing full address

**Test: "shows connecting state during connection"**
- **Mock State**: `isConnecting: true` from ConnectKitButton
- **Expected Behavior**: Button shows "Connecting...", is disabled, no click action
- **Key Assertions**: Loading text, disabled state, visual feedback
- **Watch For**: Button remains clickable when should be disabled, poor UX during loading

**Edge Cases to Test:**
- Null/undefined address when isConnected is true (inconsistent state)
- Very long addresses or malformed addresses
- ConnectKit integration failures

#### **1A.2: Authentication Hook Tests**
- [ ] **File**: `src/hooks/__tests__/useApiAuth.test.ts` *(NEW)*
  ```typescript
  describe("useApiAuth", () => {
    it("generates signed message for profile creation", async () => {
      // Mock wallet signing
      // Test message format
      // Verify signature generation
    });
    
    it("handles user rejection of signing", async () => {
      // Mock user rejection
      // Test error handling
      // Verify graceful fallback
    });
    
    it("validates message format and content", () => {
      // Test timestamp inclusion
      // Test action-specific messages
      // Verify security parameters
    });
  });
  ```

#### **1A.3: Web3 Provider Tests**
- [ ] **File**: `src/providers/__tests__/Web3Provider.test.tsx` *(NEW)*
  ```typescript
  describe("Web3Provider", () => {
    it("initializes wagmi config correctly", () => {
      // Test config setup
      // Verify chain configuration
      // Test connector initialization
    });
    
    it("provides wallet state to children", () => {
      // Test context provision
      // Verify state updates
      // Test error boundaries
    });
  });
  ```

### **Phase 1B: Smart Contract Interaction Tests**

#### **1B.1: Core Contract Hook Tests**
- [ ] **File**: `src/hooks/contracts/__tests__/useKuriCore.test.ts` *(NEW)*

**Critical Mock Requirements:**
1. **Mock wagmi hooks**: `useReadContract`, `useWriteContract`, `useAccount`
2. **Contract Addresses**: Use valid format (0x + 40 hex chars)
3. **State Values**: Match KuriState enum (0=INLAUNCH, 2=ACTIVE, 3=COMPLETED)

**Test: "fetches market data successfully"**
- **Mock Setup**: `useReadContract` returns valid market data structure
- **Expected Behavior**: Hook returns marketData object, isLoading false, no error
- **Key Assertions**: Data transformation from contract format to UI format
- **Watch For**: Data mapping bugs, missing fields, type mismatches

**Test: "handles contract read failures"**  
- **Mock Setup**: `useReadContract` throws ContractFunctionRevertedError
- **Expected Behavior**: Hook sets error state, isLoading false, marketData null
- **Key Assertions**: Error message formatting, user-friendly error display
- **Watch For**: Unhandled contract errors, poor error messages, app crashes

**Test: "checks member status correctly"**
- **Mock Setup**: `userToData` returns different membership statuses (0,1,2,4)
- **Expected Behavior**: Correct parsing of: NONE(0), ACCEPTED(1), REJECTED(2), APPLIED(4) 
- **Key Assertions**: Status enum mapping, conditional UI rendering
- **Watch For**: Wrong status interpretation, missing status handling

**Test: "validates payment status for members only"**
- **Mock Setup**: Mix of member/non-member scenarios with payment checks
- **Expected Behavior**: Only checks payment for ACCEPTED members, skips others
- **Key Assertions**: Prevents KuriCore__InvalidUser errors, proper flow control  
- **Watch For**: Payment checks for non-members, unnecessary contract calls

#### **1B.2: Factory Contract Tests**
- [ ] **File**: `src/hooks/contracts/__tests__/useKuriFactory.test.ts` *(NEW)*
  ```typescript
  describe("useKuriFactory", () => {
    it("creates market with valid parameters", async () => {
      // Mock contract write
      // Test parameter validation
      // Verify transaction flow
    });
    
    it("handles market creation failures", async () => {
      // Mock contract errors
      // Test error handling
      // Verify user feedback
    });
    
    it("tracks creation transaction status", async () => {
      // Mock transaction states
      // Test status updates
      // Verify completion handling
    });
  });
  ```

### **Phase 1C: Form Validation Tests**

#### **1C.1: Market Creation Form Tests**
- [ ] **File**: `src/components/markets/__tests__/CreateMarketForm.test.tsx` *(ENHANCE EXISTING)*

**Form Testing Strategy:**
1. **Mock Dependencies**: `useKuriFactory`, file validation, API calls
2. **User Interactions**: Use `userEvent` for realistic form interactions
3. **Validation Logic**: Test both client-side and submission validation

**Test: "validates required fields"**
- **User Action**: Submit empty form, then fill fields one by one
- **Expected Behavior**: Shows specific error for each missing field
- **Key Assertions**: Error messages appear, form doesn't submit, field highlighting
- **Watch For**: Generic error messages, missing validation, form submits anyway

**Test: "validates numeric inputs"**
- **User Action**: Enter invalid amounts (negative, zero, too large, non-numeric)
- **Expected Behavior**: Shows validation errors, calculates monthly contribution correctly
- **Key Assertions**: Number parsing, calculation accuracy, reasonable limits
- **Watch For**: Division by zero, precision errors, unrealistic amounts allowed

**Test: "validates image upload"**
- **User Action**: Upload invalid files (wrong type, too large, corrupted)
- **Expected Behavior**: Rejects invalid files, shows preview for valid ones
- **Key Assertions**: File type checking, size limits, security validation
- **Watch For**: Security vulnerabilities, poor error messages, crashes on invalid files

**Test: "submits form with valid data"**
- **Mock Setup**: `initialiseKuriMarket` returns success, API calls succeed
- **Expected Behavior**: Form submits, shows success, triggers onSuccess callback
- **Key Assertions**: Correct data format sent, success state, form reset
- **Watch For**: Data transformation errors, missing fields in submission

**Test: "handles submission failures"**
- **Mock Setup**: Contract throws error, network failures
- **Expected Behavior**: Shows error message, preserves form data, allows retry
- **Key Assertions**: Error display, form state preservation, retry capability
- **Watch For**: Form clears on error, poor error handling, no retry option

#### **1C.2: Profile Creation Form Tests**
- [ ] **File**: `src/pages/__tests__/Onboarding.test.tsx` *(NEW)*
  ```typescript
  describe("Onboarding", () => {
    it("validates profile form inputs", async () => {
      // Test username validation
      // Test display name requirements
      // Test image upload validation
    });
    
    it("creates profile successfully", async () => {
      // Mock API calls
      // Test form submission
      // Verify navigation
    });
    
    it("handles profile creation errors", async () => {
      // Mock API failures
      // Test error handling
      // Verify retry capability
    });
  });
  ```

---

## 🔬 **Phase 2: Core Feature Integration Tests**
**Priority**: HIGH | **Duration**: 7-10 days | **Coverage Target**: Tier 2 Flows

### **Phase 2A: Circle Discovery & Joining Tests**

#### **2A.1: Market List Tests**
- [ ] **File**: `src/pages/__tests__/MarketList.test.tsx` *(NEW)*
  ```typescript
  describe("MarketList", () => {
    it("displays markets correctly", async () => {
      // Mock market data
      // Test rendering
      // Verify market information display
    });
    
    it("filters markets by search query", async () => {
      // Test search functionality
      // Verify filtering logic
      // Test empty results handling
    });
    
    it("filters by interval type", async () => {
      // Test weekly/monthly filters
      // Verify filter combinations
      // Test filter state persistence
    });
    
    it("handles loading and error states", async () => {
      // Mock loading states
      // Test error scenarios
      // Verify user feedback
    });
  });
  ```

#### **2A.2: Market Detail Tests**
- [ ] **File**: `src/pages/__tests__/MarketDetail.test.tsx` *(NEW)*
  ```typescript
  describe("MarketDetail", () => {
    it("displays market information correctly", async () => {
      // Mock market data
      // Test information display
      // Verify state-specific content
    });
    
    it("shows correct actions based on user state", async () => {
      // Test member vs non-member views
      // Verify action button states
      // Test permission-based rendering
    });
    
    it("handles invalid market addresses", async () => {
      // Mock 404 scenarios
      // Test error handling
      // Verify fallback UI
    });
  });
  ```

### **Phase 2B: Deposit & Transaction Flow Tests**

#### **2B.1: Deposit Form Tests**
- [ ] **File**: `src/components/markets/__tests__/DepositForm.test.tsx` *(NEW)*
  ```typescript
  describe("DepositForm", () => {
    it("prevents deposit with insufficient balance", async () => {
      // Mock low USDC balance
      // Test form disabled state
      // Verify error messaging
    });
    
    it("handles allowance approval flow", async () => {
      // Mock approval transaction
      // Test two-step process
      // Verify user guidance
    });
    
    it("processes deposit successfully", async () => {
      // Mock successful deposit
      // Test transaction flow
      // Verify success feedback
    });
    
    it("handles deposit failures", async () => {
      // Mock transaction failures
      // Test error handling
      // Verify retry options
    });
  });
  ```

#### **2B.2: Claim Interface Tests**
- [ ] **File**: `src/components/markets/__tests__/ClaimInterface.test.tsx` *(NEW)*
  ```typescript
  describe("ClaimInterface", () => {
    it("shows claim button for winners", async () => {
      // Mock winner status
      // Test claim availability
      // Verify winner validation
    });
    
    it("processes claim successfully", async () => {
      // Mock claim transaction
      // Test success flow
      // Verify amount display
    });
    
    it("handles already claimed intervals", async () => {
      // Mock claimed status
      // Test UI updates
      // Verify claim prevention
    });
  });
  ```

### **Phase 2C: Balance & State Management Tests**

#### **2C.1: Balance Management Tests**
- [ ] **File**: `src/hooks/__tests__/useUSDCBalances.test.ts` *(NEW)*
  ```typescript
  describe("useUSDCBalances", () => {
    it("fetches balances for multiple markets", async () => {
      // Mock balance calls
      // Test batch fetching
      // Verify data aggregation
    });
    
    it("calculates TVL correctly", async () => {
      // Mock market balances
      // Test TVL calculation
      // Verify format utils
    });
    
    it("handles balance fetch failures", async () => {
      // Mock network errors
      // Test fallback values
      // Verify error states
    });
  });
  ```

#### **2C.2: Market Data Optimization Tests**
- [ ] **File**: `src/hooks/__tests__/useOptimizedMarkets.test.ts` *(NEW)*
  ```typescript
  describe("useOptimizedMarkets", () => {
    it("batches market data fetching", async () => {
      // Mock GraphQL queries
      // Test batch efficiency
      // Verify caching behavior
    });
    
    it("updates data incrementally", async () => {
      // Mock real-time updates
      // Test cache invalidation
      // Verify UI updates
    });
    
    it("handles partial data failures", async () => {
      // Mock mixed success/failure
      // Test graceful degradation
      // Verify error boundaries
    });
  });
  ```

---

## 🎭 **Phase 3: User Journey Integration Tests**
**Priority**: HIGH | **Duration**: 5-7 days | **Coverage Target**: Complete User Flows

### **Phase 3A: New User Journey Tests**

#### **3A.1: Complete Onboarding Flow**
- [ ] **File**: `src/__tests__/integration/NewUserJourney.test.tsx` *(NEW)*
  ```typescript
  describe("New User Journey", () => {
    it("completes full onboarding to first deposit", async () => {
      // 1. Start at landing page
      // 2. Connect wallet
      // 3. Complete profile creation
      // 4. Browse and select market
      // 5. Join market and make deposit
      // 6. Verify success state
    });
    
    it("handles interruptions and resumption", async () => {
      // Test partial completion
      // Verify state persistence
      // Test resume capability
    });
  });
  ```

### **Phase 3B: Market Creator Journey Tests**

#### **3B.1: Market Creation & Management**
- [ ] **File**: `src/__tests__/integration/MarketCreatorJourney.test.tsx` *(NEW)*
  ```typescript
  describe("Market Creator Journey", () => {
    it("creates and manages market lifecycle", async () => {
      // 1. Create market
      // 2. Share market link
      // 3. Approve members
      // 4. Monitor deposits
      // 5. Handle payouts
    });
    
    it("handles member management", async () => {
      // Test member approval/rejection
      // Verify member communication
      // Test removal scenarios
    });
  });
  ```

### **Phase 3C: Active Member Journey Tests**

#### **3C.1: Full Participation Cycle**
- [ ] **File**: `src/__tests__/integration/ActiveMemberJourney.test.tsx` *(NEW)*
  ```typescript
  describe("Active Member Journey", () => {
    it("completes full participation cycle", async () => {
      // 1. Join existing market
      // 2. Make multiple deposits
      // 3. Win raffle and claim
      // 4. Continue until market completion
    });
    
    it("handles payment tracking", async () => {
      // Test payment status updates
      // Verify reminder systems
      // Test late payment handling
    });
  });
  ```

---

## 🛡️ **Phase 4: Error Handling & Edge Cases**
**Priority**: MEDIUM-HIGH | **Duration**: 4-6 days | **Coverage Target**: Tier 3 Flows

### **Phase 4A: Transaction Error Handling**

#### **4A.1: Wallet Interaction Errors**
- [ ] **File**: `src/__tests__/errors/WalletErrors.test.tsx` *(NEW)*
  ```typescript
  describe("Wallet Error Handling", () => {
    it("handles user rejection of transactions", async () => {
      // Mock user rejection
      // Test error display
      // Verify retry options
    });
    
    it("handles insufficient gas fees", async () => {
      // Mock gas estimation errors
      // Test user guidance
      // Verify fee adjustment
    });
    
    it("handles network congestion", async () => {
      // Mock network delays
      // Test timeout handling
      // Verify status updates
    });
  });
  ```

#### **4A.2: Contract Error Handling**
- [ ] **File**: `src/__tests__/errors/ContractErrors.test.tsx` *(NEW)*
  ```typescript
  describe("Contract Error Handling", () => {
    it("handles invalid user errors", async () => {
      // Mock KuriCore__InvalidUser
      // Test graceful handling
      // Verify user feedback
    });
    
    it("handles state transition errors", async () => {
      // Mock invalid state calls
      // Test error messages
      // Verify fallback behavior
    });
    
    it("handles insufficient allowance", async () => {
      // Mock allowance errors
      // Test approval flow
      // Verify user guidance
    });
  });
  ```

### **Phase 4B: Data Loading Error Handling**

#### **4B.1: Network & API Errors**
- [ ] **File**: `src/__tests__/errors/NetworkErrors.test.tsx` *(NEW)*
  ```typescript
  describe("Network Error Handling", () => {
    it("handles GraphQL query failures", async () => {
      // Mock API failures
      // Test fallback data
      // Verify retry mechanisms
    });
    
    it("handles Supabase connection errors", async () => {
      // Mock database errors
      // Test offline behavior
      // Verify data persistence
    });
    
    it("handles RPC endpoint failures", async () => {
      // Mock blockchain connection errors
      // Test provider switching
      // Verify user notifications
    });
  });
  ```

### **Phase 4C: Edge Case Testing**

#### **4C.1: Boundary Conditions**
- [ ] **File**: `src/__tests__/edge-cases/BoundaryConditions.test.tsx` *(NEW)*
  ```typescript
  describe("Boundary Conditions", () => {
    it("handles maximum participant limits", async () => {
      // Test upper limits
      // Verify performance
      // Test UI scaling
    });
    
    it("handles minimum contribution amounts", async () => {
      // Test precision limits
      // Verify calculations
      // Test rounding behavior
    });
    
    it("handles very long usernames/descriptions", async () => {
      // Test text truncation
      // Verify display overflow
      // Test input validation
    });
  });
  ```

---

## 🎯 **Phase 5: Performance & Accessibility Tests**
**Priority**: MEDIUM | **Duration**: 3-5 days | **Coverage Target**: Non-functional Requirements

### **Phase 5A: Performance Testing**

#### **5A.1: Component Performance**
- [ ] **File**: `src/__tests__/performance/ComponentPerformance.test.tsx` *(NEW)*
  ```typescript
  describe("Component Performance", () => {
    it("renders large market lists efficiently", async () => {
      // Mock 100+ markets
      // Test render performance
      // Verify memory usage
    });
    
    it("handles rapid state updates", async () => {
      // Test frequent updates
      // Verify no memory leaks
      // Test cleanup on unmount
    });
  });
  ```

#### **5A.2: Hook Performance**
- [ ] **File**: `src/__tests__/performance/HookPerformance.test.tsx` *(NEW)*
  ```typescript
  describe("Hook Performance", () => {
    it("optimizes contract call batching", async () => {
      // Test batch efficiency
      // Verify call reduction
      // Test caching effectiveness
    });
    
    it("prevents unnecessary re-renders", async () => {
      // Test memoization
      // Verify dependency arrays
      // Test optimization patterns
    });
  });
  ```

### **Phase 5B: Accessibility Testing**

#### **5B.1: Screen Reader Compatibility**
- [ ] **File**: `src/__tests__/accessibility/ScreenReader.test.tsx` *(NEW)*
  ```typescript
  describe("Screen Reader Compatibility", () => {
    it("provides proper ARIA labels", async () => {
      // Test button labels
      // Verify form descriptions
      // Test navigation landmarks
    });
    
    it("announces state changes", async () => {
      // Test live regions
      // Verify status updates
      // Test error announcements
    });
  });
  ```

#### **5B.2: Keyboard Navigation**
- [ ] **File**: `src/__tests__/accessibility/KeyboardNavigation.test.tsx` *(NEW)*
  ```typescript
  describe("Keyboard Navigation", () => {
    it("supports tab navigation", async () => {
      // Test tab order
      // Verify focus management
      // Test modal focus trapping
    });
    
    it("provides keyboard shortcuts", async () => {
      // Test ESC key handling
      // Verify Enter key actions
      // Test accessibility shortcuts
    });
  });
  ```

---

## 🚀 **Phase 6: End-to-End Automation**
**Priority**: MEDIUM | **Duration**: 4-6 days | **Coverage Target**: Complete User Journeys

### **Phase 6A: E2E Test Infrastructure**

#### **6A.1: Playwright Setup**
- [ ] **File**: `e2e/setup/playwright.config.ts` *(NEW)*
  ```typescript
  // Playwright configuration for E2E tests
  export default {
    testDir: './e2e/tests',
    timeout: 60000,
    retries: 2,
    use: {
      baseURL: 'http://localhost:5173',
      trace: 'on-first-retry',
      screenshot: 'only-on-failure',
    },
    projects: [
      { name: 'Chrome', use: { ...devices['Desktop Chrome'] } },
      { name: 'Safari', use: { ...devices['Desktop Safari'] } },
      { name: 'Mobile', use: { ...devices['iPhone 13'] } },
    ],
  };
  ```

#### **6A.2: Test Environment Mocks**
- [ ] **File**: `e2e/mocks/walletMock.ts` *(NEW)*
  ```typescript
  // Mock wallet for E2E testing
  export const mockWalletExtension = {
    // Simulate MetaMask/wallet interactions
    // Handle connection flows
    // Mock transaction signing
  };
  ```

### **Phase 6B: Critical E2E Flows**

#### **6B.1: Complete User Onboarding**
- [ ] **File**: `e2e/tests/user-onboarding.spec.ts` *(NEW)*
  ```typescript
  test.describe("User Onboarding E2E", () => {
    test("new user completes full onboarding", async ({ page }) => {
      // Navigate to landing page
      // Connect wallet
      // Complete profile
      // Browse markets
      // Join first circle
      // Make first deposit
    });
  });
  ```

#### **6B.2: Market Creation Flow**
- [ ] **File**: `e2e/tests/market-creation.spec.ts` *(NEW)*
  ```typescript
  test.describe("Market Creation E2E", () => {
    test("creates and shares new market", async ({ page }) => {
      // Connect wallet
      // Create market
      // Share market link
      // Verify shareable page
    });
  });
  ```

---

## 📊 **Testing Infrastructure & Tools**

### **Required Test Files Structure**
```
src/
├── __tests__/
│   ├── integration/              # Phase 3 integration tests
│   ├── errors/                   # Phase 4 error handling tests
│   ├── edge-cases/               # Phase 4 edge case tests
│   ├── performance/              # Phase 5 performance tests
│   └── accessibility/            # Phase 5 accessibility tests
├── test/
│   ├── mocks/
│   │   ├── web3Mocks.ts         # Enhanced Web3 mocking
│   │   ├── contractMocks.ts     # Smart contract mocking
│   │   └── apiMocks.ts          # API response mocking
│   ├── fixtures/
│   │   ├── marketData.ts        # Market test data
│   │   ├── userData.ts          # User test data
│   │   └── transactionData.ts   # Transaction test data
│   └── utils/
│       ├── testHelpers.ts       # Test utility functions
│       └── customMatchers.ts    # Custom Jest matchers
├── components/
│   └── **/__tests__/            # Component-specific tests
├── hooks/
│   └── **/__tests__/            # Hook-specific tests
├── pages/
│   └── **/__tests__/            # Page-specific tests
└── utils/
    └── **/__tests__/            # Utility function tests

e2e/                             # Phase 6 E2E tests
├── tests/
├── fixtures/
└── setup/
```

### **Testing Commands & Scripts**
```json
{
  "scripts": {
    "test": "vitest",
    "test:watch": "vitest --watch",
    "test:coverage": "vitest --coverage",
    "test:ui": "vitest --ui",
    "test:e2e": "playwright test",
    "test:e2e:headed": "playwright test --headed",
    "test:accessibility": "vitest --run accessibility",
    "test:integration": "vitest --run integration",
    "test:phase1": "vitest --run --testNamePattern='Phase 1'",
    "test:phase2": "vitest --run --testNamePattern='Phase 2'",
    "test:critical": "vitest --run --testNamePattern='(Phase 1|Phase 2)'"
  }
}
```

### **Coverage Targets by Phase**
- **Phase 1**: 90%+ coverage for Tier 1 flows (wallet, creation, deposits, claims)
- **Phase 2**: 85%+ coverage for Tier 2 flows (onboarding, discovery, data loading)
- **Phase 3**: 80%+ coverage for complete user journeys
- **Phase 4**: 75%+ coverage for error scenarios
- **Phase 5**: Performance/accessibility benchmarks met
- **Phase 6**: All critical E2E flows automated

---

## ⚠️ **CRITICAL: Testing vs Potentially Buggy Code**

### **Important Testing Philosophy**

**The existing codebase is NOT absolute truth.** We are testing to verify the code works as expected, which means:

- **Tests might fail because the actual code is buggy, not because tests are wrong**
- **This is normal and expected** - we're testing to find bugs, not just validate working code
- **Before making ANY code changes**, you must:
  1. **Lay out exactly what you propose to change and why**
  2. **Wait for explicit permission** before modifying any source code
  3. **Document the bug/issue found** in your test results

### **When Tests Fail - Decision Process**

**If a test fails, determine:**
1. **Is the test logic correct?** (Check mocks, assertions, test setup)
2. **Is the component behavior buggy?** (Compare with expected UX/requirements)
3. **Is it an integration issue?** (Missing dependencies, wrong props, etc.)

**Examples:**
- ✅ **Test is wrong**: Mock returns wrong data format, assertion checks wrong element
- ⚠️ **Code is buggy**: Button shows "undefined" instead of "Connect Wallet", form accepts invalid input
- 🔧 **Integration issue**: Component expects different prop structure than provided

### **Bug Reporting Protocol**

When you find potential bugs:
```
🚨 **POTENTIAL BUG FOUND**
- **Component**: ConnectButton
- **Expected**: Shows "Connect Wallet" when disconnected
- **Actual**: Shows "undefined" or crashes
- **Test**: ConnectButton should show connect prompt when wallet disconnected
- **Proposed Fix**: Add null check for address before displaying
- **Permission Needed**: Yes, before changing ConnectButton.tsx
```

---

## 🎯 **Implementation Guidelines for AI Execution**

### **Context for Fresh Chat Sessions**

When starting any phase, an AI should:

1. **Read this TODO.md** to understand the complete context
2. **Examine existing test files** in `/src/test/` and `__tests__/` directories
3. **Review current mocks** in `/src/test/setup.ts`
4. **Check component structure** to understand what needs testing
5. **Verify test infrastructure** is working with `npm run test`
6. **Remember: Code might be buggy - test to find issues, not just validate**

### **Phase Execution Instructions**

Each phase should be executed with:

```bash
# Before starting any phase
npm run test                    # Verify current tests pass
npm run test:coverage          # Check current coverage

# During phase implementation
npm run test:watch            # Run tests in watch mode
npm run test:ui              # Use Vitest UI for debugging

# After completing phase
npm run test:coverage        # Verify coverage targets
npm run lint                 # Ensure code quality
```

### **Key Implementation Patterns**

#### **Web3 Testing Pattern**
```typescript
// Always use this pattern for contract testing
const mockUseKuriCore = vi.mocked(useKuriCore);
mockUseKuriCore.mockReturnValue({
  marketData: mockMarketData,
  isLoading: false,
  error: null,
  deposit: vi.fn(),
  // ... other methods
});
```

#### **Async Testing Pattern**
```typescript
// Always use this pattern for async operations
test("handles async operation", async () => {
  render(<Component />);
  
  await waitFor(() => {
    expect(screen.getByText("Success")).toBeInTheDocument();
  });
});
```

#### **User Interaction Pattern**
```typescript
// Always use this pattern for user interactions
test("handles user interaction", async () => {
  const user = userEvent.setup();
  render(<Component />);
  
  await user.click(screen.getByRole("button", { name: /submit/i }));
  
  await waitFor(() => {
    expect(mockFunction).toHaveBeenCalled();
  });
});
```

### **Critical Testing Rules**

1. **No Real Blockchain Calls**: All contract interactions must be mocked
2. **No Real API Calls**: All Supabase/GraphQL calls must be mocked
3. **Test User Experience**: Focus on what users see and do, not implementation details
4. **Cover Error Cases**: Always test both success and failure scenarios
5. **Maintain Performance**: Tests should run quickly (<5 seconds per suite)

### **Success Criteria**

Each phase is complete when:
- [ ] All test files specified in phase are created/enhanced
- [ ] Tests pass consistently (no flaky tests)
- [ ] Coverage targets are met
- [ ] No console errors during test runs
- [ ] Performance benchmarks are maintained

---

## 📈 **Progress Tracking**

### **Phase Completion Status**
- [ ] **Phase 1: Critical Flow Foundation** (0/3 sub-phases complete)
- [ ] **Phase 2: Core Feature Integration** (0/3 sub-phases complete)
- [ ] **Phase 3: User Journey Integration** (0/3 sub-phases complete)
- [ ] **Phase 4: Error Handling & Edge Cases** (0/3 sub-phases complete)
- [ ] **Phase 5: Performance & Accessibility** (0/2 sub-phases complete)
- [ ] **Phase 6: End-to-End Automation** (0/2 sub-phases complete)

### **Overall Project Metrics**
- **Current Test Coverage**: ~5%
- **Target Test Coverage**: 85%
- **Current Test Files**: 4
- **Target Test Files**: 50+
- **Estimated Total Duration**: 4-6 weeks
- **Priority Phases**: 1, 2, 3 (Critical/High priority)

---

**🎉 This TODO provides complete context for implementing comprehensive test coverage across all crucial flows in the Kuri Web3 application. Any AI can pick up any phase and execute it with full understanding of the requirements, patterns, and success criteria.**