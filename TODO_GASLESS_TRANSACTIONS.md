# Gas-Sponsored Transactions Implementation TODO

## Context & Background

### Current State
The kuri_web project currently uses Para SDK for wallet management with regular Ethereum transactions. We have successfully implemented ONE gas-sponsored transaction (`requestMembershipSponsored`) using Alchemy Account Kit integration.

### Problem Statement
- Users pay gas fees for all contract interactions (deposits, claims, membership management)
- After implementing gas sponsorship, events will contain smart wallet addresses instead of user EOA addresses
- User profiles in Supabase are mapped to EOA addresses, creating a data mapping issue

### Solution Overview
1. **PHASE 1**: Create gas-sponsored variants for all write functions in useKuriCore and useKuriFactory
2. **PHASE 2**: Implement smart wallet → EOA address resolution to maintain existing data mappings

---

## PHASE 1: Gas-Sponsored Write Function Variants

### Dependencies Already Added
```json
{
  "@aa-sdk/core": "4.57.1",
  "@account-kit/infra": "4.57.1", 
  "@account-kit/smart-contracts": "4.57.1",
  "@getpara/viem-v2-integration": "2.0.0-alpha.47"
}
```

### Utility Files Created
- `/src/utils/customSignMessage.ts` - Para signature formatting for Ethereum compatibility
- `/src/utils/generateSalt.ts` - Deterministic salt generation for smart wallet addresses

### Working Reference Implementation
**File**: `/src/hooks/contracts/useKuriCore.ts:514-641`
**Function**: `requestMembershipSponsored()`

**Key Pattern Components**:
```typescript
// 1. Para wallet client access
const paraWalletClient = account.embedded.wallets?.[0];

// 2. Custom account wrapper with Para signing
const customAccount = {
  address: userAddress,
  type: "local" as const,
  source: "para",
  signMessage: async ({ message }: { message: any }) => {
    return customSignMessage(signMessageAsync, paraWalletClient.id, message);
  },
  // ... other required methods
};

// 3. Viem wallet client creation
const viemWalletClient = createWalletClient({
  account: customAccount as any,
  chain: baseSepolia,
  transport: http(`https://base-sepolia.g.alchemy.com/v2/${import.meta.env.VITE_ALCHEMY_API_KEY}`)
});

// 4. Alchemy client with gas sponsorship
const sponsoredClient = await createModularAccountAlchemyClient({
  transport: alchemy({ rpcUrl: `https://base-sepolia.g.alchemy.com/v2/${import.meta.env.VITE_ALCHEMY_API_KEY}` }),
  chain: baseSepolia,
  signer: new WalletClientSigner(viemWalletClient, "wallet"),
  policyId: import.meta.env.VITE_ALCHEMY_GAS_POLICY_ID,
  salt: generateSalt(paraWalletClient.id, 0),
});

// 5. Contract call encoding and execution
const callData = encodeFunctionData({
  abi: KuriCoreABI,
  functionName: "requestMembership",
  args: [],
});

const userOpResult = await sponsoredClient.sendUserOperation({
  uo: { target: kuriAddress, data: callData, value: 0n },
});

// 6. Wait for transaction completion
const txHash = await sponsoredClient.waitForUserOperationTransaction(userOpResult);
```

### Functions Requiring Gas-Sponsored Variants

#### useKuriCore Functions (`/src/hooks/contracts/useKuriCore.ts`)

1. **`acceptUserMembershipRequest`** (Lines 644-671)
   - **Current**: `acceptUserMembershipRequest(address: \`0x${string}\`)`
   - **New**: `acceptUserMembershipRequestSponsored(address: \`0x${string}\`)`
   - **Contract Function**: `acceptUserMembershipRequest(address)`

2. **`rejectUserMembershipRequest`** (Lines 674-701)
   - **Current**: `rejectUserMembershipRequest(address: \`0x${string}\`)`
   - **New**: `rejectUserMembershipRequestSponsored(address: \`0x${string}\`)`
   - **Contract Function**: `rejectUserMembershipRequest(address)`

3. **`acceptMultipleMembers`** (Lines 704-732)
   - **Current**: `acceptMultipleMembers(addresses: \`0x${string}\`[])`
   - **New**: `acceptMultipleMembersSponsored(addresses: \`0x${string}\`[])`
   - **Contract Function**: `acceptMultipleUserMembershipRequests(addresses)`

4. **`initializeKuri`** (Lines 336-359)
   - **Current**: `initializeKuri()`
   - **New**: `initializeKuriSponsored()`
   - **Contract Function**: `initialiseKuri()` (no args)

5. **`deposit`** (Lines 362-450)
   - **Current**: `deposit()`
   - **New**: `depositSponsored()`
   - **Contract Function**: `userInstallmentDeposit()` (no args)
   - **Note**: Requires token approval handling

6. **`claimKuriAmount`** (Lines 453-480)
   - **Current**: `claimKuriAmount(intervalIndex: number)`
   - **New**: `claimKuriAmountSponsored(intervalIndex: number)`
   - **Contract Function**: `claimKuriAmount(intervalIndex)`

7. **`approveTokens`** (Lines 146-177)
   - **Current**: `approveTokens(amount: bigint)`
   - **New**: `approveTokensSponsored(amount: bigint)`
   - **Contract Function**: ERC20 `approve(spender, amount)`
   - **Note**: Different contract (token contract, not KuriCore)

#### useKuriFactory Functions (`/src/hooks/contracts/useKuriFactory.ts`)

1. **`initialiseKuriMarket`** (Lines 39-109)
   - **Current**: `initialiseKuriMarket(kuriAmount, participantCount, intervalType, wannabeMember, currencyIndex)`
   - **New**: `initialiseKuriMarketSponsored(kuriAmount, participantCount, intervalType, wannabeMember, currencyIndex)`
   - **Contract Function**: `initialiseKuriMarket(kuriAmount, participantCount, intervalType, wannabeMember, currencyIndex)`

### Implementation Strategy: Separate Sponsored Variants

**IMPORTANT**: Do NOT modify existing functions. Create new separate sponsored variants alongside existing ones.

**Pattern**:
```typescript
// Keep existing function unchanged
const requestMembership = useCallback(async () => {
  // Original implementation stays exactly the same
}, []);

// Add new sponsored variant 
const requestMembershipSponsored = useCallback(async () => {
  // Gas-sponsored implementation using Alchemy Account Kit
}, []);

// Return both variants
return {
  requestMembership,           // Original gas-paying version
  requestMembershipSponsored,  // New gasless version
  // ... other functions
};
```

**Benefits of Separate Variants**:
- **Zero breaking changes** - existing code continues working
- **Gradual migration** - can switch UI components one by one
- **Fallback safety** - can revert to gas-paying if sponsored fails
- **Testing flexibility** - can test both variants in parallel
- **Clean removal** - delete unused variants after full integration

### Implementation Requirements for Each Function

Each sponsored variant must:
1. **Create NEW function** with `Sponsored` suffix (don't modify existing)
2. Follow the exact pattern from `requestMembershipSponsored`
3. Use proper `encodeFunctionData` with correct ABI and args
4. Handle transaction receipts with `waitForUserOperationTransaction`
5. Maintain same error handling and loading states
6. Call `handleTransaction` for UI feedback
7. Refresh relevant data after successful transaction
8. **Export both variants** from the hook

---

## PHASE 2: Smart Wallet → EOA Address Resolution

### The Address Mapping Problem

**Before Gas Sponsorship**:
```
Contract Events → user: "0xEOA123..." → Supabase Profile Lookup ✅
```

**After Gas Sponsorship**:
```
Contract Events → user: "0xSmart456..." → Supabase Profile Lookup ❌ (No profile found)
```

### Solution: Alchemy Smart Account Owner Resolution

**Alchemy Smart Account Contract**:
```solidity
function owner() public view returns (address) {
    return _getStorage().owner;
}
```

**Resolution Flow**:
```
Event Data (Smart Wallet) → owner() Call → EOA Address → Supabase Profile Lookup ✅
```

### Files Requiring Address Resolution Updates

#### Event Processing Hooks

1. **`/src/hooks/useUserActivity.ts:28-72`**
   - **Issue**: Lines 33, 47-63 process events with user addresses
   - **Events Affected**: 
     - `membershipRequesteds.user`
     - `userDepositeds.user` 
     - `kuriSlotClaimeds.user`
   - **Fix**: Resolve smart wallet addresses to EOAs before processing

2. **`/src/hooks/useKuriMarketDetail.ts:47-84`**
   - **Issue**: Lines 67-82 process event data with user addresses
   - **Events Affected**:
     - `userDepositeds.user` (Line 68)
     - `membershipRequesteds.user` (Line 79)
     - `userAccepteds.user` (Line 55)
   - **Fix**: Resolve addresses in deposit history and member status

3. **`/src/hooks/useCircleMembers.ts:67-94`**
   - **Issue**: Lines 72, 113, 157 use user addresses for member management
   - **Functions Affected**: 
     - `getMemberStatus(request.user)` calls
     - Member filtering and status checks
   - **Fix**: Resolve addresses before contract state queries

#### GraphQL Query Processing

**File**: `/src/graphql/queries.ts`

**Queries with User Address Dependencies**:

1. **`USER_ACTIVITY_QUERY` (Lines 188-232)**
   - Filter: `user: { _eq: $userAddress }`
   - **Issue**: Query parameter needs to be smart wallet address, but we pass EOA
   - **Solution**: Need reverse mapping (EOA → Smart Wallet) for query filters

2. **Event Return Fields** (All Queries):
   - `membershipRequesteds.user`
   - `userDepositeds.user`
   - `userAccepteds.user` 
   - `kuriMarketDeployeds.caller`
   - **Issue**: These return smart wallet addresses
   - **Solution**: Resolve to EOAs in hook processing

### Implementation Strategy

#### 1. Create Address Resolution Utility

**File**: `/src/utils/addressResolution.ts`
```typescript
import { readContract } from "@wagmi/core";
import { config } from "../config/wagmi";

// Alchemy smart account ABI for owner() function
const SMART_ACCOUNT_ABI = [{
  "inputs": [],
  "name": "owner",
  "outputs": [{"internalType": "address", "name": "", "type": "address"}],
  "stateMutability": "view",
  "type": "function"
}];

export async function resolveSmartWalletToEOA(smartWalletAddress: string): Promise<string> {
  try {
    const eoaAddress = await readContract(config, {
      address: smartWalletAddress as `0x${string}`,
      abi: SMART_ACCOUNT_ABI,
      functionName: "owner"
    });
    return eoaAddress as string;
  } catch (error) {
    // If owner() call fails, assume it's already an EOA
    console.warn(`Failed to resolve smart wallet ${smartWalletAddress}, assuming EOA:`, error);
    return smartWalletAddress;
  }
}

export async function resolveMultipleAddresses(addresses: string[]): Promise<string[]> {
  return Promise.all(addresses.map(resolveSmartWalletToEOA));
}
```

#### 2. Update Event Processing Hooks

**useUserActivity.ts Update**:
```typescript
import { resolveSmartWalletToEOA } from "../utils/addressResolution";

const activity = useMemo(async (): Promise<UserActivity> => {
  if (!data) return { memberships: [], deposits: [], claims: [] };

  return {
    memberships: await Promise.all(data.membershipRequesteds.map(async (request) => ({
      marketId: request.contractAddress,
      timestamp: request.timestamp,
      userAddress: await resolveSmartWalletToEOA(request.user), // Resolved EOA
    }))),
    // ... similar for deposits and claims
  };
}, [data]);
```

#### 3. Handle Query Parameter Mapping

For `USER_ACTIVITY_QUERY`, we need reverse mapping (EOA → Smart Wallet) to query events properly.

**Options**:
1. **Store mapping in local state** when user makes sponsored transactions
2. **Query all events and filter client-side** after resolving addresses
3. **Create a mapping service** to track EOA ↔ Smart Wallet relationships

---

## Environment Variables Required

```env
# Already configured
VITE_ALCHEMY_API_KEY=your_alchemy_api_key
VITE_ALCHEMY_GAS_POLICY_ID=your_gas_policy_id
```

---

## Testing Strategy

### Phase 1 Testing
1. Test each sponsored function variant individually
2. Verify smart wallet deployment and address consistency
3. Confirm gas sponsorship is working (no gas fees charged)
4. Validate transaction receipts and event emission

### Phase 2 Testing  
1. Verify `owner()` calls resolve smart wallet addresses correctly
2. Test event processing with resolved addresses
3. Confirm Supabase profile lookups work with resolved EOAs
4. Validate user activity displays correctly

### Integration Testing
1. End-to-end user flow with gas-sponsored transactions
2. User profile consistency before/after sponsored transactions
3. Member management with mixed EOA/smart wallet addresses
4. Data integrity across all user-facing components

---

## Success Criteria

### Phase 1 Complete
- [ ] All 8 write functions have working sponsored variants
- [ ] No gas fees charged to users for sponsored transactions
- [ ] Transaction success/failure handling works correctly
- [ ] Smart wallet addresses appear in blockchain events

### Phase 2 Complete  
- [ ] Smart wallet addresses resolve to correct EOA addresses
- [ ] User profiles load correctly after sponsored transactions
- [ ] Member lists display accurate user information
- [ ] User activity shows complete transaction history
- [ ] No breaking changes to existing user experience

### Final Integration Complete
- [ ] Seamless transition between regular and sponsored transactions
- [ ] Consistent user identity across EOA and smart wallet interactions
- [ ] All existing functionality preserved
- [ ] Gas sponsorship reduces user friction significantly

---

## Implementation Notes

### Key Learnings from `requestMembershipSponsored`
1. **Custom signing is crucial** - Para signatures need proper formatting for Ethereum
2. **Salt generation matters** - Must be deterministic for consistent wallet addresses
3. **Receipt handling differs** - Use `waitForUserOperationTransaction` not `getUserOperationReceipt`
4. **Error handling** - Account Abstraction errors can be cryptic, need good logging

### Potential Issues to Watch
1. **Smart wallet deployment gas** - First transaction per user deploys wallet (sponsored)
2. **Nonce management** - AA handles nonces differently than EOA transactions
3. **Transaction timing** - UserOperations can take longer to process
4. **Event indexing delay** - Smart wallet events might take longer to appear in subgraph

### Performance Considerations
1. **Address resolution calls** - Cache resolved addresses to avoid repeated calls
2. **Batch processing** - Resolve multiple addresses in parallel where possible
3. **Fallback handling** - Gracefully handle resolution failures
4. **Query optimization** - Consider impact on GraphQL query performance

---

## Implementation Phases

### Phase 1: Create Sponsored Variants
1. **Add sponsored functions** alongside existing ones (don't replace)
2. **Test each variant** independently
3. **Update UI components** to use sponsored variants where desired
4. **Keep both versions** available during transition period

### Phase 2: Address Resolution
1. **Implement address resolution utilities**
2. **Update event processing hooks**
3. **Test data consistency** with resolved addresses

### Phase 3: Migration & Cleanup
1. **Fully migrate UI** to use sponsored variants
2. **Validate all functionality** works with gasless transactions
3. **Remove unused original functions** once migration is complete
4. **Clean up imports** and references

## Next Steps

1. **Start with Phase 1** - Implement sponsored variants for all write functions
2. **Test thoroughly** - Ensure each function works independently
3. **Implement Phase 2** - Add address resolution utilities
4. **Update hooks** - Modify event processing to resolve addresses
5. **Integration testing** - End-to-end validation
6. **Phase 3 cleanup** - Remove unused functions after full migration
7. **Documentation** - Update user guides and developer docs

---

*This TODO serves as the complete implementation guide for gas-sponsored transactions and address resolution in the kuri_web application.*