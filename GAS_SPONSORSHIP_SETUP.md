# Gas Sponsorship Setup Guide

This guide explains how to test the new gas-sponsored `requestMembership` function using Alchemy Account Kit integration.

## What's Been Added

### 🚀 New Function: `requestMembershipSponsored`

A new gas-sponsored version of `requestMembership` has been added to the `useKuriCore` hook that uses Alchemy's Account Kit for gasless transactions.

### Updated Components

The following components now use the sponsored version for testing:
- `src/components/markets/MarketCard.tsx`
- `src/components/markets/MarketDetails.tsx`

## Setup Instructions

### 1. Environment Variables

Copy `.env.example` to `.env.local` and fill in your values:

```bash
cp .env.example .env.local
```

You'll need:
- `VITE_ALCHEMY_API_KEY` (existing)
- `VITE_ALCHEMY_GAS_POLICY_ID` (new - see setup below)

### 2. Create Alchemy Gas Manager Policy

1. Go to your [Alchemy Dashboard](https://dashboard.alchemy.com/)
2. Navigate to "Gas Manager"
3. Click "Create Policy"
4. Configure your policy:
   - **Name**: "Kuri Test Policy"
   - **Chain**: Base Sepolia
   - **Spending Rules**: Set limits as needed (e.g., $10/month)
   - **Allowlist**: Add your test user addresses (optional)
   - **Policy Duration**: Set appropriate timeframe
5. Copy the Policy ID to your `.env.local` file

### 3. Test the Integration

1. Start the development server:
```bash
npm run dev
```

2. Navigate to any market and click "Join Circle"

3. Check the browser console for logs:
   - `🚀 Sending gas-sponsored UserOperation...`
   - `UserOperation Hash: 0x...`
   - `🎉 Gas fees sponsored by Alchemy Gas Manager!`

## How It Works

### Technical Flow

1. **User Action**: User clicks "Join Circle"
2. **Para Wallet**: Signs the UserOperation (not a transaction)
3. **Alchemy Client**: Creates smart account client with gas policy
4. **UserOperation**: Encoded contract call sent to alt-mempool
5. **Bundler**: Picks up UserOperation and bundles it
6. **Gas Manager**: Validates against policy and sponsors gas
7. **EntryPoint**: Executes on KuriCore contract
8. **Result**: User joined circle, paid $0 in gas fees

### Key Differences from Traditional Flow

| Traditional | Gas Sponsored |
|-------------|---------------|
| User needs ETH for gas | No ETH required |
| Direct transaction | UserOperation → Bundler |
| User pays gas fees | Alchemy policy pays gas |
| Single signature | User + Paymaster signatures |

## Testing Checklist

- [ ] Environment variables configured
- [ ] Alchemy Gas Manager policy created
- [ ] Policy ID added to `.env.local`
- [ ] Development server running
- [ ] Browser console shows sponsored transaction logs
- [ ] Transaction succeeds without user paying gas
- [ ] Market membership status updates correctly

## Debugging

### Common Issues

1. **"Para wallet not available"**
   - Ensure user is logged in with Para
   - Check that `account.embedded.wallets?.[0]` exists

2. **"Invalid gas policy"**
   - Verify `VITE_ALCHEMY_GAS_POLICY_ID` is correct
   - Check policy is active in Alchemy dashboard
   - Ensure policy supports Base Sepolia

3. **"UserOperation failed"**
   - Check Alchemy dashboard for policy usage/limits
   - Verify smart account has sufficient permissions
   - Check browser console for detailed error messages

### Console Logs to Look For

**Success Flow:**
```
🚀 Sending gas-sponsored UserOperation...
UserOperation Hash: 0xabcd...
🎉 Gas fees sponsored by Alchemy Gas Manager!
Transaction Receipt: { ... }
```

**Error Flow:**
```
Gas-sponsored transaction failed: Error { ... }
```

## Next Steps

Once testing is successful, you can:

1. **Expand to Other Functions**: Apply the same pattern to `deposit`, `claimKuriAmount`, etc.
2. **Policy Optimization**: Adjust gas policies based on actual usage patterns
3. **Error Handling**: Implement fallback to traditional transactions if sponsorship fails
4. **User Education**: Add UI indicators showing gas is sponsored

## Rollback Instructions

To rollback to traditional transactions, simply change the function calls back:

```typescript
// Change this:
await requestMembershipSponsored();

// Back to this:
await requestMembership();
```

Both functions remain available in the `useKuriCore` hook.